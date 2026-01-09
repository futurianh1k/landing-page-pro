/**
 * Generation Job Worker (Storage Queue Trigger)
 *
 * 주의:
 * - 로컬 개발은 Azurite Queue를 사용합니다(AzureWebJobsStorage).
 *
 * 참고자료(외부):
 * - Azure Functions Node.js v4 Storage Queue trigger 예제:
 *   https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-storage-queue-trigger
 */

import { app, InvocationContext, output } from '@azure/functions';
import { transaction } from '../lib/database';
import { generateContent } from '../lib/ai-services';
import { planGenerationSteps, RequestedOutputs, GenerationOptions, GenerationStepType } from '../lib/agent/plan';

const jobQueueOutput = output.storageQueue({
  queueName: 'generation-jobs',
  connection: 'AzureWebJobsStorage',
});

interface JobQueueMessage {
  jobId: string;
}

function safeJsonParse<T>(value: any): T | null {
  try {
    if (typeof value === 'string') return JSON.parse(value) as T;
    return value as T;
  } catch {
    return null;
  }
}

async function runStep(
  stepType: GenerationStepType,
  aiModel: 'gemini' | 'claude' | 'chatgpt',
  projectId: string,
  documentContent: string,
  context: InvocationContext
): Promise<{ output?: any; log?: string; artifacts?: Array<{ type: 'document' | 'infographic' | 'slides'; contentText?: string; contentJson?: any }> }> {
  // MVP: 실제 이미지 생성/웹검색은 옵션/키 설정 이후 확장(현재는 단계 skeleton + 기본 생성만 제공)
  // 이후 단계에서 enableWebSearch/enableImageGeneration 옵션에 따라 구현을 확장합니다.

  if (stepType === 'interpret') {
    const system = `당신은 교육 콘텐츠 제작용 에이전트입니다. 사용자의 입력을 분석해 핵심 목표/대상/제약/산출물별 요구사항을 구조화된 JSON으로 정리하세요.
출력은 JSON만 반환하세요.`;
    const prompt = `프로젝트ID: ${projectId}\n\n사용자 입력:\n${documentContent}\n\nJSON 스키마 예시:\n{\n  "title": "...",\n  "targetAudience": "...",\n  "goals": ["..."],\n  "keyTopics": ["..."],\n  "constraints": ["..."],\n  "suggestedSearchQueries": ["..."],\n  "designStyle": {"tone":"...", "colors":["..."], "layout":"..."}\n}`;
    const text = await generateContent(aiModel, prompt, system);
    const parsed = safeJsonParse<any>(text) ?? { raw: text };
    return { output: parsed, log: '입력 해석 완료' };
  }

  if (stepType === 'generate_document') {
    const system = `당신은 교육 콘텐츠 기획자입니다. 사용자의 입력을 바탕으로 '강의안(문서)'을 한국어로 작성하세요.`;
    const prompt = `사용자 입력:\n${documentContent}\n\n요구사항:\n- 목차(요약) + 본문\n- 5회차 구성(회차별 목표/시간/활동)\n- 안전/주의사항(특히 시니어 대상이면 강조)\n\n형식: Markdown`;
    const md = await generateContent(aiModel, prompt, system);
    return {
      log: '강의안(문서) 생성 완료',
      artifacts: [{ type: 'document', contentText: md }],
    };
  }

  if (stepType === 'generate_infographic') {
    const system = `당신은 인포그래픽 기획자입니다. 사용자의 입력을 바탕으로 인포그래픽 설계 JSON을 작성하세요. JSON만 반환하세요.`;
    const prompt = `사용자 입력:\n${documentContent}\n\nJSON 스키마:\n{\n  \"title\": \"...\",\n  \"subtitle\": \"...\",\n  \"sections\": [\n    {\"heading\":\"...\",\"bullets\":[\"...\"],\"iconHint\":\"...\"}\n  ],\n  \"palette\": [\"#...\"],\n  \"illustrationHints\": [\"...\"]\n}`;
    const text = await generateContent(aiModel, prompt, system);
    const json = safeJsonParse<any>(text) ?? { raw: text };
    return {
      log: '인포그래픽 설계 생성 완료',
      artifacts: [{ type: 'infographic', contentJson: json }],
    };
  }

  if (stepType === 'generate_slides') {
    const system = `당신은 교안 슬라이드 설계자입니다. 사용자의 입력을 바탕으로 슬라이드 덱 구조 JSON을 작성하세요. JSON만 반환하세요.`;
    const prompt = `사용자 입력:\n${documentContent}\n\nJSON 스키마:\n{\n  \"deckTitle\": \"...\",\n  \"slides\": [\n    {\"title\":\"...\",\"bullets\":[\"...\"],\"speakerNotes\":\"...\",\"visualHint\":\"...\"}\n  ]\n}`;
    const text = await generateContent(aiModel, prompt, system);
    const json = safeJsonParse<any>(text) ?? { raw: text };
    return {
      log: '슬라이드 설계 생성 완료',
      artifacts: [{ type: 'slides', contentJson: json }],
    };
  }

  // web_search / design_assets: 추후 키/프로바이더 추가 시 구현
  if (stepType === 'web_search') {
    return { log: '웹 검색 단계: 아직 프로바이더 미구현(옵션 기반 확장 예정)', output: { skipped: true } };
  }
  if (stepType === 'design_assets') {
    return { log: '이미지 생성 단계: 아직 미구현(옵션 기반 확장 예정)', output: { skipped: true } };
  }

  return { log: `알 수 없는 stepType: ${stepType}`, output: { skipped: true } };
}

export async function generationJobWorker(queueItem: unknown, context: InvocationContext): Promise<void> {
  const msg = safeJsonParse<JobQueueMessage>(queueItem) as JobQueueMessage | null;
  if (!msg?.jobId) {
    context.warn('[GenerationJobWorker] Missing jobId in queue message');
    return;
  }

  const jobId = msg.jobId;
  context.log(`[GenerationJobWorker] Processing jobId=${jobId}`);

  let shouldRequeue = false;

  await transaction(async (client) => {
    // job + project + steps 조회(락 걸고 단일 worker만 진행)
    const jobRes = await client.query(
      `SELECT * FROM generation_jobs WHERE id = $1 FOR UPDATE`,
      [jobId]
    );
    if (jobRes.rows.length === 0) {
      context.warn(`[GenerationJobWorker] Job not found: ${jobId}`);
      return;
    }
    const job = jobRes.rows[0];

    // 완료/실패면 종료
    if (job.status === 'completed' || job.status === 'failed') {
      context.log(`[GenerationJobWorker] Job already ${job.status}: ${jobId}`);
      return;
    }

    const projectId = job.project_id as string;
    const aiModel = (job.ai_model as any) as 'gemini' | 'claude' | 'chatgpt';

    // 입력 원문은 projects.document_content에서 읽기
    const projRes = await client.query(`SELECT document_content FROM projects WHERE id = $1`, [projectId]);
    const documentContent = projRes.rows[0]?.document_content || '';

    const nextStepRes = await client.query(
      `SELECT * FROM generation_steps WHERE job_id = $1 AND status IN ('pending') ORDER BY order_index ASC LIMIT 1`,
      [jobId]
    );

    if (nextStepRes.rows.length === 0) {
      // 모든 step 완료
      await client.query(`UPDATE generation_jobs SET status = 'completed', updated_at = NOW() WHERE id = $1`, [
        jobId,
      ]);
      await client.query(`UPDATE projects SET status = 'completed', updated_at = NOW() WHERE id = $1`, [projectId]);
      context.log(`[GenerationJobWorker] Job completed: ${jobId}`);
      return;
    }

    const step = nextStepRes.rows[0];
    const stepId = step.id as string;
    const stepType = step.step_type as GenerationStepType;
    const stepOrderIndex = Number(step.order_index ?? 0);

    // step 시작
    await client.query(
      `UPDATE generation_steps SET status = 'processing', started_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [stepId]
    );
    await client.query(
      `UPDATE generation_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1`,
      [jobId]
    );

    try {
      const result = await runStep(stepType, aiModel, projectId, documentContent, context);

      // 산출물 반영
      if (result.artifacts?.length) {
        for (const a of result.artifacts) {
          await client.query(
            `UPDATE generation_artifacts
             SET status = 'completed',
                 content_text = COALESCE($3, content_text),
                 content_json = COALESCE($4::jsonb, content_json),
                 updated_at = NOW()
             WHERE job_id = $1 AND artifact_type = $2`,
            [jobId, a.type, a.contentText ?? null, a.contentJson ? JSON.stringify(a.contentJson) : null]
          );
        }
      }

      await client.query(
        `UPDATE generation_steps
         SET status = 'completed',
             completed_at = NOW(),
             output = $2::jsonb,
             log = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [stepId, JSON.stringify(result.output ?? {}), result.log ?? null]
      );

      // UI에서 진행률 표시용(current_step_index)
      await client.query(
        `UPDATE generation_jobs SET current_step_index = $2, updated_at = NOW() WHERE id = $1`,
        [jobId, stepOrderIndex + 1]
      );

      context.log(`[GenerationJobWorker] Step completed: ${stepType} (${stepId})`);

      // 다음 step이 남아있으면 worker를 다시 큐에 넣어서 연속 실행합니다.
      const remaining = await client.query(
        `SELECT 1 FROM generation_steps WHERE job_id = $1 AND status = 'pending' LIMIT 1`,
        [jobId]
      );
      if (remaining.rows.length > 0) {
        shouldRequeue = true;
      } else {
        // 방금 step이 마지막이었으면 즉시 job을 완료 처리합니다.
        await client.query(
          `UPDATE generation_jobs SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [jobId]
        );
        await client.query(`UPDATE projects SET status = 'completed', updated_at = NOW() WHERE id = $1`, [
          projectId,
        ]);
        context.log(`[GenerationJobWorker] Job completed: ${jobId}`);
      }
    } catch (e: any) {
      const message = e?.message || String(e);
      await client.query(
        `UPDATE generation_steps SET status = 'failed', error = $2, completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [stepId, message]
      );
      await client.query(
        `UPDATE generation_jobs SET status = 'failed', error = $2, updated_at = NOW() WHERE id = $1`,
        [jobId, message]
      );
      await client.query(`UPDATE projects SET status = 'failed', updated_at = NOW() WHERE id = $1`, [projectId]);
      context.error(`[GenerationJobWorker] Step failed: ${stepType} (${stepId})`, e);
    }
  });

  if (shouldRequeue) {
    context.extraOutputs.set(jobQueueOutput, JSON.stringify({ jobId }));
    context.log(`[GenerationJobWorker] Re-queued jobId=${jobId} for next step`);
  }
}

app.storageQueue('generationJobWorker', {
  queueName: 'generation-jobs',
  connection: 'AzureWebJobsStorage',
  handler: generationJobWorker,
  extraOutputs: [jobQueueOutput],
});

