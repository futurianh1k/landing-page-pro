# 웹 검색 활성화 및 인포그래픽/이미지 개선

## 작성일: 2026-01-11

## 요청 내용
1. 웹 검색(최신 내용 반영) 기능 활성화 - TAVILY_API_KEY와 SERPER_API_KEY 준비됨
2. 인포그래픽이 '종합 강의안' 내용을 기반으로 더 풍성하게 보이도록 개선
3. 디자인/삽화 이미지가 코드로 보이는 문제 해결

## 구현 내용

### 1. 웹 검색 기능 활성화
- **상태**: 코드는 이미 구현되어 있음 (`azure-functions/src/lib/web-search.ts`)
- **동작 방식**:
  - TAVILY_API_KEY 우선 사용, 없으면 SERPER_API_KEY 사용
  - 둘 다 없으면 에러 반환
- **에러 메시지 개선** (`src/pages/GenerationStudioPage.tsx`):
  - 검색 쿼리는 생성되었지만 결과가 없는 경우 더 명확한 메시지 표시
  - Azure Functions 환경 변수 설정 안내 추가

### 2. 인포그래픽이 종합 강의안 기반으로 더 풍성하게
- **파일**: `azure-functions/src/functions/generationJobWorker.ts`
- **변경 내용**:
  - `generate_infographic` 단계에서 종합 강의안 내용 활용
  - `contextState.interpret.finalReview` 또는 `combinedDocument` 우선 사용
  - 없으면 각 단계의 콘텐츠(커리큘럼, 수업안, 실습 가이드, 평가)를 종합
  - 프롬프트에 종합 강의안 전체 내용 포함하여 더 풍성한 인포그래픽 생성
- **프롬프트 개선**:
  - 학습 목표와 핵심 가치
  - 커리큘럼 구조와 주요 주제
  - 학습 경로와 단계
  - 실습/활동 하이라이트
  - 평가 방법
  - 위 내용을 모두 포함하도록 지시
- **contextState 누적 로직 개선**:
  - `final_review` 단계의 `combinedDocument`도 `accumulatedOutputs`에 포함
  - `generate_infographic` 단계에서 종합 강의안 내용 접근 가능

### 3. 디자인/삽화 이미지 표시 문제 해결
- **파일**: `src/pages/GenerationStudioPage.tsx`
- **문제**: `design_assets` 단계의 output이 JSON으로만 표시됨
- **해결**:
  - `renderStepOutput` 함수에 `design_assets` 타입 특별 렌더링 추가
  - 이미지가 `artifacts`에 저장되므로 `artifactsByType`에서 확인
  - `infographic` 또는 `slides` artifact의 `assets.background.dataUrl`에서 이미지 가져오기
  - 이미지가 있으면 `<img>` 태그로 표시, 없으면 에러 메시지 표시
- **표시 내용**:
  - 생성된 배경 이미지
  - 모델 정보 (dall-e-3 등)
  - 생성일시

## 변경된 파일
- `azure-functions/src/functions/generationJobWorker.ts`
  - `generate_infographic` 단계: 종합 강의안 기반 프롬프트 개선
  - `accumulatedOutputs`에 `combinedDocument` 추가
- `src/pages/GenerationStudioPage.tsx`
  - `renderStepOutput` 함수: `design_assets` 타입 특별 렌더링 추가
  - 웹 검색 에러 메시지 개선

## 환경 변수 설정 필요
Azure Functions에 다음 환경 변수가 설정되어 있어야 합니다:
- `TAVILY_API_KEY` (우선) 또는 `SERPER_API_KEY` (대체)
- `OPENAI_API_KEY` (이미지 생성용)

## 테스트 방법
1. 새 프로젝트 생성 시 "웹 검색(최신 내용 반영)" 옵션 활성화
2. Generation Studio에서 웹 검색 단계 확인
3. 인포그래픽 탭에서 종합 강의안 기반으로 생성된 인포그래픽 확인
4. 디자인/삽화 생성 단계에서 이미지가 제대로 표시되는지 확인
