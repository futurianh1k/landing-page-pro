# Azure Functions - Autopilot Backend API

**교육콘텐츠 자동 생성 플랫폼의 백엔드 API 서버**

Azure Functions를 사용한 서버리스 백엔드 구현으로, Supabase Edge Functions를 대체합니다.

---

## 📋 목차

- [주요 기능](#주요-기능)
- [API 엔드포인트](#api-엔드포인트)
- [개발 환경 설정](#개발-환경-설정)
- [배포](#배포)
- [아키텍처](#아키텍처)
- [AI 모델 및 서비스](#ai-모델-및-서비스)
- [환경 변수](#환경-변수)
- [문제 해결](#문제-해결)

---

## 🚀 주요 기능

### 1. 프로젝트 생성 및 관리
- 프로젝트 생성, 조회, 수정, 삭제
- 교육 대상(`educationTarget`) 설정 지원
- 프로젝트별 생성 작업 관리

### 2. AI 기반 6단계 콘텐츠 생성 파이프라인
1. **커리큘럼 설계** (`curriculum_design`)
   - 교육 세션 구조 설계
   - JSON 스키마 검증 및 재시도 로직
   
2. **강의안 작성** (`lesson_plan`)
   - 세션별 상세 강의안 생성
   - 활동 블록 구조화
   
3. **슬라이드 생성** (`slides`)
   - 프레젠테이션 슬라이드 자동 생성
   - 인용 및 출처 자동 추가
   
4. **실습 템플릿** (`lab_template`)
   - 실습 가이드 및 템플릿 생성
   
5. **평가 문항** (`assessment`)
   - 퀴즈 및 평가 문항 생성
   - JSON 스키마 검증
   
6. **최종 검토** (`final_review`)
   - 파이프라인 일관성 검사
   - 종합 강의안 생성

### 3. 웹 검색 통합
- Tavily API (우선) 또는 Serper API를 통한 최신 정보 검색
- 검색 결과를 AI 프롬프트에 자동 통합

### 4. 이미지 생성
- Vertex AI Imagen API (우선) 또는 OpenAI DALL-E를 통한 이미지 생성
- 인포그래픽 및 슬라이드 배경 이미지 자동 생성

### 5. 프로젝트-코스빌더 통합
- 프로젝트 생성 결과를 코스빌더로 변환
- 모듈/레슨 구조 자동 매핑
- 원본 프로젝트와의 연결 유지

### 6. 코스빌더 단일 콘텐츠 생성
- 슬라이드, 퀴즈, 실습, 읽기자료, 요약 등 개별 생성
- 기존 콘텐츠 보강 및 재생성
- 콘텐츠 버전 관리

### 7. 코스 관리
- 코스 생성, 조회, 수정, 삭제
- 모듈 및 레슨 관리
- 공개 코스 배포 및 피드백 수집

---

## 🔌 API 엔드포인트

### 프로젝트 관리

#### `POST /api/createproject`
프로젝트 생성

```json
{
  "title": "프로젝트 제목",
  "description": "설명",
  "educationTarget": "교육 대상 (선택)",
  "educationDuration": "교육 시간",
  "educationSession": 4
}
```

#### `GET /api/projects`
사용자의 프로젝트 목록 조회

#### `GET /api/project/:id`
프로젝트 상세 조회

#### `PUT /api/project/:id`
프로젝트 수정

#### `DELETE /api/project/:id`
프로젝트 삭제

### AI 생성 작업 관리

#### `POST /api/generation/start`
생성 작업 시작

```json
{
  "projectId": "uuid",
  "aiModel": "gemini" | "claude" | "chatgpt",
  "options": {
    "enableWebSearch": true,
    "enableImageGeneration": true
  }
}
```

#### `GET /api/generation/job/:jobId`
생성 작업 상태 조회

#### `POST /api/generation/chat`
생성 중 채팅 (수정 요청)

```json
{
  "projectId": "uuid",
  "message": "수정 요청",
  "targets": ["slides", "quiz"],
  "aiModel": "gemini"
}
```

#### `POST /api/generation/cancel`
생성 작업 취소

### 프로젝트-코스 변환

#### `POST /api/project/convert-to-course`
프로젝트를 코스로 변환

```json
{
  "projectId": "uuid",
  "newCourseTitle": "새 코스 제목 (선택)",
  "targetCourseId": "기존 코스 ID (선택)"
}
```

### 코스빌더 단일 콘텐츠 생성

#### `POST /api/content/generate`
단일 콘텐츠 생성 (슬라이드, 퀴즈, 실습 등)

```json
{
  "lessonId": "uuid",
  "contentType": "slides" | "quiz" | "lab" | "reading" | "summary",
  "context": {
    "title": "레슨 제목",
    "learningObjectives": ["목표1", "목표2"]
  },
  "aiModel": "gemini"
}
```

#### `POST /api/content/enhance`
기존 콘텐츠 보강

```json
{
  "lessonId": "uuid",
  "contentType": "slides",
  "existingContent": {...},
  "enhanceRequest": "더 자세한 설명 추가",
  "aiModel": "gemini"
}
```

#### `POST /api/content/regenerate`
콘텐츠 재생성

```json
{
  "lessonId": "uuid",
  "contentType": "slides",
  "style": "casual" | "professional" | "academic",
  "aiModel": "gemini"
}
```

### 콘텐츠 버전 관리

#### `GET /api/content/versions?lessonId=:id`
레슨의 버전 이력 조회

#### `POST /api/content/versions`
새 버전 저장

#### `PUT /api/content/versions/:versionId/restore`
특정 버전으로 복원

### 코스 관리

#### `POST /api/courses`
코스 생성

#### `GET /api/courses`
사용자의 코스 목록 조회

#### `GET /api/course/:id`
코스 상세 조회

#### `GET /api/course/:id/public`
공개 코스 조회 (인증 불필요)

#### `PUT /api/course/:id`
코스 수정

#### `DELETE /api/course/:id`
코스 삭제

### 모듈 및 레슨 관리

#### `POST /api/module`
모듈 생성

#### `PUT /api/module/:id`
모듈 수정

#### `GET /api/course/:id/modules`
코스의 모듈 및 레슨 목록 조회

#### `POST /api/lesson`
레슨 생성

#### `PUT /api/lesson/:id`
레슨 수정

#### `GET /api/lesson/:id`
레슨 상세 조회

### 배포 및 피드백

#### `POST /api/deployment`
코스 배포

#### `GET /api/feedback/:courseId`
코스 피드백 조회

#### `POST /api/feedback`
피드백 제출

### 통계 및 관리

#### `GET /api/stats`
사용자 통계 조회

#### `GET /api/user/roles`
사용자 역할 조회

---

## 🛠 개발 환경 설정

### 필수 요구사항

- **Node.js**: 20.x 이상
- **Azure Functions Core Tools**: v4 이상
- **Azure CLI**: 최신 버전
- **PostgreSQL**: Azure Database for PostgreSQL (또는 로컬)

### 설치

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 로컬 실행
npm start
```

### 환경 변수 설정

`local.settings.json` 파일을 생성하고 다음 내용을 설정:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    
    "AZURE_POSTGRES_HOST": "your-postgres-host",
    "AZURE_POSTGRES_DATABASE": "your-database",
    "AZURE_POSTGRES_USER": "your-user",
    "AZURE_POSTGRES_PASSWORD": "your-password",
    "AZURE_POSTGRES_PORT": "5432",
    
    "ENTRA_TENANT_ID": "your-tenant-id",
    "ENTRA_TENANT_NAME": "your-tenant-name",
    "ENTRA_CLIENT_ID": "your-client-id",
    
    "GEMINI_API_KEY": "your-gemini-api-key",
    "ANTHROPIC_API_KEY": "your-anthropic-api-key",
    "OPENAI_API_KEY": "your-openai-api-key",
    
    "TAVILY_API_KEY": "your-tavily-api-key",
    "SERPER_API_KEY": "your-serper-api-key",
    
    "VERTEX_API_KEY": "your-vertex-api-key",
    "VERTEX_PROJECT_ID": "your-google-cloud-project-id",
    "VERTEX_LOCATION": "us-central1"
  }
}
```

**참고**: 
- `local.settings.json`은 Git에 커밋하지 마세요 (`.gitignore`에 포함됨)
- 상세한 환경 변수 설정 방법은 `docs/environment-variables-setup.md` 참조

### 로컬 실행

```bash
npm run build
npm start
```

함수들은 다음 주소에서 사용 가능:
- `http://localhost:7071/api/*`

---

## 📦 배포

### 1. Azure Function App 생성

```bash
az functionapp create \
  --resource-group rg-landing-page-pro \
  --name func-landing-page-pro \
  --storage-account stlandingpagepro \
  --consumption-plan-location koreacentral \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4
```

### 2. 환경 변수 설정

```bash
az functionapp config appsettings set \
  --name func-landing-page-pro \
  --resource-group rg-landing-page-pro \
  --settings \
    AZURE_POSTGRES_HOST=your-host \
    AZURE_POSTGRES_DATABASE=your-db \
    AZURE_POSTGRES_USER=your-user \
    AZURE_POSTGRES_PASSWORD=your-password \
    ENTRA_CLIENT_ID=your-client-id \
    GEMINI_API_KEY=your-api-key \
    ANTHROPIC_API_KEY=your-api-key \
    OPENAI_API_KEY=your-api-key \
    TAVILY_API_KEY=your-api-key \
    SERPER_API_KEY=your-api-key \
    VERTEX_API_KEY=your-api-key \
    VERTEX_PROJECT_ID=your-project-id
```

### 3. 배포

```bash
npm run build
func azure functionapp publish func-landing-page-pro
```

---

## 🏗 아키텍처

### 미들웨어

- **`auth.ts`**: JWT 토큰 검증 (Azure AD B2C / Entra External ID)
- **`database.ts`**: PostgreSQL 연결 풀 및 쿼리 헬퍼
- **`ai-services.ts`**: AI 서비스 통합 (Gemini, Claude, ChatGPT)

### 라이브러리

#### AI 에이전트 (`lib/agent/`)
- **`types.ts`**: 파이프라인 타입 정의 및 JSON 스키마
- **`validation.ts`**: AI 출력 검증 및 재시도 로직
- **`prompts.ts`**: 역할 기반 시스템 프롬프트 및 Few-shot 예제
- **`generator.ts`**: `generateWithRetry` 유틸리티
- **`plan.ts`**: 생성 단계 계획 및 아티팩트 관리

#### 외부 서비스 통합
- **`web-search.ts`**: Tavily/Serper 웹 검색 통합
- **`image-generation.ts`**: Vertex AI Imagen / OpenAI DALL-E 이미지 생성
- **`citations.ts`**: 인용 및 출처 처리

### 데이터베이스 스키마

주요 테이블:
- `projects`: 프로젝트 정보
- `generation_jobs`: 생성 작업 상태
- `generation_steps`: 생성 단계별 결과
- `courses`: 코스 정보
- `modules`: 코스 모듈
- `lessons`: 레슨 정보
- `project_course_links`: 프로젝트-코스 연결
- `content_versions`: 콘텐츠 버전 이력

---

## 🤖 AI 모델 및 서비스

### 지원 AI 모델

| 모델 | 모델명 | 비용 | 특징 |
|------|--------|------|------|
| **Gemini** | `gemini-1.5-flash` | 무료 | 빠른 응답, 한국어 지원 우수 |
| **Claude** | `claude-3-5-sonnet-20241022` | $0.25/MTok | 고품질 출력, 긴 컨텍스트 |
| **ChatGPT** | `gpt-4o-mini` | $0.15/MTok | 안정적인 성능 |

### 외부 서비스

- **웹 검색**: Tavily API (우선) → Serper API (대체)
- **이미지 생성**: Vertex AI Imagen API (우선) → OpenAI DALL-E (대체)

---

## 🔐 환경 변수

### 필수 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `AZURE_POSTGRES_HOST` | PostgreSQL 호스트 | `psql-landing-page-pro.postgres.database.azure.com` |
| `AZURE_POSTGRES_DATABASE` | 데이터베이스 이름 | `landingpagepro` |
| `AZURE_POSTGRES_USER` | 데이터베이스 사용자 | `pgadmin` |
| `AZURE_POSTGRES_PASSWORD` | 데이터베이스 비밀번호 | `***` |
| `ENTRA_TENANT_ID` | Entra ID 테넌트 ID | `uuid` |
| `ENTRA_CLIENT_ID` | Entra ID 클라이언트 ID | `uuid` |

### AI API 키 (최소 1개 필요)

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `GEMINI_API_KEY` | Google Gemini API 키 | 선택 |
| `ANTHROPIC_API_KEY` | Anthropic Claude API 키 | 선택 |
| `OPENAI_API_KEY` | OpenAI API 키 | 선택 |

### 선택적 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `TAVILY_API_KEY` | Tavily 웹 검색 API 키 | - |
| `SERPER_API_KEY` | Serper 웹 검색 API 키 | - |
| `VERTEX_API_KEY` | Vertex AI Imagen API 키 | - |
| `VERTEX_PROJECT_ID` | Google Cloud 프로젝트 ID | - |
| `VERTEX_LOCATION` | Vertex AI 리전 | `us-central1` |

**상세한 설정 방법**: `docs/environment-variables-setup.md` 참조

---

## 🐛 문제 해결

### 연결 오류

**문제**: "Connection refused" 또는 "ECONNREFUSED"
- PostgreSQL 방화벽 규칙 확인
- `local.settings.json`의 연결 정보 확인
- Azure Portal에서 방화벽 규칙에 개발자 IP 추가

### 인증 오류

**문제**: "Unauthorized" 또는 "Invalid token"
- JWT 토큰이 유효한지 확인
- Entra ID 설정 확인 (`ENTRA_CLIENT_ID`, `ENTRA_TENANT_ID`)
- JWKS URI가 올바른지 확인

### AI API 오류

**문제**: "AI API error" 또는 "Rate limit exceeded"
- API 키가 유효한지 확인
- API 사용량 및 크레딧 확인
- 모델 이름이 올바른지 확인

### 이미지 생성 실패

**문제**: 이미지 생성이 스킵되거나 실패
- `VERTEX_API_KEY` 또는 `OPENAI_API_KEY` 설정 확인
- Vertex AI의 경우 `VERTEX_PROJECT_ID` 확인
- 로그에서 구체적인 오류 메시지 확인

### 웹 검색 실패

**문제**: 웹 검색 결과가 없음
- `TAVILY_API_KEY` 또는 `SERPER_API_KEY` 설정 확인
- API 키가 유효한지 확인
- 로그에서 오류 메시지 확인

---

## 📊 비용 추정

### Azure Functions
- **Consumption Plan**: $0.20/백만 실행 + $0.000016/GB-s
- **예상**: 월 $5-10 (월 10K 요청 기준)

### AI API
- **Gemini**: 무료 (gemini-1.5-flash)
- **Claude**: $0.25/MTok (월 20M 토큰 기준 약 $5)
- **ChatGPT**: $0.15/MTok (월 20M 토큰 기준 약 $3)

### 외부 서비스
- **Tavily**: 사용량 기반 (무료 티어 제공)
- **Serper**: 사용량 기반 (무료 티어 제공)
- **Vertex AI Imagen**: 사용량 기반 (이미지당 $0.02-0.04)

**총 예상 비용**: 월 $13-23 (기본 사용량 기준)

---

## 📚 참고 자료

### 문서
- [환경 변수 설정 가이드](./docs/environment-variables-setup.md)
- [Vertex AI Imagen 설정 가이드](./docs/vertex-ai-imagen-setup-guide.md)
- [Tavily MCP 통합 가이드](./docs/tavily-mcp-integration.md)

### 외부 링크
- [Azure Functions 문서](https://docs.microsoft.com/azure/azure-functions/)
- [Azure AD B2C 문서](https://docs.microsoft.com/azure/active-directory-b2c/)
- [Vertex AI 문서](https://cloud.google.com/vertex-ai/docs)

---

## 📝 변경 이력

### 2026-01-11
- Vertex AI Imagen API 지원 추가
- Tavily/Serper 웹 검색 통합
- 환경 변수 설정 가이드 추가

### 2026-01-10
- 프로젝트-코스빌더 통합 (`convertProjectToCourse`)
- 단일 콘텐츠 생성 API (`generateSingleContent`, `enhanceContent`, `regenerateSingleContent`)
- 콘텐츠 버전 관리 (`contentVersions`)

### 2025-12-31
- 6단계 AI 생성 파이프라인 구현
- JSON 스키마 검증 및 재시도 로직
- 역할 기반 프롬프트 및 Few-shot 예제

---

## 📄 라이선스

이 프로젝트는 Autopilot의 일부입니다.

---

**작성일**: 2026-01-11  
**최종 업데이트**: 2026-01-11
