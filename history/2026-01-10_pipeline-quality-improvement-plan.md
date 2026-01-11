# AI 콘텐츠 생성 파이프라인 품질 개선 계획

**작성일**: 2026-01-10  
**목적**: 6단계 파이프라인의 생성 품질과 일관성 향상

---

## 📊 현재 상태 분석

### 파이프라인 구조
```
웹검색(선택) → 커리큘럼 설계 → 수업안 작성 → 슬라이드 구성 → 실습 템플릿 → 평가/퀴즈 → 최종 검토
```

### 현재 구현 상태 (2026-01-10 업데이트)

| 전략 | 현재 상태 | 평가 |
|------|----------|------|
| 컨텍스트 체이닝 | BriefingInput/PipelineContext 타입 정의 | ✅ 구현됨 |
| 구조화된 스키마 | 커리큘럼 + 슬라이드 JSON | ✅ 구현됨 |
| 역할 기반 프롬프트 | STAGE_PERSONAS 적용 | ✅ 구현됨 |
| 품질 검증 레이어 | validateCurriculum 등 구현 | ✅ 구현됨 |
| 자동 수정 루프 | 커리큘럼 단계 최대 2회 재시도 | ✅ 구현됨 |
| Few-shot 예시 | CURRICULUM_EXAMPLE 추가 | ✅ 구현됨 |
| 일관성 체크 | checkPipelineConsistency 구현 | ✅ 구현됨 |

---

## 🎯 개선 계획

### Phase 1: 기초 개선 (1주차)

#### 1.1 구조화된 컨텍스트 인터페이스 정의

```typescript
// azure-functions/src/lib/agent/types.ts

export interface BriefingInput {
  topic: string;
  targetAudience: TargetAudience;
  totalDuration: string;
  sessionCount: number;
  courseLevel: string;
  specialRequirements?: string;
}

export interface CurriculumOutput {
  title: string;
  totalDuration: string;
  learningObjectives: string[];
  targetAudienceAnalysis: string;
  sessions: SessionPlan[];
  prerequisites: string[];
}

export interface SessionPlan {
  sessionNumber: number;
  title: string;
  duration: string;
  keyTopics: string[];
  expectedOutcome: string;
}

export interface LessonPlanOutput {
  sessionNumber: number;
  title: string;
  learningObjectives: string[];
  introduction: ActivityBlock;
  development: ActivityBlock[];
  conclusion: ActivityBlock;
  materials: string[];
  assessmentMethod: string;
}

export interface ActivityBlock {
  duration: string;
  activity: string;
  teacherAction: string;
  learnerAction: string;
}

export interface SlideOutput {
  deckTitle: string;
  slides: Slide[];
  sources: string[];
}

export interface Slide {
  slideNumber: number;
  title: string;
  bullets: string[];
  speakerNotes: string;
  visualHint?: string;
}

export interface PipelineContext {
  briefing: BriefingInput;
  webSearchResults?: WebSearchResult[];
  curriculum?: CurriculumOutput;
  lessonPlans?: LessonPlanOutput[];
  slides?: SlideOutput;
  labTemplate?: string;
  assessment?: string;
  finalReview?: string;
}
```

#### 1.2 커리큘럼 단계 JSON 출력 적용

```typescript
// generationJobWorker.ts - curriculum_design 수정

const curriculumSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    totalDuration: { type: "string" },
    learningObjectives: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 5
    },
    sessions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          sessionNumber: { type: "integer" },
          title: { type: "string" },
          duration: { type: "string" },
          keyTopics: { type: "array", items: { type: "string" } },
          expectedOutcome: { type: "string" }
        },
        required: ["sessionNumber", "title", "duration", "keyTopics"]
      }
    },
    prerequisites: { type: "array", items: { type: "string" } }
  },
  required: ["title", "learningObjectives", "sessions"]
};
```

#### 1.3 기본 검증 로직 추가

```typescript
// azure-functions/src/lib/agent/validation.ts

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

export function validateCurriculum(
  output: CurriculumOutput, 
  briefing: BriefingInput
): ValidationResult {
  const issues: string[] = [];
  
  // 세션 수 검증
  if (output.sessions.length !== briefing.sessionCount) {
    issues.push(`세션 수 불일치: 요청 ${briefing.sessionCount}개, 생성 ${output.sessions.length}개`);
  }
  
  // 학습 목표 수 검증
  if (output.learningObjectives.length < 3) {
    issues.push('학습 목표가 3개 미만입니다');
  }
  
  // 각 세션에 keyTopics가 있는지 검증
  output.sessions.forEach((session, i) => {
    if (!session.keyTopics || session.keyTopics.length === 0) {
      issues.push(`세션 ${i + 1}에 핵심 주제가 없습니다`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions: []
  };
}
```

---

### Phase 2: 프롬프트 강화 (2주차)

#### 2.1 역할 기반 시스템 프롬프트 개선

```typescript
// azure-functions/src/lib/agent/prompts.ts

export const STAGE_PERSONAS = {
  curriculum_design: `당신은 20년 경력의 교육과정 설계(Curriculum Design) 전문가입니다.

전문 분야:
- 학습자 수준 분석 및 맞춤형 커리큘럼 설계
- 블룸의 분류학(Bloom's Taxonomy) 기반 학습 목표 설정
- 단계적 학습 구조 설계 (Scaffolding)

핵심 원칙:
1. 학습 목표는 구체적이고 측정 가능해야 합니다 (SMART 원칙)
2. 각 세션 간 논리적 연결성을 확보합니다
3. 실무 적용 가능성을 항상 고려합니다
4. 대상 학습자의 선수 지식 수준을 고려합니다`,

  lesson_plan: `당신은 교수설계(Instructional Design) 전문가입니다.

전문 분야:
- ADDIE 모델 기반 수업 설계
- 가네의 9가지 교수사건(Gagné's Nine Events) 적용
- 학습자 중심 활동 설계

핵심 원칙:
1. 도입-전개-정리 구조를 명확히 합니다
2. 매 10-15분마다 학습자 참여 활동을 포함합니다
3. 형성평가를 통해 학습 확인점을 설정합니다
4. 다양한 교수 방법(강의, 토론, 실습)을 조합합니다`,

  slides: `당신은 교육용 프레젠테이션 설계 전문가입니다.

전문 분야:
- 정보 시각화 및 프레젠테이션 디자인
- 인지 부하 이론(Cognitive Load Theory) 기반 슬라이드 설계

핵심 원칙:
1. 한 슬라이드에 하나의 핵심 메시지만 담습니다
2. 6x6 규칙: 한 줄 6단어, 한 슬라이드 6줄 이하
3. 텍스트는 최소화하고 시각 자료를 활용합니다
4. 발표자 노트에 상세 설명과 전환 멘트를 포함합니다`,

  lab_template: `당신은 실습 교육 설계 전문가입니다.

전문 분야:
- 체험 학습(Experiential Learning) 설계
- 단계별 가이드 및 체크리스트 작성

핵심 원칙:
1. 각 단계는 명확하고 따라하기 쉽게 작성합니다
2. 예상 소요 시간을 정확히 명시합니다
3. 자주 발생하는 오류와 해결 방법을 포함합니다
4. 성공 기준을 명확히 제시합니다`,

  assessment: `당신은 교육 평가 설계 전문가입니다.

전문 분야:
- 형성평가 및 총괄평가 설계
- 루브릭(Rubric) 개발

핵심 원칙:
1. 학습 목표와 평가 문항을 정확히 연계합니다
2. 다양한 유형(객관식, 주관식, 실습형)을 포함합니다
3. 난이도를 단계적으로 배치합니다
4. 정답과 상세 해설을 포함합니다`
};
```

#### 2.2 Few-shot 예시 추가

```typescript
export const CURRICULUM_EXAMPLE = {
  input: {
    topic: "Python 기초 프로그래밍",
    targetAudience: "성인_직장인",
    sessionCount: 4,
    totalDuration: "2시간/회",
    courseLevel: "입문"
  },
  output: {
    title: "Python 프로그래밍 첫걸음",
    totalDuration: "8시간 (2시간 × 4회차)",
    learningObjectives: [
      "Python 개발환경을 구축하고 기본 문법을 이해한다",
      "변수, 조건문, 반복문을 활용한 간단한 프로그램을 작성한다",
      "함수와 모듈을 활용하여 코드를 구조화한다",
      "실무에서 활용 가능한 간단한 자동화 스크립트를 작성한다"
    ],
    sessions: [
      {
        sessionNumber: 1,
        title: "Python과의 첫 만남",
        duration: "120분",
        keyTopics: ["개발환경 설치", "print 함수", "변수와 자료형", "기본 연산자"],
        expectedOutcome: "Hello World 프로그램 작성 및 실행"
      },
      {
        sessionNumber: 2,
        title: "프로그램의 흐름 제어",
        duration: "120분",
        keyTopics: ["조건문 (if-elif-else)", "반복문 (for, while)", "리스트 기초"],
        expectedOutcome: "구구단 출력 프로그램 작성"
      },
      {
        sessionNumber: 3,
        title: "함수로 코드 정리하기",
        duration: "120분",
        keyTopics: ["함수 정의와 호출", "매개변수와 반환값", "모듈 import"],
        expectedOutcome: "계산기 함수 라이브러리 작성"
      },
      {
        sessionNumber: 4,
        title: "실무 자동화 프로젝트",
        duration: "120분",
        keyTopics: ["파일 입출력", "예외 처리", "미니 프로젝트"],
        expectedOutcome: "파일 정리 자동화 스크립트 완성"
      }
    ],
    prerequisites: ["컴퓨터 기본 사용 능력", "영문 타이핑 가능"]
  }
};
```

---

### Phase 3: 검증 및 자동화 (3주차)

#### 3.1 자동 수정 루프 구현

```typescript
// azure-functions/src/lib/agent/generator.ts

export async function generateWithRetry<T>(
  stage: string,
  context: PipelineContext,
  schema: object,
  validator: (output: T, context: PipelineContext) => ValidationResult,
  maxRetries: number = 3
): Promise<T> {
  let attempt = 0;
  let lastOutput: T | null = null;
  let lastValidation: ValidationResult | null = null;
  
  while (attempt < maxRetries) {
    const prompt = buildPrompt(stage, context, lastValidation);
    const output = await callAI(prompt, schema);
    const validation = validator(output, context);
    
    if (validation.isValid) {
      return output;
    }
    
    lastOutput = output;
    lastValidation = validation;
    attempt++;
    
    console.log(`[Pipeline] ${stage} 재시도 ${attempt}/${maxRetries}: ${validation.issues.join(', ')}`);
  }
  
  // 최대 재시도 후에도 실패하면 마지막 결과 반환 + 경고 로그
  console.warn(`[Pipeline] ${stage} 검증 실패했지만 계속 진행: ${lastValidation?.issues.join(', ')}`);
  return lastOutput!;
}

function buildPrompt(
  stage: string, 
  context: PipelineContext, 
  previousValidation?: ValidationResult | null
): string {
  let prompt = BASE_PROMPTS[stage](context);
  
  if (previousValidation && previousValidation.issues.length > 0) {
    prompt += `

## ⚠️ 이전 생성 결과의 문제점
${previousValidation.issues.map(i => `- ${i}`).join('\n')}

## 수정 요청
위 문제점을 해결하여 다시 생성해주세요. 특히 다음 사항을 확인하세요:
- 세션 수가 정확히 ${context.briefing.sessionCount}개인지
- 각 세션에 핵심 주제가 포함되어 있는지
- 학습 목표가 구체적이고 측정 가능한지
`;
  }
  
  return prompt;
}
```

#### 3.2 단계 간 일관성 체크

```typescript
export async function checkConsistency(
  currentStage: string, 
  output: any, 
  context: PipelineContext
): Promise<ValidationResult> {
  const issues: string[] = [];
  
  if (currentStage === 'lesson_plan' && context.curriculum) {
    // 세션 수 일치 검증
    const curriculumSessions = context.curriculum.sessions.length;
    const lessonPlanSessions = output.length;
    
    if (curriculumSessions !== lessonPlanSessions) {
      issues.push(`커리큘럼(${curriculumSessions}개)과 수업안(${lessonPlanSessions}개) 세션 수 불일치`);
    }
    
    // 세션 제목 일치 검증
    context.curriculum.sessions.forEach((currSession, i) => {
      const lessonSession = output[i];
      if (lessonSession && !lessonSession.title.includes(currSession.title.split(':')[0])) {
        issues.push(`세션 ${i + 1} 제목 불일치: 커리큘럼 "${currSession.title}" vs 수업안 "${lessonSession.title}"`);
      }
    });
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions: []
  };
}
```

---

## 📅 구현 일정

| 주차 | 작업 내용 | 예상 시간 |
|------|----------|----------|
| 1주차 | 타입 정의, 커리큘럼 JSON 출력, 기본 검증 | 8시간 |
| 2주차 | 시스템 프롬프트 강화, Few-shot 예시 | 6시간 |
| 3주차 | 자동 수정 루프, 일관성 체크 | 10시간 |
| 4주차 | 테스트 및 튜닝 | 6시간 |

---

## 📈 예상 효과

1. **품질 향상**: 세션 수 불일치 등 기본적인 오류 90% 감소
2. **일관성 확보**: 단계 간 정보 연결성 향상
3. **재시도 감소**: 사용자 수동 재생성 필요성 50% 감소
4. **유지보수 용이**: 구조화된 코드로 디버깅 및 확장 용이

---

## 📚 참고자료

- [ADDIE Model](https://en.wikipedia.org/wiki/ADDIE_Model)
- [Bloom's Taxonomy](https://en.wikipedia.org/wiki/Bloom%27s_taxonomy)
- [Gagné's Nine Events of Instruction](https://www.instructionaldesign.org/theories/conditions-learning/)
- [Cognitive Load Theory](https://en.wikipedia.org/wiki/Cognitive_load)

---

## ✅ 구현 완료 내역 (2026-01-10)

### 생성된 파일

| 파일 | 설명 |
|------|------|
| `azure-functions/src/lib/agent/types.ts` | 파이프라인 타입 정의 (BriefingInput, CurriculumOutput, PipelineContext 등) |
| `azure-functions/src/lib/agent/validation.ts` | 검증 로직 (validateCurriculum, validateLessonPlan 등) |
| `azure-functions/src/lib/agent/prompts.ts` | 역할 기반 프롬프트 및 Few-shot 예시 |

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `azure-functions/src/functions/generationJobWorker.ts` | 커리큘럼 단계에 JSON 출력, 검증, 재시도 로직 적용 |

### 주요 개선 사항 (Phase 1 & 2)

1. **구조화된 출력**: 커리큘럼 단계가 JSON으로 출력되어 일관된 구조 보장
2. **자동 검증**: 세션 수, 학습 목표 수, 필수 필드 등 자동 검증
3. **재시도 로직**: 검증 실패 시 피드백 포함하여 최대 2회 재생성
4. **역할 기반 프롬프트**: 각 단계별 전문가 페르소나 적용
5. **교육대상별 가이드**: 13개 교육대상별 콘텐츠 작성 가이드

---

## ✅ Phase 3 구현 완료 내역 (2026-01-10)

### 생성된 파일

| 파일 | 설명 |
|------|------|
| `azure-functions/src/lib/agent/generator.ts` | 재시도 로직 유틸리티 (`generateWithRetry`) 및 프롬프트 빌더 |

### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `azure-functions/src/functions/generationJobWorker.ts` | 모든 단계에 검증/재시도 로직 적용, 일관성 체크 통합 |
| `azure-functions/src/lib/agent/validation.ts` | `validateSlides`, `validateAssessment` 개선, 파라미터 수정 |

### Phase 3 구현 상세

#### 1. `generateWithRetry` 유틸리티 함수
```typescript
// azure-functions/src/lib/agent/generator.ts
export async function generateWithRetry<T>(
  options: GenerateWithRetryOptions<T>
): Promise<GenerateResult<T>>
```
- 공통 재시도 로직을 함수로 추출
- 검증 실패 시 피드백 포함하여 자동 재생성
- 최대 재시도 횟수 설정 가능 (기본: 2회)
- 로깅 및 에러 처리 통합

#### 2. 수업안(lesson_plan) 단계 개선
- JSON 구조화 출력 (`LessonPlanOutput[]`)
- 세션 수 검증 (커리큘럼과 일치 확인)
- 도입-전개-정리 구조 검증
- Markdown 변환 함수 (`convertLessonPlansToMarkdown`)

#### 3. 슬라이드(slides) 단계 개선
- JSON 구조화 출력 (`SlideOutput`)
- 슬라이드 수 적정성 검증
- 각 슬라이드 필수 요소 검증 (제목, bullets, 발표자 노트)
- Markdown 변환 함수 (`convertSlidesToMarkdown`)

#### 4. 평가(assessment) 단계 개선
- JSON 구조화 출력 (`AssessmentOutput`)
- 학습 목표 기반 최소 문항 수 검증
- 문항 유형 다양성 검증
- 총점 일관성 검증
- Markdown 변환 함수 (`convertAssessmentToMarkdown`)

#### 5. 파이프라인 일관성 체크 (final_review)
- `checkPipelineConsistency()` 호출하여 단계 간 일관성 검증
- 커리큘럼 ↔ 수업안 세션 수 일치
- 학습 목표 대비 평가 문항 수 적정성
- 세션 수 대비 슬라이드 분량 적정성
- 검증 결과를 최종 문서에 포함

### 적용된 검증 규칙 요약

| 단계 | 검증 항목 |
|------|----------|
| curriculum_design | 제목 길이, 세션 수 일치, 학습 목표 3-5개, 세션별 필수 필드 |
| lesson_plan | 세션 수 일치, 도입/전개/정리 구조, 활동 블록 필수 필드 |
| slides | 슬라이드 수 적정성, 제목/bullets/발표자 노트 필수 |
| assessment | 최소 문항 수, 정답/해설 필수, 문항 유형 다양성, 총점 일관성 |
| final_review | 전체 파이프라인 일관성 (세션 수, 문항 수, 슬라이드 수) |

---

*작성자: AI Assistant*  
*최종 업데이트: 2026-01-10 (Phase 3 완료)*
