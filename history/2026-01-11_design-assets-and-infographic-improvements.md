# 디자인 에셋 갤러리 및 인포그래픽 개선

**날짜**: 2026-01-11
**작업자**: Claude Code
**상태**: ✅ 완료 및 배포됨

## 작업 요약

사용자의 5가지 질문 중 2번과 3번을 처리:

2. **디자인/삽화 이미지 기능 개선** (옵션 A, B, C)
3. **인포그래픽 스크롤 기능 확인 및 개선**

## 주요 변경 사항

### 옵션 A: 배경 이미지 다운로드 기능 추가

**변경된 파일**: [src/pages/GenerationStudioPage.tsx](src/pages/GenerationStudioPage.tsx)

**구현 내용**:
- `handleDownloadBackgroundImage` 함수 추가 (494-530줄)
- Base64 Data URL을 Blob으로 변환하여 PNG 파일로 다운로드
- 다운로드 드롭다운 메뉴에 "배경 이미지 (PNG)" 옵션 추가

```typescript
const handleDownloadBackgroundImage = () => {
  const infographicArtifact = jobState.artifacts.find(a => a.artifact_type === 'infographic');
  const slidesArtifact = jobState.artifacts.find(a => a.artifact_type === 'slides');

  const backgroundDataUrl = infographicArtifact?.assets?.background?.dataUrl ||
                            slidesArtifact?.assets?.background?.dataUrl;

  if (!backgroundDataUrl) {
    toast.error("배경 이미지가 생성되지 않았습니다.");
    return;
  }

  // Data URL을 Blob으로 변환 후 다운로드
  // ... (구현 세부사항 생략)

  toast.success("배경 이미지가 다운로드되었습니다.");
};
```

### 옵션 B: 디자인 에셋 갤러리 UI 추가

**변경된 파일**: [src/pages/GenerationStudioPage.tsx](src/pages/GenerationStudioPage.tsx)

**구현 내용**:
- 새로운 "디자인 에셋" 탭 추가 (1645줄)
- 모든 생성된 이미지를 갤러리 형식으로 표시 (1778-1925줄)
- 각 이미지별 메타데이터 표시:
  - 이미지 타입 (인포그래픽 배경, 슬라이드 배경, 삽화 등)
  - 생성 모델 (Vertex AI Imagen, OpenAI DALL-E 등)
  - 생성 시각
  - 프롬프트
- 개별 이미지 다운로드 버튼
- 향후 확장 가능한 구조 (illustrations, diagrams 등)

**UI 구조**:
```typescript
// 탭 트리거
<TabsTrigger value="assets" className="gap-1">
  <Download className="h-4 w-4" />디자인 에셋
</TabsTrigger>

// 탭 콘텐츠
<TabsContent value="assets">
  <ScrollArea className="h-[calc(100vh-380px)]">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {allImages.map((img, idx) => (
        // 이미지 카드 (미리보기 + 메타데이터 + 다운로드 버튼)
      ))}
    </div>
  </ScrollArea>
</TabsContent>
```

### 옵션 C: 콘텐츠별 삽화 생성 확장

**변경된 파일**: [azure-functions/src/functions/generationJobWorker.ts](azure-functions/src/functions/generationJobWorker.ts:651-747)

**구현 내용**:
- `design_assets` 단계 확장
- 배경 이미지 외에 슬라이드별 삽화 생성 추가
- 중요한 슬라이드 선택 (처음, 중간, 마지막) - 최대 3개
- 각 슬라이드의 제목과 핵심 포인트를 기반으로 삽화 프롬프트 생성
- 생성된 삽화를 `assets.illustrations` 배열에 저장

**핵심 로직**:
```typescript
// 슬라이드 존재 여부 확인
const slidesArtifact = existingArtifacts.slides;
if (slidesArtifact?.content_json?.slides) {
  const slides = slidesArtifact.content_json.slides;
  const maxIllustrations = Math.min(3, slides.length);

  // 중요한 슬라이드 선택 (처음, 중간, 마지막)
  const selectedIndices = [0, Math.floor(slides.length / 2), slides.length - 1];

  for (const slideIdx of selectedIndices) {
    const slide = slides[slideIdx];
    const illustrationPrompt = `Create a simple, clean illustration representing: "${slide.title}"...`;
    const illustration = await generateImageDataUrl(illustrationPrompt);

    if (illustration) {
      illustrations.push({
        ...illustration,
        slideNumber: slide.slideNumber,
        title: slide.title,
      });
    }
  }
}

// 결과 저장
return {
  log: `디자인 에셋 생성 완료: 배경 이미지 1개 + 삽화 ${illustrations.length}개`,
  artifacts: [
    { type: 'slides', assets: { background: bg, illustrations }, markCompleted: false },
  ],
};
```

### 3번 질문: 인포그래픽 스크롤 기능 개선

**변경된 파일**: [src/components/studio/InfographicCanvas.tsx](src/components/studio/InfographicCanvas.tsx)

**발견된 문제**:
1. 고정 높이 (520px) 사용
2. 최대 6개 섹션만 표시 (`sections.slice(0, 6)`)
3. 긴 콘텐츠가 잘림

**해결 방안**:
1. **동적 높이 계산** (37-47줄):
   ```typescript
   const height = useMemo(() => {
     const baseHeight = 200; // 제목 + 부제목 + 여백
     const cols = width >= 760 ? 2 : 1;
     const boxHeight = 120;
     const gap = 14;
     const rows = Math.ceil(sections.length / cols);
     const contentHeight = rows * (boxHeight + gap);
     const minHeight = 520;
     const calculatedHeight = baseHeight + contentHeight + 60;
     return Math.max(minHeight, calculatedHeight);
   }, [sections.length, width]);
   ```

2. **모든 섹션 표시** (147줄):
   ```typescript
   // Before: sections.slice(0, 6)
   // After: allSections (모든 섹션)
   for (const s of allSections) {
     // 섹션 렌더링...
   }
   ```

3. **ScrollArea 활용**:
   - [GenerationStudioPage.tsx:1726](src/pages/GenerationStudioPage.tsx#L1726)에서 이미 `ScrollArea` 컴포넌트 사용 중
   - 캔버스 높이가 증가하면 자동으로 스크롤 가능

## 배포 내역

### Azure Functions 배포

```bash
# 빌드
cd azure-functions && npm run build

# 배포
func azure functionapp publish func-landing-page-pro
```

**배포 완료**: 2026-01-11 20:18 (KST)

**영향받는 Functions**:
- `generationJobWorker` - 디자인 에셋 생성 로직 확장

### 프론트엔드 변경사항

**수정된 파일**:
- [src/pages/GenerationStudioPage.tsx](src/pages/GenerationStudioPage.tsx)
  - 배경 이미지 다운로드 함수 추가
  - 디자인 에셋 갤러리 탭 추가
- [src/components/studio/InfographicCanvas.tsx](src/components/studio/InfographicCanvas.tsx)
  - 동적 높이 계산
  - 모든 섹션 표시

## 테스트 체크리스트

- [ ] 디자인 에셋 기능 테스트
  - [ ] 배경 이미지 다운로드 (드롭다운 메뉴)
  - [ ] 디자인 에셋 탭 표시
  - [ ] 갤러리에서 모든 이미지 확인
  - [ ] 개별 이미지 다운로드
  - [ ] 메타데이터 표시 확인
- [ ] 콘텐츠별 삽화 생성
  - [ ] 새 프로젝트 생성 (이미지 생성 옵션 활성화)
  - [ ] 슬라이드 생성 완료 후 design_assets 단계 실행
  - [ ] 삽화 3개 생성 확인 (처음, 중간, 마지막)
  - [ ] 갤러리에서 삽화 표시 확인
- [ ] 인포그래픽 스크롤 기능
  - [ ] 많은 섹션이 있는 프로젝트 생성 (10+ 섹션)
  - [ ] 모든 섹션이 표시되는지 확인
  - [ ] 스크롤이 정상 작동하는지 확인
  - [ ] 반응형 레이아웃 확인 (1열/2열)

## 영향 범위

### 백엔드 (Azure Functions)
- ✅ `design_assets` 단계 확장 - 슬라이드별 삽화 생성 지원
- ✅ 생성 로그 개선 - "배경 이미지 1개 + 삽화 3개" 형태로 표시
- ✅ 에러 핸들링 강화 - 삽화 생성 실패 시에도 계속 진행

### 프론트엔드 (React)
- ✅ 새로운 탭 추가 - 디자인 에셋 갤러리
- ✅ 이미지 다운로드 기능 강화 - 배경 이미지 + 개별 이미지
- ✅ 인포그래픽 캔버스 개선 - 동적 높이, 모든 섹션 표시

### 데이터베이스
- 변경 없음 (기존 `generation_artifacts.assets` JSON 필드 활용)

## 사용자 경험 개선

1. **가시성 향상**:
   - 생성된 모든 이미지를 한눈에 확인 가능
   - 각 이미지의 출처와 생성 정보 투명하게 제공

2. **편의성 향상**:
   - 개별 이미지 다운로드 가능
   - 이미지 프롬프트 확인으로 재생성 시 참고 가능

3. **콘텐츠 완성도 향상**:
   - 슬라이드별 맞춤 삽화 제공
   - 인포그래픽에서 모든 콘텐츠 표시

4. **확장성**:
   - 향후 다이어그램, 차트 등 추가 에셋 타입 지원 가능
   - 갤러리 UI가 자동으로 새로운 타입 포함

## 추가 개선 제안

### 즉시 가능한 개선
- [ ] 이미지 확대 보기 (라이트박스)
- [ ] 일괄 다운로드 (ZIP)
- [ ] 이미지 편집 기능 (크롭, 리사이즈)

### 향후 고려사항
- [ ] 슬라이드에 삽화 자동 삽입 기능
  - 현재: 삽화는 생성되지만 별도 저장
  - 개선: 슬라이드 JSON에 이미지 URL 포함
- [ ] 삽화 생성 개수 사용자 설정
  - 현재: 최대 3개 고정
  - 개선: 프로젝트 생성 시 옵션으로 제공 (1-10개)
- [ ] AI 기반 삽화 스타일 선택
  - 플랫 디자인, 일러스트레이션, 사진, 3D 등

## 관련 이슈/참고사항

### 이전 작업 이력
- [2026-01-11_api-key-fix-and-dashboard-improvements.md](history/2026-01-11_api-key-fix-and-dashboard-improvements.md) - API 키 수정 및 대시보드 개선
- [2026-01-10_generation-studio-improvements.md](history/2026-01-10_generation-studio-improvements.md) - 스튜디오 UI 개선

### 진행 중인 작업
- 4번 질문: 코스빌더 역할 재고 및 콘텐츠 생성 타입 개선
- 5번 질문: (사용자 의견 대기)

## 작성자 노트

이번 작업으로 다음 기능들이 추가/개선되었습니다:

1. **옵션 A**: 배경 이미지를 쉽게 다운로드할 수 있게 됨
2. **옵션 B**: 모든 디자인 에셋을 한 곳에서 관리하고 다운로드 가능
3. **옵션 C**: 슬라이드별 맞춤 삽화 자동 생성 (최대 3개)
4. **인포그래픽**: 긴 콘텐츠도 스크롤로 모두 확인 가능

특히 디자인 에셋 갤러리는 향후 확장성을 고려하여 설계되었으므로, 다이어그램, 차트, 아이콘 등 새로운 타입의 에셋을 추가하기 쉽습니다.

다음 단계로 4번 질문(코스빌더 역할 재고)을 진행할 예정입니다.
