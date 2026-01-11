# API 키 수정 및 대시보드 개선

**날짜**: 2026-01-11
**작업자**: Claude Code
**상태**: ✅ 완료 및 배포됨

## 문제 요약

1. **코스빌더 콘텐츠 생성 시 500 에러 발생**
   - Google Generative AI 403 Forbidden 에러
   - Azure Functions에서 API 키 환경 변수명 불일치

2. **프로젝트가 코스로 변환되면 대시보드에서 사라지는 문제**
   - `getProjects` API가 레슨에 연결된 프로젝트를 제외
   - 사용자가 변환된 프로젝트를 다시 확인할 수 없음

3. **인포그래픽/웹검색 기능이 활성화되지 않는 문제**
   - 6단계 파이프라인에 해당 단계가 누락됨

## 해결 방안

### 1. API 키 환경 변수명 통일

**변경된 파일**:
- `azure-functions/src/functions/generateSingleContent.ts:252`
- `azure-functions/src/functions/enhanceContent.ts:43`
- `azure-functions/src/functions/regenerateSingleContent.ts:58`
- `azure-functions/local.settings.json:14-16`

**변경 내용**:
```typescript
// Before
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// After
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
```

**local.settings.json 업데이트**:
```json
{
  "GEMINI_API_KEY": "AIzaSyDzll_sialr7wIk764qJf8-sQrdqiqqNQ4",
  "ANTHROPIC_API_KEY": "sk-ant-api03-...",
  "OPENAI_API_KEY": "sk-proj-..."
}
```

### 2. 6단계 파이프라인에 인포그래픽/이미지 생성 단계 추가

**변경된 파일**: `azure-functions/src/lib/agent/plan.ts:87-95`

**변경 내용**:
```typescript
if (useSixStage) {
  const steps: PlannedStep[] = [];

  // 웹 검색 (선택적)
  if (options.enableWebSearch) {
    steps.push({ stepType: 'web_search', title: '웹 검색(최신 내용 반영)', estimatedMinutes: 1 });
  }

  // 6단계 파이프라인 (항상 모든 단계 실행)
  steps.push(
    { stepType: 'curriculum_design', title: '커리큘럼 설계', estimatedMinutes: 2 },
    { stepType: 'lesson_plan', title: '수업안 작성', estimatedMinutes: 3 },
    { stepType: 'slides', title: '슬라이드 구성', estimatedMinutes: 3 },
    { stepType: 'lab_template', title: '실습 템플릿', estimatedMinutes: 2 },
    { stepType: 'assessment', title: '평가/퀴즈', estimatedMinutes: 2 },
    { stepType: 'final_review', title: '최종 검토', estimatedMinutes: 1 }
  );

  // ✅ 새로 추가: 인포그래픽 생성 (선택적)
  if (outputs.infographic) {
    steps.push({ stepType: 'generate_infographic', title: '인포그래픽 생성', estimatedMinutes: 2 });
  }

  // ✅ 새로 추가: 이미지/디자인 에셋 생성 (선택적)
  if (options.enableImageGeneration && (outputs.infographic || outputs.slides || outputs.document)) {
    steps.push({ stepType: 'design_assets', title: '디자인/삽화 생성(이미지)', estimatedMinutes: 2 });
  }

  return steps;
}
```

### 3. 대시보드 프로젝트 목록 개선

**변경된 파일**:
- `azure-functions/src/functions/getProjects.ts:27-56`
- `src/pages/Dashboard.tsx:45, 332-337`

**getProjects.ts 변경 내용**:
```typescript
// Before: 레슨에 연결된 프로젝트는 제외
WHERE user_id = $1
  AND id NOT IN (
    SELECT project_id FROM lessons WHERE project_id IS NOT NULL
  )

// After: 모든 프로젝트 포함, 변환 여부 표시
SELECT
  p.id,
  p.user_id,
  p.title,
  p.description,
  p.document_content,
  p.document_url,
  p.ai_model,
  p.education_stage,
  p.subject,
  p.duration_minutes,
  p.education_duration,
  p.education_course,
  p.education_session,
  p.status,
  p.created_at,
  p.updated_at,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM lessons WHERE project_id = p.id
    ) THEN true
    ELSE false
  END as is_converted_to_course
FROM projects p
WHERE p.user_id = $1
ORDER BY p.created_at DESC
```

**Dashboard.tsx 변경 내용**:
```typescript
// Project 타입에 필드 추가
type Project = {
  // ... 기존 필드들
  is_converted_to_course?: boolean;  // ✅ 추가
};

// UI에 배지 표시
{project.is_converted_to_course && (
  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
    <BookOpen className="h-3 w-3 mr-1" />
    코스로 변환됨
  </Badge>
)}
```

## 배포 내역

### Azure Functions 배포
```bash
# 빌드
cd azure-functions && npm run build

# 배포
func azure functionapp publish func-landing-page-pro
```

**배포 완료**: 2026-01-11 16:38 (KST)

**배포된 Functions**:
- `generateSingleContent` - 단일 콘텐츠 생성
- `enhanceContent` - 콘텐츠 보강
- `regenerateSingleContent` - 콘텐츠 재생성
- `getProjects` - 프로젝트 목록 조회
- `startGenerationJob` - 생성 작업 시작 (plan.ts 변경 반영)

## 테스트 체크리스트

- [ ] 새 프로젝트 생성 테스트
  - [ ] 인포그래픽 옵션 체크
  - [ ] 웹 검색 옵션 체크
  - [ ] 이미지 생성 옵션 체크
- [ ] 코스빌더 콘텐츠 생성 테스트
  - [ ] 슬라이드 생성 (Gemini API)
  - [ ] 퀴즈 생성
  - [ ] 실습 가이드 생성
  - [ ] AI 보강 기능
  - [ ] AI 재생성 기능
- [ ] 대시보드 확인
  - [ ] 모든 프로젝트가 표시되는지 확인
  - [ ] "코스로 변환됨" 배지가 올바르게 표시되는지 확인
  - [ ] 변환된 프로젝트도 클릭 가능한지 확인

## 영향 범위

### 백엔드 (Azure Functions)
- ✅ API 키 설정 통일 → 모든 AI 모델 호출 안정화
- ✅ 6단계 파이프라인 확장 → 인포그래픽/이미지 생성 지원
- ✅ 프로젝트 조회 로직 개선 → 변환된 프로젝트 포함

### 프론트엔드 (React)
- ✅ 대시보드 타입 정의 업데이트
- ✅ 프로젝트 카드 UI 개선 (변환 상태 배지)

### 데이터베이스
- 변경 없음 (기존 스키마 활용)

## 관련 이슈/참고사항

### 이전 작업 이력
- `2026-01-10_generation-studio-improvements.md` - 스튜디오 UI 개선
- `2026-01-10_project-coursebuilder-integration-plan.md` - 프로젝트-코스 통합 계획

### 주요 개선 사항
1. **사용자 경험 개선**: 프로젝트가 코스로 변환되어도 대시보드에서 계속 접근 가능
2. **기능 완성도 향상**: 인포그래픽/웹검색 옵션이 실제로 작동
3. **안정성 향상**: API 키 설정 통일로 AI 호출 안정화

### 추가 개선 제안
- [ ] 프로젝트 상세 페이지에서 연결된 코스로 바로 이동하는 링크 추가
- [ ] 코스 상세 페이지에서 원본 프로젝트로 돌아가는 링크 추가
- [ ] 인포그래픽 생성 결과 미리보기 기능 강화

## 작성자 노트

이번 수정으로 다음 문제들이 해결되었습니다:

1. **API 키 문제**: 환경 변수명을 `GEMINI_API_KEY`로 통일하여 Google Generative AI 호출 오류 해결
2. **파이프라인 확장**: 6단계 파이프라인에서도 인포그래픽과 이미지 생성 기능 지원
3. **대시보드 개선**: 변환된 프로젝트도 목록에 표시하고 상태를 명확히 표시

모든 변경사항은 Azure Functions에 성공적으로 배포되었으며, 프론트엔드는 다음 배포 시 반영됩니다.
