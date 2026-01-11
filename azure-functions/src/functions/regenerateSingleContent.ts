/**
 * regenerateSingleContent
 * 
 * 특정 콘텐츠만 새로 생성 (기존 컨텍스트 활용)
 * - 전체 파이프라인 실행 X
 * - 특정 콘텐츠 타입만 빠르게 재생성
 * 
 * 작성일: 2026-01-10
 * 참고: history/2026-01-10_project-coursebuilder-integration-plan.md
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { query } from '../lib/database';
import { getTargetAudienceGuide } from '../lib/agent/prompts';

// ============================================================
// 타입 정의
// ============================================================

type ContentType = 'slides' | 'quiz' | 'lab' | 'reading' | 'summary';
type AiModel = 'gemini' | 'claude' | 'chatgpt';

interface RegenerateSingleRequest {
  lessonId: string;
  contentType: ContentType;
  aiModel: AiModel;
  style?: string;  // "더 시각적으로", "간결하게", "초보자용으로" 등
}

// ============================================================
// 스타일별 추가 지시사항
// ============================================================

const STYLE_INSTRUCTIONS: Record<string, string> = {
  '시각적': '시각적 요소를 강조하고, 다이어그램이나 이미지 활용을 권장하는 방향으로 구성해주세요.',
  '간결': '핵심만 간결하게 정리하고, 불필요한 설명은 최소화해주세요.',
  '상세': '각 항목을 상세하게 설명하고, 예시와 배경 설명을 풍부하게 포함해주세요.',
  '초보자': '기초부터 차근차근 설명하고, 전문 용어는 쉬운 말로 풀어서 설명해주세요.',
  '전문가': '전문적인 용어와 고급 개념을 포함하고, 심화 내용을 다뤄주세요.',
  '실무': '실제 업무에서 바로 적용할 수 있는 실용적인 내용 위주로 구성해주세요.',
  '인터랙티브': '참여형 활동과 상호작용을 강조하는 방향으로 구성해주세요.',
};

// ============================================================
// AI 모델 호출
// ============================================================

async function callAiModel(
  aiModel: AiModel,
  prompt: string,
  systemPrompt: string,
  context: InvocationContext
): Promise<string> {
  context.log(`[regenerateSingleContent] AI 모델 호출: ${aiModel}`);

  if (aiModel === 'gemini') {
    // 프로젝트 생성과 동일한 방식 사용 (ai-services.ts의 generateWithGemini와 동일)
    const { generateWithGemini } = await import('../lib/ai-services');
    return await generateWithGemini(prompt, systemPrompt);
  } else if (aiModel === 'claude') {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });
    
    return response.content[0].type === 'text' ? response.content[0].text : '';
  } else {
    // ChatGPT
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.8,
    });
    
    return response.choices[0]?.message?.content || '';
  }
}

// ============================================================
// 콘텐츠 타입별 재생성 프롬프트
// ============================================================

function buildRegeneratePrompt(
  contentType: ContentType,
  lessonTitle: string,
  learningObjectives: string[],
  targetAudience: string | null,
  duration: string | null,
  style: string | null
): { system: string; prompt: string } {
  const audienceGuide = targetAudience 
    ? getTargetAudienceGuide(targetAudience) 
    : '';

  const styleInstruction = style 
    ? (STYLE_INSTRUCTIONS[style] || `스타일 요청: ${style}`) 
    : '';

  const contentTypeConfigs: Record<ContentType, { label: string; jsonSchema: string; instruction: string }> = {
    slides: {
      label: '슬라이드',
      jsonSchema: `{
  "deckTitle": "슬라이드 제목",
  "slides": [
    {
      "slideNumber": 1,
      "title": "슬라이드 제목",
      "bulletPoints": ["핵심 포인트 1", "핵심 포인트 2"],
      "notes": "발표자 노트",
      "visualSuggestion": "시각 자료 제안"
    }
  ]
}`,
      instruction: '8-12장의 슬라이드로 구성해주세요. 각 슬라이드에는 명확한 제목, 핵심 포인트, 발표자 노트를 포함해주세요.',
    },
    quiz: {
      label: '퀴즈',
      jsonSchema: `{
  "quizTitle": "퀴즈 제목",
  "items": [
    {
      "questionNumber": 1,
      "questionType": "multiple_choice | true_false | short_answer",
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correctAnswer": "정답",
      "explanation": "해설",
      "difficulty": "easy | medium | hard"
    }
  ]
}`,
      instruction: '5-10문항의 퀴즈를 구성해주세요. 다양한 유형(객관식, 참/거짓, 단답형)과 난이도를 혼합해주세요.',
    },
    lab: {
      label: '실습 가이드',
      jsonSchema: `{
  "labTitle": "실습 제목",
  "estimatedTime": "예상 소요 시간",
  "prerequisites": ["사전 준비 사항"],
  "objectives": ["실습 목표"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "단계 제목",
      "instruction": "상세 지시사항",
      "expectedResult": "예상 결과",
      "tips": "유용한 팁"
    }
  ],
  "summary": "실습 요약"
}`,
      instruction: '5-10개의 단계로 구성된 실습 가이드를 작성해주세요. 각 단계는 명확하고 따라하기 쉽게 작성해주세요.',
    },
    reading: {
      label: '읽기 자료',
      jsonSchema: 'Markdown 형식',
      instruction: '1000-2000자 분량의 읽기 자료를 작성해주세요. 핵심 개념 설명, 실제 사례, 요약을 포함해주세요.',
    },
    summary: {
      label: '요약',
      jsonSchema: 'Markdown 형식',
      instruction: '핵심 포인트 5-7개, 주요 용어 정리(표), 기억해야 할 사항을 포함한 요약을 작성해주세요.',
    },
  };

  const config = contentTypeConfigs[contentType];
  const isJson = contentType === 'slides' || contentType === 'quiz' || contentType === 'lab';

  const system = `당신은 교육 콘텐츠 개발 전문가입니다.
주어진 레슨 정보를 바탕으로 완전히 새로운 ${config.label}를 생성합니다.
${audienceGuide}
${styleInstruction ? `\n추가 스타일 지시: ${styleInstruction}` : ''}

${isJson ? `출력은 반드시 아래 JSON 형식으로 작성하세요:\n${config.jsonSchema}` : '출력은 Markdown 형식으로 작성하세요.'}`;

  const prompt = `## 레슨 정보
- 제목: ${lessonTitle}
- 학습 목표: ${learningObjectives.length > 0 ? learningObjectives.join(', ') : '없음'}
- 교육 대상: ${targetAudience || '일반'}
- 시간: ${duration || '미정'}

## 요청
위 레슨에 적합한 ${config.label}를 새롭게 생성해주세요.
${config.instruction}

기존 콘텐츠와 다른 새로운 접근 방식으로 작성해주세요.`;

  return { system, prompt };
}

// ============================================================
// 메인 함수
// ============================================================

export async function regenerateSingleContent(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('[regenerateSingleContent] 요청 수신');

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
    const body = await request.json() as RegenerateSingleRequest;
    const { lessonId, contentType, aiModel, style } = body;

    if (!lessonId || !contentType || !aiModel) {
      return jsonResponse(400, { 
        success: false, 
        error: 'lessonId, contentType, and aiModel are required' 
      });
    }

    context.log(`[regenerateSingleContent] lessonId=${lessonId}, contentType=${contentType}, aiModel=${aiModel}, style=${style || 'default'}`);

    // 레슨 정보 조회 (컨텍스트 수집)
    const lessonRows = await query<any>(
      `SELECT l.*, m.course_id, c.target_audience, c.total_duration
       FROM lessons l
       JOIN course_modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = $1`,
      [lessonId]
    );

    if (lessonRows.length === 0) {
      return jsonResponse(404, { success: false, error: 'Lesson not found' });
    }

    const lesson = lessonRows[0];
    const learningObjectives = lesson.learning_objectives?.split('\n').filter(Boolean) || [];

    // 재생성 프롬프트 생성
    const { system, prompt } = buildRegeneratePrompt(
      contentType,
      lesson.title,
      learningObjectives,
      lesson.target_audience,
      lesson.total_duration,
      style || null
    );

    // AI 모델 호출
    const rawResult = await callAiModel(aiModel, prompt, system, context);

    // 결과 파싱
    let regeneratedContent: any;
    let markdown: string | undefined;

    if (contentType === 'reading' || contentType === 'summary') {
      // Markdown 형식
      markdown = rawResult;
      regeneratedContent = { markdown: rawResult };
    } else {
      // JSON 형식 파싱 시도
      try {
        const jsonMatch = rawResult.match(/```json\n?([\s\S]*?)\n?```/) || 
                          rawResult.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawResult;
        regeneratedContent = JSON.parse(jsonStr);
      } catch (parseError) {
        context.warn('[regenerateSingleContent] JSON 파싱 실패, 원본 반환');
        regeneratedContent = { raw: rawResult };
        markdown = rawResult;
      }
    }

    // 레슨 업데이트
    try {
      await query(
        `UPDATE lessons SET updated_at = NOW() WHERE id = $1`,
        [lessonId]
      );
    } catch (updateError) {
      context.warn('[regenerateSingleContent] 레슨 업데이트 실패:', updateError);
    }

    context.log(`[regenerateSingleContent] 재생성 완료: ${contentType}`);

    return jsonResponse(200, {
      success: true,
      data: {
        contentType,
        content: regeneratedContent,
        markdown,
        style: style || 'default',
      },
      message: `${contentType} 콘텐츠가 새롭게 생성되었습니다.`,
    });

  } catch (error) {
    context.error('[regenerateSingleContent] Error:', error);
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

app.http('regenerateSingleContent', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'course/regenerate-content',
  handler: regenerateSingleContent,
});
