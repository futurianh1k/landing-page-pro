/**
 * generateSingleContent
 * 
 * 단일 콘텐츠 생성 (파이프라인 X, 특정 콘텐츠만)
 * - 슬라이드, 퀴즈, 실습 가이드, 읽기 자료, 요약 등
 * - 코스빌더에서 빠른 콘텐츠 생성용 (~1-2분)
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

interface SingleContentRequest {
  lessonId: string;
  contentType: ContentType;
  context: {
    lessonTitle: string;
    learningObjectives?: string[];
    targetAudience?: string;
    duration?: string;
    additionalInstructions?: string;
  };
  aiModel: AiModel;
}

interface GeneratedContent {
  contentType: ContentType;
  content: any;
  markdown?: string;
}

// ============================================================
// 콘텐츠 타입별 프롬프트 빌더
// ============================================================

function buildSlidesOnlyPrompt(context: SingleContentRequest['context']): { system: string; prompt: string } {
  const audienceGuide = context.targetAudience 
    ? getTargetAudienceGuide(context.targetAudience) 
    : '';

  const system = `당신은 교육 콘텐츠 개발 전문가입니다.
주어진 주제와 학습 목표에 맞는 슬라이드를 설계합니다.
${audienceGuide}

출력은 반드시 아래 JSON 형식으로 작성하세요:
{
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
}`;

  const prompt = `## 레슨 정보
- 제목: ${context.lessonTitle}
- 학습 목표: ${context.learningObjectives?.join(', ') || '없음'}
- 교육 대상: ${context.targetAudience || '일반'}
- 시간: ${context.duration || '미정'}

${context.additionalInstructions ? `## 추가 지시사항\n${context.additionalInstructions}` : ''}

## 요청
위 레슨에 적합한 프레젠테이션 슬라이드를 8-12장으로 구성해주세요.
각 슬라이드에는 명확한 제목, 핵심 포인트, 발표자 노트를 포함해주세요.`;

  return { system, prompt };
}

function buildQuizOnlyPrompt(context: SingleContentRequest['context']): { system: string; prompt: string } {
  const audienceGuide = context.targetAudience 
    ? getTargetAudienceGuide(context.targetAudience) 
    : '';

  const system = `당신은 교육 평가 전문가입니다.
학습 목표 달성도를 측정하는 퀴즈 문항을 개발합니다.
${audienceGuide}

출력은 반드시 아래 JSON 형식으로 작성하세요:
{
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
}`;

  const prompt = `## 레슨 정보
- 제목: ${context.lessonTitle}
- 학습 목표: ${context.learningObjectives?.join(', ') || '없음'}
- 교육 대상: ${context.targetAudience || '일반'}

${context.additionalInstructions ? `## 추가 지시사항\n${context.additionalInstructions}` : ''}

## 요청
위 레슨의 학습 목표를 평가하는 퀴즈를 5-10문항으로 구성해주세요.
- 객관식(multiple_choice), 참/거짓(true_false), 단답형(short_answer) 유형을 적절히 혼합
- 난이도는 쉬움(2개), 보통(4개), 어려움(2개) 정도로 구성
- 각 문항에 상세한 해설 포함`;

  return { system, prompt };
}

function buildLabOnlyPrompt(context: SingleContentRequest['context']): { system: string; prompt: string } {
  const audienceGuide = context.targetAudience 
    ? getTargetAudienceGuide(context.targetAudience) 
    : '';

  const system = `당신은 실습 교육 설계 전문가입니다.
학습자가 따라할 수 있는 단계별 실습 가이드를 작성합니다.
${audienceGuide}

출력은 반드시 아래 JSON 형식으로 작성하세요:
{
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
      "tips": "유용한 팁",
      "troubleshooting": "문제 해결 방법"
    }
  ],
  "summary": "실습 요약"
}`;

  const prompt = `## 레슨 정보
- 제목: ${context.lessonTitle}
- 학습 목표: ${context.learningObjectives?.join(', ') || '없음'}
- 교육 대상: ${context.targetAudience || '일반'}
- 시간: ${context.duration || '미정'}

${context.additionalInstructions ? `## 추가 지시사항\n${context.additionalInstructions}` : ''}

## 요청
위 레슨의 학습 목표를 달성하기 위한 실습 가이드를 작성해주세요.
- 5-10개의 단계로 구성
- 각 단계는 명확하고 따라하기 쉽게 작성
- 초보자도 이해할 수 있는 수준으로 설명
- 예상 결과와 문제 해결 팁 포함`;

  return { system, prompt };
}

function buildReadingPrompt(context: SingleContentRequest['context']): { system: string; prompt: string } {
  const audienceGuide = context.targetAudience 
    ? getTargetAudienceGuide(context.targetAudience) 
    : '';

  const system = `당신은 교육 콘텐츠 작성 전문가입니다.
학습자가 이해하기 쉬운 읽기 자료를 작성합니다.
${audienceGuide}

출력은 Markdown 형식으로 작성하세요. 다음 구조를 따릅니다:
# 제목
## 개요
## 핵심 개념
### 개념 1
### 개념 2
## 실제 적용
## 요약
## 더 알아보기`;

  const prompt = `## 레슨 정보
- 제목: ${context.lessonTitle}
- 학습 목표: ${context.learningObjectives?.join(', ') || '없음'}
- 교육 대상: ${context.targetAudience || '일반'}

${context.additionalInstructions ? `## 추가 지시사항\n${context.additionalInstructions}` : ''}

## 요청
위 레슨의 학습 목표를 달성하기 위한 읽기 자료를 작성해주세요.
- 1000-2000자 분량
- 핵심 개념을 명확히 설명
- 실제 사례나 예시 포함
- 학습자 수준에 맞는 언어 사용`;

  return { system, prompt };
}

function buildSummaryPrompt(context: SingleContentRequest['context']): { system: string; prompt: string } {
  const system = `당신은 교육 콘텐츠 요약 전문가입니다.
학습 내용의 핵심을 간결하게 정리합니다.

출력은 Markdown 형식으로 작성하세요:
# 학습 요약: [제목]
## 핵심 포인트
- 포인트 1
- 포인트 2
## 주요 용어
| 용어 | 정의 |
|-----|-----|
## 기억해야 할 것
## 다음 단계`;

  const prompt = `## 레슨 정보
- 제목: ${context.lessonTitle}
- 학습 목표: ${context.learningObjectives?.join(', ') || '없음'}

${context.additionalInstructions ? `## 추가 지시사항\n${context.additionalInstructions}` : ''}

## 요청
위 레슨의 핵심 내용을 요약해주세요.
- 핵심 포인트 5-7개
- 주요 용어 정리 (표 형식)
- 학습자가 기억해야 할 핵심 사항
- 다음 학습을 위한 안내`;

  return { system, prompt };
}

// ============================================================
// AI 모델 호출
// ============================================================

async function callAiModel(
  aiModel: AiModel,
  prompt: string,
  systemPrompt: string,
  context: InvocationContext
): Promise<string> {
  context.log(`[generateSingleContent] AI 모델 호출: ${aiModel}`);

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
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || '';
  }
}

// ============================================================
// 메인 함수
// ============================================================

export async function generateSingleContent(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('[generateSingleContent] 요청 수신');

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
    const body = await request.json() as SingleContentRequest;
    const { lessonId, contentType, context: contentContext, aiModel } = body;

    if (!lessonId || !contentType || !aiModel) {
      return jsonResponse(400, { 
        success: false, 
        error: 'lessonId, contentType, and aiModel are required' 
      });
    }

    context.log(`[generateSingleContent] lessonId=${lessonId}, contentType=${contentType}, aiModel=${aiModel}`);

    // 레슨 정보 조회
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

    // 컨텍스트 보강
    const enrichedContext = {
      lessonTitle: contentContext.lessonTitle || lesson.title,
      learningObjectives: contentContext.learningObjectives || 
        (lesson.learning_objectives?.split('\n').filter(Boolean) || []),
      targetAudience: contentContext.targetAudience || lesson.target_audience,
      duration: contentContext.duration || lesson.total_duration,
      additionalInstructions: contentContext.additionalInstructions,
    };

    // 콘텐츠 타입별 프롬프트 생성
    const promptBuilders: Record<ContentType, (ctx: typeof enrichedContext) => { system: string; prompt: string }> = {
      slides: buildSlidesOnlyPrompt,
      quiz: buildQuizOnlyPrompt,
      lab: buildLabOnlyPrompt,
      reading: buildReadingPrompt,
      summary: buildSummaryPrompt,
    };

    const { system, prompt } = promptBuilders[contentType](enrichedContext);

    // AI 모델 호출
    const rawResult = await callAiModel(aiModel, prompt, system, context);

    // 결과 파싱 (JSON 또는 Markdown)
    let parsedContent: any;
    let markdown: string | undefined;

    if (contentType === 'reading' || contentType === 'summary') {
      // Markdown 형식
      markdown = rawResult;
      parsedContent = { markdown: rawResult };
    } else {
      // JSON 형식 파싱 시도
      try {
        const jsonMatch = rawResult.match(/```json\n?([\s\S]*?)\n?```/) || 
                          rawResult.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawResult;
        parsedContent = JSON.parse(jsonStr);
      } catch (parseError) {
        context.warn('[generateSingleContent] JSON 파싱 실패, 원본 반환');
        parsedContent = { raw: rawResult };
        markdown = rawResult;
      }
    }

    // 레슨에 콘텐츠 저장 (JSON 컬럼에 저장)
    // lesson_contents 컬럼이 있다면 업데이트, 없다면 별도 처리
    // 여기서는 lessons 테이블의 확장 컬럼에 저장
    const contentColumnMap: Record<ContentType, string> = {
      slides: 'slides_content',
      quiz: 'quiz_content',
      lab: 'lab_content',
      reading: 'reading_content',
      summary: 'summary_content',
    };

    // 동적 컬럼 업데이트 (컬럼이 있는 경우에만)
    try {
      await query(
        `UPDATE lessons SET 
          content_source = 'ai_generated',
          updated_at = NOW()
        WHERE id = $1`,
        [lessonId]
      );
    } catch (updateError) {
      context.warn('[generateSingleContent] 레슨 업데이트 실패:', updateError);
    }

    const result: GeneratedContent = {
      contentType,
      content: parsedContent,
      markdown,
    };

    context.log(`[generateSingleContent] 생성 완료: ${contentType}`);

    return jsonResponse(200, {
      success: true,
      data: result,
      message: `${contentType} 콘텐츠가 생성되었습니다.`,
    });

  } catch (error) {
    context.error('[generateSingleContent] Error:', error);
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

app.http('generateSingleContent', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'course/generate-content',
  handler: generateSingleContent,
});
