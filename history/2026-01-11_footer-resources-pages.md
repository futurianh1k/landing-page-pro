# 푸터 리소스 및 회사 페이지 구현

## 작성일: 2026-01-11

## 요청 내용
1. 영업팀 문의 페이지 활성화
2. 푸터의 "리소스" 하단 목록 활성화
3. 푸터의 "회사" 하단 목록 활성화

## 구현 내용

### 1. 영업팀 문의 모달 (`ContactModal`)
- **파일**: `src/components/ContactModal.tsx`
- **기능**:
  - 이름, 이메일, 회사명, 회사 규모 입력
  - 문의 유형 선택 (데모 요청, 가격 문의, 기업용 플랜, 파트너십, 기타)
  - 문의 내용 작성
  - 제출 시 성공 메시지 표시
- **연동 위치**:
  - `CTA.tsx` - 랜딩페이지 CTA 섹션의 "영업팀 문의" 버튼
  - `Footer.tsx` - 푸터의 "지원" 및 "영업팀 문의" 링크

### 2. FAQ 페이지
- **파일**: `src/pages/FAQPage.tsx`
- **경로**: `/faq`
- **기능**:
  - 카테고리별 필터링 (시작하기, 기능, 요금, 계정, 보안)
  - 검색 기능
  - 아코디언 UI로 Q&A 표시
  - 13개의 초기 FAQ 항목

### 3. 생성 예시 페이지
- **파일**: `src/pages/ExamplesPage.tsx`
- **경로**: `/examples`
- **기능**:
  - 카테고리별 필터 (IT/기술, 비즈니스, 건강/웰빙, 크리에이티브, 언어)
  - 6개의 예시 프로젝트 표시
  - 상세 다이얼로그에서 커리큘럼, 슬라이드, 퀴즈 미리보기

### 4. 가이드 페이지
- **파일**: `src/pages/GuidePage.tsx`
- **경로**: `/guide`
- **기능**:
  - 좌측 TOC (Table of Contents) 네비게이션
  - 스크롤 시 활성 섹션 자동 감지
  - 5개 섹션: 시작하기, 프로젝트 생성, AI 콘텐츠 생성, 결과 확인 및 편집, 다운로드 및 내보내기

### 5. 블로그 시스템
- **목록 페이지**: `src/pages/BlogPage.tsx` (`/blog`)
- **상세 페이지**: `src/pages/BlogDetailPage.tsx` (`/blog/:slug`)
- **기능**:
  - 카테고리 필터 (활용 팁, 업데이트, AI 트렌드)
  - 검색 기능
  - 추천 글 하이라이트
  - Markdown 콘텐츠 렌더링
  - 이전/다음 글 네비게이션
  - 관련 글 추천
  - 공유 기능
- **초기 콘텐츠**: 5개 블로그 글

### 6. 회사 관련 페이지
- **회사 소개**: `src/pages/AboutPage.tsx` (`/about`)
  - 미션 및 핵심 가치 소개
  - 숫자로 보는 성과
- **개인정보처리방침**: `src/pages/PrivacyPage.tsx` (`/privacy`)
  - 8개 조항의 개인정보처리방침
- **이용약관**: `src/pages/TermsPage.tsx` (`/terms`)
  - 10개 조항의 이용약관

### 7. Footer 업데이트
- **파일**: `src/components/Footer.tsx`
- **변경사항**:
  - "리소스" 섹션: 가이드, 블로그, FAQ, 지원 링크 활성화
  - "회사" 섹션: 소개, 영업팀 문의, 연락처, 개인정보처리방침, 이용약관 링크 활성화
  - 하단에 소셜 미디어 링크 추가 (GitHub, Twitter, LinkedIn)

## 라우팅 추가 (`App.tsx`)
```tsx
<Route path="/faq" element={<FAQPage />} />
<Route path="/examples" element={<ExamplesPage />} />
<Route path="/guide" element={<GuidePage />} />
<Route path="/blog" element={<BlogPage />} />
<Route path="/blog/:slug" element={<BlogDetailPage />} />
<Route path="/about" element={<AboutPage />} />
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/terms" element={<TermsPage />} />
```

## 파일 목록
- `src/components/ContactModal.tsx` (신규)
- `src/components/Footer.tsx` (수정)
- `src/components/CTA.tsx` (수정)
- `src/pages/FAQPage.tsx` (신규)
- `src/pages/ExamplesPage.tsx` (신규)
- `src/pages/GuidePage.tsx` (신규)
- `src/pages/BlogPage.tsx` (신규)
- `src/pages/BlogDetailPage.tsx` (신규)
- `src/pages/AboutPage.tsx` (신규)
- `src/pages/PrivacyPage.tsx` (신규)
- `src/pages/TermsPage.tsx` (신규)
- `src/App.tsx` (수정 - 라우트 추가)

## 향후 개선 사항
1. **영업팀 문의 DB 연동**: Azure Function API로 문의 내용 저장
2. **블로그 CMS 연동**: DB 기반 블로그 관리 시스템
3. **FAQ 관리자 페이지**: FAQ 항목 추가/수정/삭제 기능
4. **다국어 지원**: 영어 등 다국어 콘텐츠 지원

---

## 추가 개선 작업 (2026-01-11 오후)

### 요청 내용
1. 가격 페이지 클릭 시 "업데이트 중" 문구 표시
2. Footer에서 연락처 삭제 (영업팀 문의와 중복)
3. 가이드 페이지에 프로젝트 생성 후 코스빌더 연동 부분 설명 추가
4. 대시보드(로그인 시) 상단 네비게이션을 "생성예시, 가이드, FAQ"로 변경

### 구현 내용

#### 1. 가격 페이지 생성 (`/pricing`)
- **파일**: `src/pages/PricingPage.tsx` (신규)
- **기능**:
  - "업데이트 중" Coming Soon 스타일 페이지
  - 베타 서비스 무료 제공 안내
  - 현재 서비스 상태 카드 (베타 무료, 정식 출시 준비 중, 기업용 플랜)
  - 가격 문의 CTA 버튼 (영업팀 문의 모달 연결)
  - 무료로 시작하기 버튼
- **연동**:
  - Footer의 "가격" 링크를 `/#pricing` → `/pricing`으로 변경

#### 2. Footer 연락처 삭제
- **파일**: `src/components/Footer.tsx` (수정)
- **변경사항**:
  - "회사" 섹션에서 "연락처" 링크 제거
  - 영업팀 문의 모달만 유지 (중복 제거)

#### 3. 가이드 페이지 코스빌더 연동 설명 추가
- **파일**: `src/pages/GuidePage.tsx` (수정)
- **추가 내용**:
  - **Step 4: 코스빌더로 보내기**
    - Generation Studio의 "코스빌더로 보내기" 버튼 위치 안내
    - 변환 옵션 설명 (새 코스 생성 / 기존 코스에 추가)
    - 자동 변환 프로세스 설명 (회차 → 모듈, 콘텐츠 → 레슨)
  - **Step 5: 코스빌더에서 상세 편집**
    - 모듈/레슨 구조 재편집 (드래그 앤 드롭)
    - 특정 레슨만 AI로 부분 재생성
    - 콘텐츠 직접 수정 (텍스트, 이미지, 링크)
    - 버전 히스토리 관리
    - 콘텐츠 소스 추적 (AI 생성/직접 작성/업로드)

#### 4. Header 네비게이션 조건부 변경
- **파일**: `src/components/Header.tsx` (수정)
- **변경사항**:
  - **로그인 시**: "생성예시, 가이드, FAQ" 버튼 표시
    - `/examples` - 생성 예시 페이지
    - `/guide` - 사용 가이드 페이지
    - `/faq` - FAQ 페이지
  - **비로그인 시**: 기존 랜딩페이지 앵커 링크 유지
    - `#features` - 기능
    - `#pipeline` - 파이프라인
    - `#personas` - 사용자
    - `#metrics` - 성과
- **이유**: 로그인한 사용자는 대시보드에서 유용한 리소스 페이지로 바로 이동할 수 있도록 개선

### 추가된 파일
- `src/pages/PricingPage.tsx` (신규)

### 수정된 파일
- `src/components/Footer.tsx` - 연락처 삭제, 가격 링크 변경
- `src/pages/GuidePage.tsx` - 코스빌더 연동 설명 추가
- `src/components/Header.tsx` - 조건부 네비게이션 변경
- `src/App.tsx` - `/pricing` 라우트 추가

### 사용자 경험 개선 효과
1. **가격 페이지**: 명확한 "업데이트 중" 상태 표시로 혼란 방지
2. **Footer 정리**: 중복 링크 제거로 깔끔한 UI
3. **가이드 보완**: 프로젝트 생성 → 코스빌더 연동 전체 플로우 설명으로 사용자 이해도 향상
4. **네비게이션 개선**: 로그인 사용자가 자주 사용하는 리소스 페이지로 빠른 접근 가능
