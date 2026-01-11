/**
 * convertProjectToCourse
 * 
 * 프로젝트 생성 결과를 코스빌더로 변환
 * - 프로젝트의 커리큘럼 세션 → 코스의 모듈/레슨으로 매핑
 * - 원본 프로젝트와 연결 유지
 * 
 * 작성일: 2026-01-10
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { transaction, query } from '../lib/database';

// ============================================================
// 타입 정의
// ============================================================

interface ConvertRequest {
  projectId: string;
  newCourseTitle?: string;      // 새 코스 제목 (없으면 프로젝트 제목 사용)
  targetCourseId?: string;      // 기존 코스에 추가할 경우
}

interface SessionInfo {
  sessionNumber: number;
  title: string;
  duration?: string;
  keyTopics?: string[];
  expectedOutcome?: string;
  learningObjectives?: string[];
}

interface CurriculumOutput {
  title: string;
  totalDuration?: string;
  learningObjectives?: string[];
  sessions: SessionInfo[];
}

interface ConversionResult {
  courseId: string;
  courseTitle: string;
  modulesCreated: number;
  lessonsCreated: number;
  linkedProjectId: string;
}

// ============================================================
// 메인 함수
// ============================================================

export async function convertProjectToCourse(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('[convertProjectToCourse] 요청 수신');

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  }

  try {
    // 요청 파싱
    const body = await request.json() as ConvertRequest;
    const { projectId, newCourseTitle, targetCourseId } = body;

    if (!projectId) {
      return jsonResponse(400, { success: false, error: 'projectId is required' });
    }

    context.log(`[convertProjectToCourse] projectId=${projectId}, targetCourseId=${targetCourseId || 'new'}`);

    // 1. 프로젝트 정보 조회
    const projectRows = await query<any>(
      `SELECT id, user_id, title, description, education_target, education_duration, education_session
       FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectRows.length === 0) {
      return jsonResponse(404, { success: false, error: 'Project not found' });
    }

    const project = projectRows[0];
    context.log(`[convertProjectToCourse] 프로젝트 조회 완료: ${project.title}`);

    // 2. 프로젝트의 최신 generation_job 조회
    const jobRows = await query<any>(
      `SELECT id FROM generation_jobs 
       WHERE project_id = $1 AND status = 'completed'
       ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    );

    if (jobRows.length === 0) {
      return jsonResponse(400, { 
        success: false, 
        error: 'No completed generation job found for this project' 
      });
    }

    const jobId = jobRows[0].id;

    // 3. curriculum_design 단계의 output 조회
    const stepRows = await query<any>(
      `SELECT output FROM generation_steps 
       WHERE job_id = $1 AND step_type = 'curriculum_design' AND status = 'completed'`,
      [jobId]
    );

    if (stepRows.length === 0) {
      return jsonResponse(400, { 
        success: false, 
        error: 'No curriculum found in generation job' 
      });
    }

    // curriculum output 파싱
    const stepOutput = stepRows[0].output;
    let curriculumJson: CurriculumOutput | null = null;

    // curriculumJson이 있으면 사용, 없으면 세션 수 기반으로 기본 생성
    if (stepOutput?.curriculumJson) {
      curriculumJson = stepOutput.curriculumJson as CurriculumOutput;
    } else if (stepOutput?.curriculum) {
      // Markdown에서 파싱 시도 (기본 구조)
      const sessionCount = project.education_session || 1;
      curriculumJson = {
        title: project.title,
        totalDuration: project.education_duration,
        sessions: Array.from({ length: sessionCount }, (_, i) => ({
          sessionNumber: i + 1,
          title: `세션 ${i + 1}`,
          keyTopics: [],
        })),
      };
    }

    if (!curriculumJson || !curriculumJson.sessions || curriculumJson.sessions.length === 0) {
      return jsonResponse(400, { 
        success: false, 
        error: 'Invalid curriculum structure' 
      });
    }

    context.log(`[convertProjectToCourse] 커리큘럼 파싱 완료: ${curriculumJson.sessions.length}개 세션`);

    // 4. 트랜잭션으로 코스/모듈/레슨 생성
    const result = await transaction(async (client) => {
      let courseId: string;
      let courseTitle: string;

      // 4.1 코스 생성 또는 선택
      if (targetCourseId) {
        // 기존 코스 확인
        const existingCourse = await client.query(
          `SELECT id, title FROM courses WHERE id = $1`,
          [targetCourseId]
        );
        
        if (existingCourse.rows.length === 0) {
          throw new Error('Target course not found');
        }
        
        courseId = targetCourseId;
        courseTitle = existingCourse.rows[0].title;
        context.log(`[convertProjectToCourse] 기존 코스에 추가: ${courseTitle}`);
      } else {
        // 새 코스 생성
        courseTitle = newCourseTitle || curriculumJson.title || project.title;
        
        const newCourse = await client.query(
          `INSERT INTO courses (owner_id, title, description, target_audience, total_duration, status)
           VALUES ($1, $2, $3, $4, $5, 'draft')
           RETURNING id`,
          [
            project.user_id,
            courseTitle,
            project.description,
            project.education_target,
            curriculumJson.totalDuration || project.education_duration,
          ]
        );
        
        courseId = newCourse.rows[0].id;
        context.log(`[convertProjectToCourse] 새 코스 생성: ${courseTitle}`);
      }

      // 4.2 기존 모듈의 최대 order_index 조회
      const maxOrderResult = await client.query(
        `SELECT COALESCE(MAX(order_index), -1) as max_order FROM course_modules WHERE course_id = $1`,
        [courseId]
      );
      let moduleOrderIndex = maxOrderResult.rows[0].max_order + 1;

      // 4.3 세션별로 모듈/레슨 생성
      let modulesCreated = 0;
      let lessonsCreated = 0;
      const sessionMapping: Record<number, { moduleId: string; lessonId: string }> = {};

      for (const session of curriculumJson.sessions) {
        // 모듈 생성
        const moduleTitle = `모듈 ${session.sessionNumber}: ${session.title}`;
        const moduleSummary = session.expectedOutcome || session.keyTopics?.join(', ') || '';
        
        const moduleResult = await client.query(
          `INSERT INTO course_modules (course_id, title, summary, order_index)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [courseId, moduleTitle, moduleSummary, moduleOrderIndex]
        );
        
        const moduleId = moduleResult.rows[0].id;
        modulesCreated++;
        moduleOrderIndex++;

        // 레슨 생성 (프로젝트 연결 + 소스 추적)
        const learningObjectives = session.learningObjectives?.join('\n') || 
                                   session.keyTopics?.join('\n') || '';
        
        const lessonResult = await client.query(
          `INSERT INTO lessons (module_id, project_id, title, order_index, learning_objectives, content_source)
           VALUES ($1, $2, $3, $4, $5, 'ai_generated')
           RETURNING id`,
          [moduleId, projectId, session.title, 0, learningObjectives]
        );
        
        const lessonId = lessonResult.rows[0].id;
        lessonsCreated++;

        sessionMapping[session.sessionNumber] = { moduleId, lessonId };
      }

      // 4.4 프로젝트-코스 연결 기록
      await client.query(
        `INSERT INTO project_course_links (project_id, course_id, link_type, session_mapping)
         VALUES ($1, $2, 'project_to_course', $3)
         ON CONFLICT (project_id, course_id) DO UPDATE SET
           session_mapping = $3`,
        [projectId, courseId, JSON.stringify(sessionMapping)]
      );

      return {
        courseId,
        courseTitle,
        modulesCreated,
        lessonsCreated,
        linkedProjectId: projectId,
      } as ConversionResult;
    });

    context.log(`[convertProjectToCourse] 변환 완료: ${result.modulesCreated}개 모듈, ${result.lessonsCreated}개 레슨`);

    return jsonResponse(200, {
      success: true,
      data: result,
      message: `프로젝트가 코스빌더로 성공적으로 변환되었습니다. (모듈: ${result.modulesCreated}개, 레슨: ${result.lessonsCreated}개)`,
    });

  } catch (error) {
    context.error('[convertProjectToCourse] Error:', error);
    return jsonResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

// ============================================================
// 헬퍼 함수
// ============================================================

function jsonResponse(status: number, body: any): HttpResponseInit {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

// ============================================================
// 라우트 등록
// ============================================================

app.http('convertProjectToCourse', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'project/convert-to-course',
  handler: convertProjectToCourse,
});
