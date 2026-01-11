/**
 * Get Generation Job (Agent Orchestration)
 * - Studio UI에서 job/steps/artifacts 상태 조회 용도
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../middleware/auth';
import { query } from '../lib/database';
import { isUuid } from '../lib/validation';

export async function getGenerationJob(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const user = await requireAuth(request, context);

    const projectId = request.params.projectId;
    if (!projectId) {
      return { status: 400, jsonBody: { success: false, error: 'Project ID is required' } };
    }

    if (!isUuid(projectId)) {
      return { status: 400, jsonBody: { success: false, error: 'Invalid projectId (UUID required)' } };
    }
    
    // 특정 Job ID가 쿼리 파라미터로 주어진 경우
    const jobId = request.query.get('jobId');

    // 프로젝트 소유권 확인
    const projectCheck = await query(`SELECT id FROM projects WHERE id = $1 AND user_id = $2`, [
      projectId,
      user.userId,
    ]);
    if (projectCheck.length === 0) {
      return { status: 404, jsonBody: { success: false, error: 'Project not found or access denied' } };
    }

    // 모든 Job 조회 (AI 모델별 결과 비교를 위해)
    const allJobs = await query(
      `SELECT * FROM generation_jobs WHERE project_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
      [projectId, user.userId]
    );
    
    if (allJobs.length === 0) {
      return { status: 200, jsonBody: { success: true, job: null, jobs: [], steps: [], artifacts: [] } };
    }

    // 특정 Job ID가 주어진 경우 해당 Job 선택, 아니면 가장 최근 Job
    let job = allJobs[0];
    if (jobId && isUuid(jobId)) {
      const selectedJob = allJobs.find((j: any) => j.id === jobId);
      if (selectedJob) {
        job = selectedJob;
      }
    }
    
    // 현재 Job의 steps/artifacts
    const steps = await query(
      `SELECT * FROM generation_steps WHERE job_id = $1 ORDER BY order_index ASC`,
      [job.id]
    );
    const artifacts = await query(
      `SELECT * FROM generation_artifacts WHERE job_id = $1 ORDER BY artifact_type ASC`,
      [job.id]
    );
    
    // 모든 Job의 요약 정보 (AI 모델별 선택을 위해)
    const jobsSummary = allJobs.map((j: any) => ({
      id: j.id,
      ai_model: j.ai_model,
      status: j.status,
      created_at: j.created_at,
      updated_at: j.updated_at,
    }));

    return { status: 200, jsonBody: { success: true, job, jobs: jobsSummary, steps, artifacts } };
  } catch (error) {
    context.error('[GetGenerationJob] Error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { status: 401, jsonBody: { success: false, error: 'Unauthorized' } };
    }
    return { status: 500, jsonBody: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } };
  }
}

app.http('getGenerationJob', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'generation/job/{projectId}',
  handler: getGenerationJob,
});

