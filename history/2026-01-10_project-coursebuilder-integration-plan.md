# 프로젝트 생성 ↔ 코스빌더 통합 계획

**작성일**: 2026-01-10  
**상태**: Phase 4 전체 구현 완료 ✅

---

## 🎯 핵심 설계 원칙: 역할 분리

| 기능 | 목적 | AI 생성 방식 |
|------|------|------------|
| **프로젝트 생성** | 빠른 초안 일괄 생성 (Quick Start) | 6단계 파이프라인 전체 실행 |
| **코스빌더** | 정밀 편집 + 부분 보강 (Deep Edit) | **단일 콘텐츠 생성/보강** (파이프라인 X) |

```
┌─────────────────────────────────────────────────────────────────┐
│                        역할 분리                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   프로젝트 생성                      코스빌더                     │
│   ────────────                      ──────────                   │
│   • 아이디어 → 완성 패키지           • 가져온 콘텐츠 편집           │
│   • 6단계 파이프라인                 • 단일 콘텐츠 생성             │
│   • 일괄 생성 (~13분)               • 콘텐츠 보강                  │
│   • 다운로드 (즉시 사용)             • 부분 재생성                  │
│                                                                 │
│   [요리 레시피 자동 생성]            [주방에서 직접 요리]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 현재 상태 분석

### 1. 프로젝트 생성 (`GenerationStudioPage`)

```
[브리핑 입력] → [6단계 AI 파이프라인] → [결과물 다운로드]
```

| 항목 | 설명 |
|------|------|
| 입력 | 주제, 교육대상, 회차, 시간 |
| 파이프라인 | web_search → curriculum → lesson_plan → slides → lab_template → assessment → final_review |
| 출력 | Markdown, PDF, DOCX, PPT 다운로드 |
| 특징 | **즉시 사용 가능한 완성형 패키지** |
| 상태 | ✅ 정상 동작 |

### 2. 코스빌더 (`CourseBuilderPage`) - 현재 문제점

```
[코스 생성] → [모듈/레슨 구조 편집] → [레슨별 AI 콘텐츠 생성]
```

| 항목 | 설명 |
|------|------|
| 구조 | Course → Module → Lesson 계층 |
| 연동 | `lessons.project_id`로 프로젝트와 연결 |
| AI 생성 | 레슨 선택 → AI 콘텐츠 생성 (프로젝트 자동 생성) |
| 특징 | **세밀한 편집이 가능한 구조체** |

#### ⚠️ 현재 코스빌더의 문제점

```
현재: "이 레슨을 AI로 생성하기" 클릭 시
      1. 새 프로젝트 생성
      2. 전체 파이프라인 실행 (6단계)  ← 과도함!
      3. 결과를 레슨에 연결

문제: 이미 프로젝트 생성에서 초안을 만들었는데,
      코스빌더에서 또 전체 파이프라인을 돌리면 중복 작업
```

### 3. 현재 연동 상태

```
프로젝트 생성 ──────────────── 코스빌더
      │                            │
      │                            ▼
      │                      ┌─────────┐
      │                      │ 레슨에서 │
      │                      │ 프로젝트 │◄── 연결은 가능
      │                      │ 자동생성 │    (하지만 전체 파이프라인 실행)
      │                      └─────────┘
      │                            
      ▼                            
 [다운로드만 가능]          [역방향 연동 없음]
```

---

## 🎯 목표 시스템 (사용자 요구사항)

```
┌─────────────────────────────────────────────────────────────────┐
│                        사용자 여정                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   "아이디어만 있어요"          "기본 구조는 있어요"               │
│         │                            │                          │
│         ▼                            ▼                          │
│   ┌──────────────┐            ┌──────────────┐                  │
│   │  프로젝트 생성  │            │   코스빌더    │                  │
│   │  (Quick Start)│            │  (Deep Edit) │                  │
│   └──────┬───────┘            └──────┬───────┘                  │
│          │                           │                          │
│          │    ┌──────────────┐       │                          │
│          └───►│  코스빌더로   │◄──────┘                          │
│               │   가져오기    │                                  │
│               └──────┬───────┘                                  │
│                      │                                          │
│                      ▼                                          │
│               [ 최종 교육 콘텐츠 ]                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 구현 계획

### Phase 1: 프로젝트 → 코스빌더 변환 기능

#### 1.1 데이터베이스 변경

```sql
-- projects 테이블에 소스 추적 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS 
  source_type TEXT DEFAULT 'direct' CHECK (source_type IN ('direct', 'from_course', 'imported'));

-- lessons 테이블에 콘텐츠 소스 추적
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS 
  content_source TEXT DEFAULT 'manual' CHECK (content_source IN ('ai_generated', 'manual', 'uploaded', 'imported'));

-- 프로젝트-코스 연결 테이블 (양방향 추적)
CREATE TABLE IF NOT EXISTS project_course_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('project_to_course', 'course_to_project')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, course_id)
);
```

#### 1.2 변환 로직 (Azure Function)

**새 함수**: `convertProjectToCourse`

```typescript
// 입력
interface ConvertRequest {
  projectId: string;
  newCourseTitle?: string;  // 없으면 프로젝트 제목 사용
  targetCourseId?: string;  // 기존 코스에 추가할 경우
}

// 프로젝트 → 코스 변환 로직
async function convertProjectToCourse(req: ConvertRequest): Promise<Course> {
  const project = await getProject(req.projectId);
  const generationJob = await getGenerationJob(req.projectId);
  
  // 커리큘럼 단계에서 세션 정보 추출
  const curriculumStep = generationJob.steps.find(s => s.step_type === 'curriculum_design');
  const curriculumJson = curriculumStep?.output?.curriculumJson;
  
  // 코스 생성 또는 선택
  const course = req.targetCourseId 
    ? await getCourse(req.targetCourseId)
    : await createCourse({
        title: req.newCourseTitle || project.title,
        description: project.description,
        target_audience: project.education_target,
        total_duration: project.education_duration,
      });
  
  // 세션별로 모듈/레슨 생성
  for (const session of curriculumJson.sessions) {
    const module = await createModule({
      course_id: course.id,
      title: `모듈 ${session.sessionNumber}: ${session.title}`,
      summary: session.expectedOutcome,
    });
    
    const lesson = await createLesson({
      module_id: module.id,
      project_id: project.id,  // 원본 프로젝트 연결
      title: session.title,
      learning_objectives: session.keyTopics.join('\n'),
      content_source: 'ai_generated',  // 소스 추적
    });
  }
  
  // 연결 기록
  await createProjectCourseLink(project.id, course.id, 'project_to_course');
  
  return course;
}
```

#### 1.3 UI 변경 - GenerationStudioPage

```tsx
// 생성 완료 후 버튼 추가
<div className="flex gap-2">
  <Button onClick={handleDownload}>
    <Download className="h-4 w-4 mr-2" />
    다운로드
  </Button>
  
  <Button variant="secondary" onClick={handleSendToCourseBuilder}>
    <Send className="h-4 w-4 mr-2" />
    코스빌더로 보내기
  </Button>
</div>
```

**다이얼로그 옵션**:
```tsx
<Dialog>
  <DialogContent>
    <DialogTitle>코스빌더로 보내기</DialogTitle>
    
    <RadioGroup>
      <RadioGroupItem value="new">
        새 코스로 생성
      </RadioGroupItem>
      <RadioGroupItem value="existing">
        기존 코스에 추가
      </RadioGroupItem>
    </RadioGroup>
    
    {isExisting && (
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="코스 선택" />
        </SelectTrigger>
        <SelectContent>
          {myCourses.map(course => (
            <SelectItem key={course.id} value={course.id}>
              {course.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    
    <Button onClick={handleConvert}>
      가져오기
    </Button>
  </DialogContent>
</Dialog>
```

---

### Phase 2: 코스빌더 AI 기능 재정의 (단일 콘텐츠 생성/보강)

#### 2.0 설계 원칙

```
┌─────────────────────────────────────────────────────────────────┐
│                    코스빌더 AI 기능 (개선)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [프로젝트에서 가져온 레슨]                                        │
│  ├─ 📝 내용 편집 (수동)                                          │
│  ├─ ✨ 특정 콘텐츠 보강 (AI)                                      │
│  │    └─ "슬라이드 내용을 더 자세히 작성해줘"                       │
│  │    └─ "퀴즈 문항을 5개 더 추가해줘"                             │
│  │    └─ "실습 단계를 초보자용으로 다시 작성해줘"                    │
│  └─ 🔄 특정 콘텐츠 재생성 (AI)                                    │
│       └─ "슬라이드만 다른 스타일로 재생성"                          │
│                                                                 │
│  [빈 레슨 (수동 생성)]                                            │
│  ├─ ✏️ 직접 작성                                                 │
│  └─ 🎯 단일 콘텐츠 생성 (파이프라인 X)                             │
│       └─ "이 주제로 슬라이드 10장 만들어줘"                         │
│       └─ "이 내용으로 퀴즈 5문항 만들어줘"                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.1 LessonDetailPane 개선 - 가져온 레슨 (콘텐츠 있음)

```tsx
// 기존 콘텐츠가 있는 경우
<Card>
  <CardHeader>
    <CardTitle>슬라이드</CardTitle>
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleEditSlides}>
        <Edit className="h-4 w-4 mr-2" />
        편집
      </Button>
      <Button variant="outline" onClick={() => handleEnhance('slides')}>
        <Sparkles className="h-4 w-4 mr-2" />
        AI로 보강
      </Button>
      <Button variant="ghost" onClick={() => handleRegenerate('slides')}>
        <RefreshCw className="h-4 w-4 mr-2" />
        재생성
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    {/* 기존 슬라이드 미리보기 */}
  </CardContent>
</Card>
```

#### 2.2 LessonDetailPane 개선 - 빈 레슨 (콘텐츠 없음)

```tsx
// 콘텐츠가 없는 경우 - 단일 콘텐츠 생성 UI
<Card>
  <CardHeader>
    <CardTitle>콘텐츠 추가</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <Button variant="outline" className="h-24 flex-col" onClick={() => handleAddContent('slides')}>
        <Presentation className="h-6 w-6 mb-2" />
        슬라이드 생성
      </Button>
      <Button variant="outline" className="h-24 flex-col" onClick={() => handleAddContent('quiz')}>
        <CheckSquare className="h-6 w-6 mb-2" />
        퀴즈 생성
      </Button>
      <Button variant="outline" className="h-24 flex-col" onClick={() => handleAddContent('lab')}>
        <ClipboardList className="h-6 w-6 mb-2" />
        실습 가이드 생성
      </Button>
      <Button variant="outline" className="h-24 flex-col" onClick={() => handleAddContent('reading')}>
        <FileText className="h-6 w-6 mb-2" />
        읽기 자료 생성
      </Button>
      <Button variant="outline" className="h-24 flex-col" onClick={() => handleAddContent('summary')}>
        <BookOpen className="h-6 w-6 mb-2" />
        요약 생성
      </Button>
      <Button variant="outline" className="h-24 flex-col" onClick={() => handleUpload()}>
        <Upload className="h-6 w-6 mb-2" />
        파일 업로드
      </Button>
    </div>
  </CardContent>
</Card>
```

#### 2.3 새로운 API: `generateSingleContent` (단일 콘텐츠 생성)

**Azure Function**: `generateSingleContent`

```typescript
// 단일 콘텐츠 생성 (파이프라인 X, 특정 콘텐츠만)
interface SingleContentRequest {
  lessonId: string;
  contentType: 'slides' | 'quiz' | 'lab' | 'reading' | 'summary';
  context: {
    lessonTitle: string;
    learningObjectives: string[];
    targetAudience?: string;
    duration?: string;
    additionalInstructions?: string;  // "초보자용으로", "실무 예시 포함" 등
  };
  aiModel: 'gemini' | 'claude' | 'chatgpt';
}

async function generateSingleContent(req: SingleContentRequest) {
  const { contentType, context, aiModel } = req;
  
  // 콘텐츠 타입별 전용 프롬프트 (파이프라인 아님!)
  const promptBuilders = {
    slides: buildSlidesOnlyPrompt,
    quiz: buildQuizOnlyPrompt,
    lab: buildLabOnlyPrompt,
    reading: buildReadingPrompt,
    summary: buildSummaryPrompt,
  };
  
  const { system, prompt } = promptBuilders[contentType](context);
  const result = await generateContent(aiModel, prompt, system);
  
  // 레슨에 콘텐츠 저장
  await saveLessonContent(req.lessonId, contentType, result);
  
  return { contentType, content: result };
}
```

#### 2.4 새로운 API: `enhanceContent` (콘텐츠 보강)

**Azure Function**: `enhanceContent`

```typescript
// 기존 콘텐츠 보강 (기존 내용 유지 + 개선)
interface EnhanceContentRequest {
  lessonId: string;
  contentType: 'slides' | 'quiz' | 'lab';
  existingContent: any;  // 기존 콘텐츠
  enhanceRequest: string;  // "더 자세히", "예시 추가", "난이도 낮춰서" 등
  aiModel: 'gemini' | 'claude' | 'chatgpt';
}

async function enhanceContent(req: EnhanceContentRequest) {
  const system = `당신은 교육 콘텐츠 편집 전문가입니다. 
기존 콘텐츠를 개선/보강해주세요. 기존 구조와 핵심 내용은 유지하면서 요청 사항을 반영하세요.`;

  const prompt = `
## 기존 콘텐츠
${JSON.stringify(req.existingContent, null, 2)}

## 보강 요청
${req.enhanceRequest}

## 지시사항
기존 콘텐츠를 기반으로 요청 사항을 반영하여 개선된 버전을 출력하세요.
기존 구조는 유지하고, 내용을 보강/수정하세요.
`;

  const result = await generateContent(req.aiModel, prompt, system);
  
  // 레슨에 업데이트된 콘텐츠 저장
  await updateLessonContent(req.lessonId, req.contentType, result);
  
  return { enhanced: result };
}
```

#### 2.5 새로운 API: `regenerateSingleContent` (단일 콘텐츠 재생성)

```typescript
// 특정 콘텐츠만 새로 생성 (기존 컨텍스트 활용)
interface RegenerateSingleRequest {
  lessonId: string;
  contentType: 'slides' | 'quiz' | 'lab';
  aiModel: 'gemini' | 'claude' | 'chatgpt';
  style?: string;  // "더 시각적으로", "간결하게" 등
}

async function regenerateSingleContent(req: RegenerateSingleRequest) {
  const lesson = await getLesson(req.lessonId);
  
  // 레슨의 기존 컨텍스트 수집 (학습 목표, 주제 등)
  const context = {
    lessonTitle: lesson.title,
    learningObjectives: lesson.learning_objectives?.split('\n') || [],
    // 다른 콘텐츠 참조 (예: 커리큘럼이 있으면 활용)
  };
  
  // 스타일 지시사항 추가
  if (req.style) {
    context.additionalInstructions = req.style;
  }
  
  // 단일 콘텐츠 생성
  return generateSingleContent({
    lessonId: req.lessonId,
    contentType: req.contentType,
    context,
    aiModel: req.aiModel,
  });
}
```

#### 2.6 AI 호출 방식 비교 (변경 전후)

| 시나리오 | 변경 전 | 변경 후 |
|---------|--------|--------|
| 코스빌더에서 새 레슨 생성 | 6단계 파이프라인 전체 | 단일 콘텐츠만 생성 |
| 슬라이드 보강 | 전체 재생성 | 기존 내용 + 보강 요청 |
| 퀴즈 추가 | 전체 재생성 | 퀴즈만 생성 |
| 프로젝트 가져오기 후 편집 | - | 편집/보강 모드 |
| 예상 소요 시간 | 10-15분 (전체 파이프라인) | 1-2분 (단일 콘텐츠) |

---

### Phase 3: 소스 추적 UI

#### 3.1 콘텐츠 소스 배지

```tsx
// 콘텐츠 아이템마다 소스 표시
function ContentSourceBadge({ source }: { source: string }) {
  const config = {
    ai_generated: { label: 'AI 생성', variant: 'default', icon: Sparkles },
    manual: { label: '수동 작성', variant: 'outline', icon: Edit },
    uploaded: { label: '업로드', variant: 'secondary', icon: Upload },
    imported: { label: '가져옴', variant: 'secondary', icon: Download },
  }[source];
  
  return (
    <Badge variant={config.variant}>
      <config.icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
```

#### 3.2 CurriculumTreePane 개선

```tsx
// 레슨 항목에 소스 표시
<AccordionContent>
  {module.lessons.map((lesson) => (
    <div className="flex items-center justify-between">
      <span>{lesson.title}</span>
      <div className="flex items-center gap-2">
        <ContentSourceBadge source={lesson.content_source} />
        {lesson.project_id && (
          <Badge variant="outline" className="text-xs">
            v{lesson.version || 1}
          </Badge>
        )}
      </div>
    </div>
  ))}
</AccordionContent>
```

---

### Phase 4: 버전 관리

#### 4.1 데이터베이스 변경

```sql
-- 콘텐츠 버전 이력
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  version_number INTEGER NOT NULL,
  content_snapshot JSONB,  -- 해당 시점의 콘텐츠 스냅샷
  created_by TEXT NOT NULL CHECK (created_by IN ('ai', 'user', 'import')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- lessons 테이블에 현재 버전 추가
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;
```

#### 4.2 버전 히스토리 UI

```tsx
// 버전 히스토리 패널
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="sm">
      <History className="h-4 w-4 mr-2" />
      버전 히스토리
    </Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>버전 히스토리</SheetTitle>
    </SheetHeader>
    <ScrollArea className="h-[calc(100vh-200px)]">
      {versions.map((v) => (
        <div key={v.id} className="p-3 border-b">
          <div className="flex justify-between items-center">
            <span className="font-medium">v{v.version_number}</span>
            <Badge>{v.created_by}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(v.created_at).toLocaleString('ko-KR')}
          </p>
          {v.notes && <p className="text-sm mt-1">{v.notes}</p>}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => handleRestoreVersion(v.id)}
          >
            이 버전으로 복원
          </Button>
        </div>
      ))}
    </ScrollArea>
  </SheetContent>
</Sheet>
```

---

## 📅 구현 일정

| Phase | 작업 내용 | 예상 시간 | 우선순위 |
|-------|----------|----------|---------|
| Phase 1 | 프로젝트 → 코스빌더 변환 | 6-8시간 | 🔴 필수 |
| Phase 2 | 코스빌더 AI 기능 재정의 (단일 콘텐츠 생성/보강) | 8-10시간 | 🔴 필수 |
| Phase 3 | 소스 추적 UI | 2-3시간 | 🟡 권장 |
| Phase 4 | 버전 관리 | 4-6시간 | 🟢 선택 |

**총 예상 시간**: 20-27시간

### Phase 2 세부 일정

| 작업 | 예상 시간 |
|------|----------|
| `generateSingleContent` API 구현 | 3시간 |
| `enhanceContent` API 구현 | 2시간 |
| `regenerateSingleContent` API 구현 | 1시간 |
| LessonDetailPane UI 개선 | 2-3시간 |
| 테스트 및 디버깅 | 1시간 |

---

## 🔄 데이터 흐름 요약 (개선된 버전)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           데이터 흐름                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────┐     ┌───────────────────────────┐        │
│  │     프로젝트 생성           │     │       코스빌더             │        │
│  │     (Quick Start)         │     │       (Deep Edit)         │        │
│  └───────────┬───────────────┘     └───────────┬───────────────┘        │
│              │                                 │                        │
│              │                                 │                        │
│              ▼                                 ▼                        │
│  ┌───────────────────────┐       ┌───────────────────────────────┐      │
│  │  6단계 파이프라인        │       │  단일 콘텐츠 생성/보강          │      │
│  │  ────────────────────  │       │  ─────────────────────────── │      │
│  │  • web_search          │       │  • generateSingleContent     │      │
│  │  • curriculum_design   │       │  • enhanceContent            │      │
│  │  • lesson_plan         │       │  • regenerateSingleContent   │      │
│  │  • slides              │       │                              │      │
│  │  • lab_template        │       │  파이프라인 X                 │      │
│  │  • assessment          │       │  특정 콘텐츠만 빠르게 생성     │      │
│  │  • final_review        │       │  (~1-2분)                    │      │
│  │                        │       │                              │      │
│  │  (~10-15분)            │       │                              │      │
│  └───────────┬────────────┘       └───────────┬───────────────────┘     │
│              │                                │                        │
│              │                                │                        │
│              ▼                                ▼                        │
│  ┌───────────────────────┐       ┌───────────────────────────────┐      │
│  │  완성형 패키지          │       │  레슨별 콘텐츠                 │      │
│  │  (다운로드 가능)        │       │  (편집/보강 가능)              │      │
│  └───────────┬────────────┘       └───────────────────────────────┘     │
│              │                                ▲                        │
│              │                                │                        │
│              │    ┌─────────────────────┐     │                        │
│              └───►│  코스빌더로 가져오기  │─────┘                        │
│                   │  (Phase 1)          │                              │
│                   └─────────────────────┘                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 공통 데이터 모델 (TypeScript)

```typescript
// ============================================================
// 콘텐츠 타입 및 소스
// ============================================================

// 콘텐츠 소스 타입
type ContentSource = 'ai_generated' | 'manual' | 'uploaded' | 'imported';

// 콘텐츠 타입
type ContentType = 'slides' | 'quiz' | 'lab' | 'reading' | 'summary' | 'video' | 'discussion';

// ============================================================
// 레슨 콘텐츠
// ============================================================

// 공통 콘텐츠 아이템
interface LessonContent {
  id: string;
  lessonId: string;
  type: ContentType;
  title: string;
  content: any;  // 타입별 상세 데이터 (JSON)
  duration?: number;
  source: ContentSource;
  generatedAt?: Date;
  aiModel?: string;
  version: number;
}

// 레슨 확장
interface LessonExtended {
  id: string;
  moduleId: string;
  projectId?: string;  // 연결된 프로젝트 (프로젝트에서 가져온 경우)
  title: string;
  learningObjectives: string[];
  contentSource: ContentSource;
  currentVersion: number;
  contents: LessonContent[];  // 레슨에 포함된 콘텐츠들
}

// ============================================================
// API 요청/응답 타입
// ============================================================

// 프로젝트 → 코스 변환 요청
interface ConvertProjectToCourseRequest {
  projectId: string;
  newCourseTitle?: string;
  targetCourseId?: string;  // 기존 코스에 추가할 경우
}

// 프로젝트 → 코스 변환 결과
interface ConversionResult {
  courseId: string;
  modulesCreated: number;
  lessonsCreated: number;
  linkedProjectId: string;
}

// 단일 콘텐츠 생성 요청 (파이프라인 X)
interface SingleContentRequest {
  lessonId: string;
  contentType: ContentType;
  context: {
    lessonTitle: string;
    learningObjectives: string[];
    targetAudience?: string;
    duration?: string;
    additionalInstructions?: string;
  };
  aiModel: 'gemini' | 'claude' | 'chatgpt';
}

// 콘텐츠 보강 요청
interface EnhanceContentRequest {
  lessonId: string;
  contentId: string;
  contentType: ContentType;
  existingContent: any;
  enhanceRequest: string;  // "더 자세히", "예시 추가", "난이도 낮춰서" 등
  aiModel: 'gemini' | 'claude' | 'chatgpt';
}

// 단일 콘텐츠 재생성 요청
interface RegenerateSingleRequest {
  lessonId: string;
  contentId: string;
  contentType: ContentType;
  aiModel: 'gemini' | 'claude' | 'chatgpt';
  style?: string;  // "더 시각적으로", "간결하게" 등
}
```

---

## ✅ 우선순위 권장

### 🔴 필수 (Phase 1 + 2)

1. **Phase 1**: 프로젝트 → 코스빌더 변환
   - 가장 핵심적인 양방향 연동 기능
   - 사용자 시나리오 1 (Quick Start → Deep Edit) 지원

2. **Phase 2**: 코스빌더 AI 기능 재정의
   - 전체 파이프라인 → 단일 콘텐츠 생성/보강으로 변경
   - 기존 "이 레슨을 AI로 생성하기" 기능 대체
   - 빠른 콘텐츠 생성 (~1-2분 vs ~10-15분)
   - **핵심 시너지**: 프로젝트에서 초안 생성 → 코스빌더에서 세밀한 보강

### 🟡 권장 (Phase 3)

3. **Phase 3**: 소스 추적 UI
   - 콘텐츠 관리 가시성 향상
   - AI 생성/수동 작성/업로드/가져옴 구분

### 🟢 선택 (Phase 4)

4. **Phase 4**: 버전 관리
   - 반복 개선 워크플로우 지원
   - 롤백 기능

---

## 🎯 핵심 시너지 포인트

```
┌─────────────────────────────────────────────────────────────────┐
│                     사용자 시나리오 예시                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣ 프로젝트 생성으로 빠른 초안 생성 (~13분)                      │
│     └─ 브리핑: "중장년 대상 챗GPT 활용법, 4회차, 회당 2시간"       │
│     └─ AI가 커리큘럼부터 퀴즈까지 일괄 생성                       │
│                                                                 │
│  2️⃣ "코스빌더로 보내기" 클릭 (Phase 1)                           │
│     └─ 생성된 결과물이 모듈/레슨 구조로 자동 매핑                  │
│                                                                 │
│  3️⃣ 코스빌더에서 정밀 편집 (Phase 2)                             │
│     └─ 2회차 슬라이드 보강: "더 많은 예시 추가해줘" (~1분)         │
│     └─ 3회차에 추가 퀴즈 생성: "심화 퀴즈 5문항" (~1분)            │
│     └─ 4회차 실습 재생성: "초보자용으로 다시 작성" (~2분)          │
│                                                                 │
│  ✅ 결과: 고품질 맞춤형 교육 콘텐츠 완성                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 참고 자료

- Coursera Course Builder: https://www.coursera.org/teach
- ADDIE Model: https://en.wikipedia.org/wiki/ADDIE_Model
- 기존 구현: `history/2025-12-06_course-builder-implementation.md`
- 파이프라인 품질 개선: `history/2026-01-10_pipeline-quality-improvement-plan.md`

---

## 📋 현재 구현된 파일 (참고용)

| 파일 | 설명 |
|------|------|
| `src/pages/GenerationStudioPage.tsx` | 프로젝트 생성 결과 화면 |
| `src/pages/CourseBuilderPage.tsx` | 코스빌더 메인 |
| `src/components/course/CurriculumTreePane.tsx` | 코스 구조 트리 |
| `src/components/course/LessonDetailPane.tsx` | 레슨 상세 (수정 필요) |
| `azure-functions/src/functions/generationJobWorker.ts` | 6단계 파이프라인 |

---

*작성자: AI Assistant*  
*최종 업데이트: 2026-01-10 (코스빌더 AI 기능 재정의 반영)*
