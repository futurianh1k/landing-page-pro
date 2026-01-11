# 교육대상 선택 기능 추가

**작성일**: 2026-01-10  
**작업자**: AI Assistant

---

## 📋 사용자 요청

1. 파이프라인 개선 계획 문서화
2. 프로젝트 생성 기초 입력 단계에 교육대상 선택 기능 추가

---

## ✅ 완료된 작업

### 1. 파이프라인 개선 계획 문서화

- `history/2026-01-10_pipeline-quality-improvement-plan.md` 생성
- 3주 단계별 개선 계획 수립
- 구조화된 타입 정의, 프롬프트 강화, 검증 로직 설계 포함

### 2. 교육대상 선택 기능 추가

#### 2.1 프론트엔드 (BriefWizard.tsx)

```typescript
// 교육대상 분류 (보편적 기준)
export const EDUCATION_TARGETS = [
  { value: "elementary", label: "초등학생", description: "7-12세" },
  { value: "middle_school", label: "중학생", description: "13-15세" },
  { value: "high_school", label: "고등학생", description: "16-18세" },
  { value: "university", label: "대학생/대학원생", description: "대학 재학 및 졸업예정자" },
  { value: "job_seeker", label: "취업준비생", description: "구직 중인 성인" },
  { value: "office_worker", label: "직장인 (사무직)", description: "기업 일반 직원" },
  { value: "manager", label: "관리자/리더", description: "팀장, 임원 등 관리 직급" },
  { value: "professional", label: "전문직", description: "의사, 변호사, 회계사 등" },
  { value: "self_employed", label: "자영업자/소상공인", description: "개인 사업 운영자" },
  { value: "public_servant", label: "공무원", description: "공공기관 종사자" },
  { value: "educator", label: "교사/교육자", description: "학교, 학원, 기업 교육 담당자" },
  { value: "general_adult", label: "일반 성인", description: "특정 직업군 구분 없음" },
  { value: "senior", label: "시니어", description: "60세 이상" },
];
```

**변경 사항:**
- `BriefData` 인터페이스에 `educationTarget` 필드 추가
- 교육 설정 단계(Step 2)에 교육대상 선택 UI 추가 (그리드 버튼 형태)
- 검토 단계(Step 6)에 교육대상 표시 추가

#### 2.2 백엔드 (Azure Functions)

**createProject.ts:**
- `educationTarget` 파라미터 수신 추가
- DB에 `education_target` 저장

**generationJobWorker.ts:**
- `ProjectContext` 인터페이스에 `educationTarget` 추가
- `EDUCATION_TARGET_LABELS` 매핑 추가 (한글 레이블)
- 모든 AI 프롬프트에 교육대상 정보 포함:
  - `interpret` 단계
  - `generate_document` 단계
  - `generate_infographic` 단계
  - `generate_slides` 단계
  - 6단계 파이프라인 공통 `educationInfo`

#### 2.3 데이터베이스 마이그레이션

```sql
-- supabase/migrations/20260110000000_add_education_target.sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS education_target TEXT DEFAULT NULL;
```

---

## 🚀 배포 상태

- [x] Azure Functions 빌드 완료
- [x] Azure Functions 배포 완료
- [x] **데이터베이스 마이그레이션 완료** (Azure PostgreSQL)

### 마이그레이션 방법 (Azure PostgreSQL)

`azure-functions/src/lib/migrationSQL.ts`에 ALTER TABLE 추가 후:

```bash
# API 호출로 마이그레이션 실행
Invoke-RestMethod -Uri "https://func-landing-page-pro.azurewebsites.net/api/runmigration" -Method Get
# 결과: {"success": true, "message": "Migration completed"}
```

---

## 📝 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/BriefWizard.tsx` | 교육대상 UI 및 데이터 타입 추가 |
| `src/pages/ProjectCreate.tsx` | API 호출 시 educationTarget 전달 |
| `azure-functions/src/functions/createProject.ts` | educationTarget 파라미터 처리 |
| `azure-functions/src/functions/generationJobWorker.ts` | AI 프롬프트에 교육대상 반영 |
| `supabase/migrations/20260110000000_add_education_target.sql` | DB 컬럼 추가 마이그레이션 |

---

## 🎯 AI 프롬프트 변경 예시

**변경 전:**
```
- 교육 시간: 2시간
- 교육 과정: 기본과정
- 회차: 1회차
```

**변경 후:**
```
- 교육대상: 직장인 (사무직)
- 교육 시간: 2시간
- 교육 과정: 기본과정
- 회차: 1회차
```

AI는 이제 교육대상에 맞는:
- 용어 수준
- 예시 선택
- 난이도 조절
- 설명 깊이

를 반영하여 콘텐츠를 생성합니다.

---

*작성: AI Assistant*
