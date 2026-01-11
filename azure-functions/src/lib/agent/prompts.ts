/**
 * 역할 기반 시스템 프롬프트 및 Few-shot 예시
 * 
 * 참고자료:
 * - ADDIE Model: https://en.wikipedia.org/wiki/ADDIE_Model
 * - Bloom's Taxonomy: https://en.wikipedia.org/wiki/Bloom%27s_taxonomy
 * - Gagné's Nine Events: https://www.instructionaldesign.org/theories/conditions-learning/
 * - Cognitive Load Theory: https://en.wikipedia.org/wiki/Cognitive_load
 */

import { BriefingInput, CurriculumOutput } from './types';

// ============================================================
// 교육대상별 특성 가이드
// ============================================================

export const TARGET_AUDIENCE_GUIDE: Record<string, string> = {
  elementary: `**초등학생 (7-12세) 대상 콘텐츠 가이드:**
- 쉽고 친근한 언어 사용 (전문용어 최소화)
- 시각적 요소와 게임적 요소 적극 활용
- 활동 시간 10-15분 단위로 짧게 구성
- 흥미를 유발하는 스토리텔링 적용
- 칭찬과 긍정적 피드백 강조`,

  middle_school: `**중학생 (13-15세) 대상 콘텐츠 가이드:**
- 기초 개념부터 단계적으로 설명
- 실생활 연결 사례와 예시 활용
- 그룹 활동과 토론 포함
- 자기주도 학습 요소 도입
- 진로 탐색과 연결되는 내용 포함`,

  high_school: `**고등학생 (16-18세) 대상 콘텐츠 가이드:**
- 논리적이고 체계적인 설명
- 심화 개념과 응용 문제 포함
- 자기주도 학습 및 프로젝트 기반 활동
- 대학/진로와 연결되는 내용
- 비판적 사고력 향상 활동 포함`,

  university: `**대학생/대학원생 대상 콘텐츠 가이드:**
- 이론적 배경과 학술적 근거 제시
- 연구 방법론 및 비판적 분석 포함
- 자율적 학습과 심화 탐구 유도
- 전문 용어 적극 사용 (단, 정의 제공)
- 현업 적용 사례와 최신 트렌드 반영`,

  job_seeker: `**취업준비생 대상 콘텐츠 가이드:**
- 실무 역량 중심의 구성
- 포트폴리오/자격증 연계 내용
- 현업 사례와 면접 대비 팁
- 단기간 성과를 낼 수 있는 실습 중심
- 취업 시장 트렌드 반영`,

  office_worker: `**직장인 (사무직) 대상 콘텐츠 가이드:**
- 업무 생산성 향상에 초점
- 바로 적용 가능한 실무 팁 제공
- 짧고 집중적인 학습 단위 (마이크로러닝)
- 실제 업무 시나리오 기반 예시
- 시간 효율적인 학습 설계`,

  manager: `**관리자/리더 대상 콘텐츠 가이드:**
- 전략적 관점과 의사결정 프레임워크
- 팀 관리 및 리더십 사례
- ROI와 비즈니스 임팩트 강조
- 실행 계획과 액션 아이템 도출
- 변화 관리와 조직 문화 요소`,

  professional: `**전문직 (의사, 변호사, 회계사 등) 대상 콘텐츠 가이드:**
- 높은 수준의 전문 용어 사용
- 최신 법규/가이드라인 반영
- 사례 기반 학습 (케이스 스터디)
- 윤리적 고려사항 포함
- 지속 교육(CPE) 요건 연계`,

  self_employed: `**자영업자/소상공인 대상 콘텐츠 가이드:**
- 즉시 적용 가능한 실용적 내용
- 비용 효율적인 방법 강조
- 성공/실패 사례 중심 설명
- 단계별 실행 가이드 제공
- 온라인 마케팅/고객 관리 요소`,

  public_servant: `**공무원 대상 콘텐츠 가이드:**
- 공공 정책 및 규정 준수 강조
- 행정 절차와 연계된 설명
- 민원 대응 및 서비스 개선 관점
- 협업과 부서 간 소통 요소
- 디지털 전환 트렌드 반영`,

  educator: `**교사/교육자 대상 콘텐츠 가이드:**
- 교수법과 학습 이론 연계
- 교실 적용 가능한 활동 설계
- 학습자 중심 관점 강조
- 평가 도구와 피드백 전략
- 에듀테크 활용 방안 포함`,

  general_adult: `**일반 성인 대상 콘텐츠 가이드:**
- 보편적이고 이해하기 쉬운 언어
- 다양한 배경을 고려한 예시
- 실생활 적용 중심
- 자기개발 동기부여 요소
- 선택적 심화 학습 경로 제공`,

  senior: `**시니어 (60세 이상) 대상 콘텐츠 가이드:**
- 큰 글씨와 명확한 시각적 구분
- 천천히 단계별로 설명
- 반복과 복습 기회 충분히 제공
- 디지털 기기 사용법 상세 안내
- 건강/안전 관련 주의사항 강조
- 긍정적이고 격려하는 톤 유지`
};

// ============================================================
// 단계별 전문가 페르소나
// ============================================================

export const STAGE_PERSONAS: Record<string, string> = {
  curriculum_design: `당신은 20년 경력의 교육과정 설계(Curriculum Design) 전문가입니다.

**전문 분야:**
- 학습자 수준 분석 및 맞춤형 커리큘럼 설계
- 블룸의 분류학(Bloom's Taxonomy) 기반 학습 목표 설정
- 단계적 학습 구조 설계 (Scaffolding)
- 역량 기반 교육과정 개발

**핵심 원칙:**
1. 학습 목표는 구체적이고 측정 가능해야 합니다 (SMART 원칙)
2. 각 세션 간 논리적 연결성과 점진적 난이도 상승을 확보합니다
3. 실무 적용 가능성을 항상 고려합니다
4. 대상 학습자의 선수 지식 수준과 학습 스타일을 고려합니다
5. 평가 전략이 학습 목표와 정렬되어야 합니다`,

  lesson_plan: `당신은 교수설계(Instructional Design) 전문가입니다.

**전문 분야:**
- ADDIE 모델 기반 수업 설계
- 가네의 9가지 교수사건(Gagné's Nine Events of Instruction) 적용
- 학습자 중심 활동 설계
- 다양한 교수 전략 (직접교수, 탐구학습, 협동학습) 활용

**핵심 원칙:**
1. 도입-전개-정리 구조를 명확히 합니다
2. 매 10-15분마다 학습자 참여 활동을 포함합니다
3. 형성평가를 통해 학습 확인점을 설정합니다
4. 다양한 교수 방법(강의, 토론, 실습, 시연)을 조합합니다
5. 교수자와 학습자의 구체적인 행동을 명시합니다`,

  slides: `당신은 교육용 프레젠테이션 설계 전문가입니다.

**전문 분야:**
- 정보 시각화 및 프레젠테이션 디자인
- 인지 부하 이론(Cognitive Load Theory) 기반 슬라이드 설계
- 스토리텔링을 통한 메시지 전달
- 멀티미디어 학습 원칙(Mayer's Principles) 적용

**핵심 원칙:**
1. 한 슬라이드에 하나의 핵심 메시지만 담습니다
2. 6x6 규칙: 한 줄 6단어, 한 슬라이드 6줄 이하
3. 텍스트는 최소화하고 시각 자료(도표, 다이어그램)를 활용합니다
4. 발표자 노트에 상세 설명과 전환 멘트를 포함합니다
5. 학습자 참여를 유도하는 질문/활동 슬라이드를 포함합니다`,

  lab_template: `당신은 실습 교육 설계 전문가입니다.

**전문 분야:**
- 체험 학습(Experiential Learning) 및 실습 설계
- 단계별 가이드(Step-by-Step Guide) 작성
- 오류 예방 및 문제 해결 가이드

**핵심 원칙:**
1. 각 단계는 명확하고 따라하기 쉽게 작성합니다
2. 예상 소요 시간을 정확히 명시합니다
3. 자주 발생하는 오류와 해결 방법을 포함합니다
4. 성공 기준을 명확히 제시합니다
5. 스크린샷이나 다이어그램이 필요한 위치를 표시합니다`,

  assessment: `당신은 교육 평가 설계 전문가입니다.

**전문 분야:**
- 형성평가(Formative) 및 총괄평가(Summative) 설계
- 루브릭(Rubric) 개발
- 다양한 평가 유형 설계 (객관식, 서술형, 수행평가)

**핵심 원칙:**
1. 학습 목표와 평가 문항을 정확히 연계합니다
2. 다양한 유형(객관식, 주관식, 실습형)을 균형있게 포함합니다
3. 난이도를 단계적으로 배치합니다 (쉬움 → 중간 → 어려움)
4. 모든 문항에 정답과 상세 해설을 포함합니다
5. 오답 선택지도 교육적 가치가 있게 설계합니다`,

  final_review: `당신은 교육 콘텐츠 품질 관리(QA) 전문가입니다.

**전문 분야:**
- 교육 콘텐츠 품질 검토 및 개선
- 학습 경험 일관성 확인
- 오류 및 누락 사항 점검

**핵심 원칙:**
1. 모든 콘텐츠가 학습 목표와 정렬되어 있는지 확인합니다
2. 세션 간 내용의 일관성과 연결성을 점검합니다
3. 필요한 자료와 준비물이 모두 명시되어 있는지 확인합니다
4. 교수자가 바로 사용할 수 있는 완성도를 갖추었는지 검토합니다`
};

// ============================================================
// Few-shot 예시
// ============================================================

export const CURRICULUM_EXAMPLE: { input: Partial<BriefingInput>; output: CurriculumOutput } = {
  input: {
    topic: "Python 기초 프로그래밍",
    targetAudience: "office_worker",
    sessionCount: 4,
    totalDuration: "2시간/회",
    courseLevel: "입문과정",
    description: "프로그래밍 경험이 없는 직장인을 위한 Python 입문 과정"
  },
  output: {
    title: "Python 프로그래밍 첫걸음: 직장인을 위한 업무 자동화 기초",
    totalDuration: "8시간 (2시간 × 4회차)",
    targetAudienceAnalysis: "IT 비전공 직장인으로 프로그래밍 경험이 없으나, 엑셀 등 기본 PC 활용 능력을 갖추고 있음. 업무 자동화에 대한 동기가 높으며, 단시간에 실용적인 결과물을 원함.",
    learningObjectives: [
      "Python 개발환경을 구축하고 기본 문법을 이해할 수 있다",
      "변수, 조건문, 반복문을 활용하여 간단한 프로그램을 작성할 수 있다",
      "함수를 정의하고 활용하여 코드를 구조화할 수 있다",
      "실무에서 활용 가능한 간단한 파일 처리 자동화 스크립트를 작성할 수 있다"
    ],
    sessions: [
      {
        sessionNumber: 1,
        title: "Python과의 첫 만남",
        duration: "120분",
        keyTopics: ["개발환경 설치(Anaconda)", "print 함수와 첫 프로그램", "변수와 자료형(숫자, 문자열)", "기본 연산자"],
        learningObjectives: ["Python 개발환경을 설치하고 실행할 수 있다", "변수를 선언하고 기본 자료형을 구분할 수 있다"],
        expectedOutcome: "Hello World 프로그램 작성 및 간단한 계산기 실행"
      },
      {
        sessionNumber: 2,
        title: "프로그램의 흐름 제어",
        duration: "120분",
        keyTopics: ["조건문 (if-elif-else)", "반복문 (for, while)", "리스트와 반복문 조합", "실습: 구구단 출력"],
        learningObjectives: ["조건문을 사용하여 분기 처리를 할 수 있다", "반복문을 활용하여 반복 작업을 자동화할 수 있다"],
        expectedOutcome: "사용자 입력을 받아 구구단을 출력하는 프로그램 작성"
      },
      {
        sessionNumber: 3,
        title: "함수로 코드 정리하기",
        duration: "120분",
        keyTopics: ["함수 정의와 호출", "매개변수와 반환값", "모듈 import 기초", "실습: 계산기 함수 만들기"],
        learningObjectives: ["함수를 정의하고 호출할 수 있다", "매개변수와 반환값의 개념을 이해하고 활용할 수 있다"],
        expectedOutcome: "사칙연산 계산기 함수 라이브러리 작성"
      },
      {
        sessionNumber: 4,
        title: "실무 자동화 프로젝트",
        duration: "120분",
        keyTopics: ["파일 읽기/쓰기 (open, read, write)", "예외 처리 (try-except)", "미니 프로젝트: 파일 정리 스크립트", "다음 학습 로드맵"],
        learningObjectives: ["파일 입출력을 처리할 수 있다", "예외 처리를 통해 안정적인 프로그램을 작성할 수 있다"],
        expectedOutcome: "폴더 내 파일을 확장자별로 분류하는 자동화 스크립트 완성"
      }
    ],
    prerequisites: [
      "컴퓨터 기본 사용 능력 (파일/폴더 관리, 프로그램 설치)",
      "영문 타이핑 가능",
      "개인 노트북 지참 권장 (Windows 10 이상 또는 macOS)"
    ],
    assessmentStrategy: "각 세션 종료 시 실습 과제 완료 여부로 형성평가 진행. 마지막 세션에서 개인 자동화 스크립트 완성을 총괄평가로 활용."
  }
};

// ============================================================
// 프롬프트 빌더 헬퍼
// ============================================================

/**
 * 교육대상에 맞는 가이드 텍스트 반환
 */
export function getTargetAudienceGuide(targetAudience: string): string {
  return TARGET_AUDIENCE_GUIDE[targetAudience] || TARGET_AUDIENCE_GUIDE['general_adult'];
}

/**
 * 커리큘럼 설계 프롬프트 생성
 */
export function buildCurriculumPrompt(
  briefing: BriefingInput,
  webSearchContext?: string,
  previousValidationFeedback?: string
): string {
  const audienceGuide = getTargetAudienceGuide(briefing.targetAudience as string);
  
  let prompt = `## 커리큘럼 설계 요청

### 입력 정보
- **주제**: ${briefing.topic}
- **설명**: ${briefing.description || '(없음)'}
- **교육대상**: ${briefing.targetAudience}
- **총 교육 시간**: ${briefing.totalDuration}
- **회차 수**: ${briefing.sessionCount}회차
- **교육 수준**: ${briefing.courseLevel}
${briefing.specialRequirements ? `- **특별 요구사항**: ${briefing.specialRequirements}` : ''}

### 교육대상 가이드
${audienceGuide}

### 출력 요구사항
**반드시 아래 JSON 형식으로만 출력하세요. 다른 텍스트 없이 JSON만 출력합니다.**

\`\`\`json
{
  "title": "커리큘럼 제목",
  "totalDuration": "총 시간 (예: 8시간)",
  "targetAudienceAnalysis": "대상 학습자 분석 (2-3문장)",
  "learningObjectives": ["목표1", "목표2", "목표3"],
  "sessions": [
    {
      "sessionNumber": 1,
      "title": "세션 제목",
      "duration": "120분",
      "keyTopics": ["주제1", "주제2"],
      "learningObjectives": ["세션 목표1"],
      "expectedOutcome": "기대 성과"
    }
  ],
  "prerequisites": ["선수 지식1"],
  "assessmentStrategy": "평가 전략"
}
\`\`\`

### 필수 규칙
1. **정확히 ${briefing.sessionCount}개의 세션**을 포함해야 합니다 (이 숫자를 절대 변경하지 마세요!)
2. 전체 학습 목표는 **3-5개**를 작성하세요
3. 각 세션에는 반드시 keyTopics, learningObjectives, expectedOutcome을 포함하세요
4. sessionNumber는 1부터 순차적으로 증가해야 합니다
5. 교육대상(${briefing.targetAudience})에 맞는 난이도와 언어를 사용하세요`;

  if (webSearchContext) {
    prompt += `\n\n### 참고 자료 (웹 검색 결과)\n${webSearchContext}`;
  }

  if (previousValidationFeedback) {
    prompt += previousValidationFeedback;
  }

  // Few-shot 예시 (간략화)
  prompt += `\n\n### 참고 예시
**입력**: Python 기초 프로그래밍, 직장인, 4회차, 2시간/회, 입문과정
**출력 (요약)**: 총 4개 세션, 각 세션에 3-4개 keyTopics, 세션별 구체적인 expectedOutcome 포함`;

  return prompt;
}

/**
 * 수업안 프롬프트 생성
 */
export function buildLessonPlanPrompt(
  briefing: BriefingInput,
  curriculum: CurriculumOutput,
  sessionNumber: number,
  previousValidationFeedback?: string
): string {
  const session = curriculum.sessions.find(s => s.sessionNumber === sessionNumber);
  if (!session) {
    throw new Error(`세션 ${sessionNumber}을 찾을 수 없습니다`);
  }

  const audienceGuide = getTargetAudienceGuide(briefing.targetAudience as string);

  let prompt = `## 수업안 작성 요청 (세션 ${sessionNumber})

### 커리큘럼 정보
- **전체 제목**: ${curriculum.title}
- **세션 제목**: ${session.title}
- **세션 시간**: ${session.duration}
- **핵심 주제**: ${session.keyTopics.join(', ')}
- **기대 성과**: ${session.expectedOutcome}

### 교육대상 가이드
${audienceGuide}

### 출력 요구사항
**반드시 아래 JSON 형식으로만 출력하세요.**

\`\`\`json
{
  "sessionNumber": ${sessionNumber},
  "title": "${session.title}",
  "duration": "${session.duration}",
  "learningObjectives": ["목표1", "목표2"],
  "introduction": {
    "duration": "10분",
    "activity": "도입 활동",
    "teacherAction": "교수자 행동",
    "learnerAction": "학습자 행동"
  },
  "development": [
    {
      "duration": "30분",
      "activity": "활동명",
      "teacherAction": "교수자 행동",
      "learnerAction": "학습자 행동",
      "materials": ["자료1"]
    }
  ],
  "conclusion": {
    "duration": "10분",
    "activity": "정리 활동",
    "teacherAction": "교수자 행동",
    "learnerAction": "학습자 행동"
  },
  "materials": ["필요 자료 목록"],
  "assessmentMethod": "평가 방법"
}
\`\`\`

### 필수 규칙
1. 도입(introduction) - 전개(development) - 정리(conclusion) 구조를 반드시 포함
2. 전개(development)는 2-4개의 활동 블록으로 구성
3. 각 활동의 소요 시간 합계가 세션 시간(${session.duration})과 일치해야 함
4. teacherAction과 learnerAction을 구체적으로 작성
5. 교육대상에 맞는 활동 설계`;

  if (previousValidationFeedback) {
    prompt += previousValidationFeedback;
  }

  return prompt;
}
