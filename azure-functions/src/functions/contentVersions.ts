/**
 * contentVersions
 * 
 * 콘텐츠 버전 관리 API
 * - GET: 레슨의 버전 이력 조회
 * - POST: 새 버전 저장
 * - PUT: 특정 버전으로 복원
 * 
 * 작성일: 2026-01-10
 * 참고: history/2026-01-10_project-coursebuilder-integration-plan.md
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query, transaction } from '../lib/database';

// ============================================================
// 타입 정의
// ============================================================

interface ContentVersion {
  id: string;
  lesson_id: string;
  project_id?: string;
  version_number: number;
  content_type: string;
  content_snapshot: any;
  created_by: string;
  ai_model?: string;
  notes?: string;
  created_at: string;
}

interface CreateVersionRequest {
  lessonId: string;
  contentType: string;
  contentSnapshot: any;
  createdBy?: string;
  aiModel?: string;
  notes?: string;
}

interface RestoreVersionRequest {
  versionId: string;
  lessonId: string;
}

// ============================================================
// 버전 이력 조회
// ============================================================

async function getContentVersions(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const lessonId = request.params.lessonId;
  const contentType = request.query.get('contentType') || 'full';

  context.log(`[getContentVersions] lessonId=${lessonId}, contentType=${contentType}`);

  try {
    let whereClause = 'WHERE lesson_id = $1';
    const params: any[] = [lessonId];

    if (contentType !== 'all') {
      whereClause += ' AND content_type = $2';
      params.push(contentType);
    }

    const versions = await query<ContentVersion>(
      `SELECT id, lesson_id, project_id, version_number, content_type, 
              content_snapshot, created_by, ai_model, notes, created_at
       FROM content_versions
       ${whereClause}
       ORDER BY version_number DESC, created_at DESC
       LIMIT 50`,
      params
    );

    // 현재 버전 번호 조회
    const lessonRows = await query<{ current_version: number }>(
      `SELECT current_version FROM lessons WHERE id = $1`,
      [lessonId]
    );

    const currentVersion = lessonRows[0]?.current_version || 1;

    return jsonResponse(200, {
      success: true,
      data: {
        versions,
        currentVersion,
        totalCount: versions.length,
      },
    });

  } catch (error) {
    context.error('[getContentVersions] Error:', error);
    return jsonResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

// ============================================================
// 새 버전 저장
// ============================================================

async function createContentVersion(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('[createContentVersion] 요청 수신');

  try {
    const body = await request.json() as CreateVersionRequest;
    const { lessonId, contentType, contentSnapshot, createdBy, aiModel, notes } = body;

    if (!lessonId || !contentType || !contentSnapshot) {
      return jsonResponse(400, {
        success: false,
        error: 'lessonId, contentType, and contentSnapshot are required',
      });
    }

    // 트랜잭션으로 버전 생성
    const result = await transaction(async (client) => {
      // 현재 최대 버전 번호 조회
      const maxVersionResult = await client.query(
        `SELECT COALESCE(MAX(version_number), 0) as max_version 
         FROM content_versions 
         WHERE lesson_id = $1 AND content_type = $2`,
        [lessonId, contentType]
      );
      
      const newVersionNumber = maxVersionResult.rows[0].max_version + 1;

      // 레슨의 project_id 조회
      const lessonResult = await client.query(
        `SELECT project_id FROM lessons WHERE id = $1`,
        [lessonId]
      );
      const projectId = lessonResult.rows[0]?.project_id;

      // 새 버전 생성
      const insertResult = await client.query(
        `INSERT INTO content_versions 
         (lesson_id, project_id, version_number, content_type, content_snapshot, created_by, ai_model, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, version_number, created_at`,
        [lessonId, projectId, newVersionNumber, contentType, JSON.stringify(contentSnapshot), 
         createdBy || 'user', aiModel || null, notes || null]
      );

      const newVersion = insertResult.rows[0];

      // lessons 테이블의 current_version 업데이트
      await client.query(
        `UPDATE lessons SET current_version = $1, updated_at = NOW() WHERE id = $2`,
        [newVersionNumber, lessonId]
      );

      return {
        versionId: newVersion.id,
        versionNumber: newVersion.version_number,
        createdAt: newVersion.created_at,
      };
    });

    context.log(`[createContentVersion] 버전 생성 완료: v${result.versionNumber}`);

    return jsonResponse(201, {
      success: true,
      data: result,
      message: `버전 ${result.versionNumber}이(가) 저장되었습니다.`,
    });

  } catch (error) {
    context.error('[createContentVersion] Error:', error);
    return jsonResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

// ============================================================
// 특정 버전으로 복원
// ============================================================

async function restoreContentVersion(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('[restoreContentVersion] 요청 수신');

  try {
    const body = await request.json() as RestoreVersionRequest;
    const { versionId, lessonId } = body;

    if (!versionId || !lessonId) {
      return jsonResponse(400, {
        success: false,
        error: 'versionId and lessonId are required',
      });
    }

    // 트랜잭션으로 복원 처리
    const result = await transaction(async (client) => {
      // 복원할 버전 조회
      const versionResult = await client.query(
        `SELECT * FROM content_versions WHERE id = $1 AND lesson_id = $2`,
        [versionId, lessonId]
      );

      if (versionResult.rows.length === 0) {
        throw new Error('Version not found');
      }

      const targetVersion = versionResult.rows[0];

      // 현재 상태를 새 버전으로 저장 (복원 전 백업)
      const maxVersionResult = await client.query(
        `SELECT COALESCE(MAX(version_number), 0) as max_version 
         FROM content_versions 
         WHERE lesson_id = $1 AND content_type = $2`,
        [lessonId, targetVersion.content_type]
      );
      
      const newVersionNumber = maxVersionResult.rows[0].max_version + 1;

      // 복원된 콘텐츠를 새 버전으로 저장
      const insertResult = await client.query(
        `INSERT INTO content_versions 
         (lesson_id, project_id, version_number, content_type, content_snapshot, created_by, notes)
         VALUES ($1, $2, $3, $4, $5, 'restore', $6)
         RETURNING id, version_number, created_at`,
        [
          lessonId, 
          targetVersion.project_id, 
          newVersionNumber, 
          targetVersion.content_type, 
          JSON.stringify(targetVersion.content_snapshot),
          `버전 ${targetVersion.version_number}에서 복원됨`
        ]
      );

      const restoredVersion = insertResult.rows[0];

      // lessons 테이블의 current_version 업데이트
      await client.query(
        `UPDATE lessons SET current_version = $1, updated_at = NOW() WHERE id = $2`,
        [newVersionNumber, lessonId]
      );

      return {
        restoredFromVersion: targetVersion.version_number,
        newVersionNumber: restoredVersion.version_number,
        newVersionId: restoredVersion.id,
        contentType: targetVersion.content_type,
        contentSnapshot: targetVersion.content_snapshot,
      };
    });

    context.log(`[restoreContentVersion] 복원 완료: v${result.restoredFromVersion} → v${result.newVersionNumber}`);

    return jsonResponse(200, {
      success: true,
      data: result,
      message: `버전 ${result.restoredFromVersion}에서 복원되어 버전 ${result.newVersionNumber}으로 저장되었습니다.`,
    });

  } catch (error) {
    context.error('[restoreContentVersion] Error:', error);
    return jsonResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

// ============================================================
// 메인 핸들러
// ============================================================

async function contentVersionsHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  }

  switch (request.method) {
    case 'GET':
      return getContentVersions(request, context);
    case 'POST':
      return createContentVersion(request, context);
    case 'PUT':
      return restoreContentVersion(request, context);
    default:
      return jsonResponse(405, { success: false, error: 'Method not allowed' });
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

app.http('contentVersions', {
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'course/versions/{lessonId?}',
  handler: contentVersionsHandler,
});
