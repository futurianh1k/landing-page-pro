# Generation Studio 개선 - 2026-01-10

## 사용자 요청

1. **파이프라인 단계별 output을 시각적으로 정리** - JSON 대신 깔끔한 UI로 표시
2. **최종 강의안에 모든 파이프라인 내용 종합** - 단순 최종검토가 아닌 완성된 강의안
3. **다운로드 기능 복원** - TXT, MD, PDF, PPT 다운로드 기능
4. **기존 기능과 새 기능의 조화** - UI 머지 이후 사라진 기능 복구

## 변경 내용

### 1. 프론트엔드 (`src/pages/GenerationStudioPage.tsx`)

#### 시각적 output 렌더링
- `renderStepOutput()` 함수 추가
- **웹 검색 결과**: 쿼리 배지 + 검색 결과 카드
- **슬라이드**: 슬라이드별 카드 형태로 시각화
- **Markdown 콘텐츠**: `react-markdown` + `remark-gfm`으로 깔끔하게 렌더링
- **기타 JSON**: 접을 수 있는 포맷팅된 JSON

#### 종합 강의안
- `combinedDocument` 로직 개선
- `final_review` 단계의 `combinedDocument` 우선 사용
- artifact의 document fallback
- 각 단계 콘텐츠 수동 종합 fallback

#### 다운로드 기능 복원
```typescript
handleDownloadMarkdown()  // .md 파일
handleDownloadText()      // .txt 파일 (Markdown 태그 제거)
handleDownloadPDF()       // 인쇄 다이얼로그 → PDF 저장
handleDownloadPPT()       // pptxgenjs로 PowerPoint 생성
handleCopyToClipboard()   // 클립보드 복사
```

#### UI 개선
- 단계별 아이콘 매핑 (`stepIcons`)
- 펼침/접힘 기능 (Collapsible)
- 진행 상태 바 개선
- 탭: "단계별 보기" + "종합 강의안" 분리

### 2. 백엔드 (`azure-functions/src/functions/generationJobWorker.ts`)

#### contextState 누적 로직 추가
기존: `interpret` 단계의 output만 참조
변경: 모든 완료된 단계의 output을 누적하여 다음 단계에 전달

```typescript
// 모든 완료된 step의 output을 조회하여 contextState에 누적
const allCompletedStepsRes = await client.query(
  `SELECT step_type, output FROM generation_steps 
   WHERE job_id = $1 AND status = 'completed' 
   ORDER BY order_index ASC`,
  [jobId]
);

// 이전 단계들의 output을 병합
const accumulatedOutputs: Record<string, any> = {};
for (const row of allCompletedStepsRes.rows) {
  // curriculum, lessonPlan, labTemplate, assessment, finalReview 등 누적
}
```

#### 최종 검토 단계 개선
기존: 단순 품질 체크리스트만 생성
변경: 모든 단계의 콘텐츠를 종합한 **완성된 강의안** 생성

```typescript
// 6단계: 최종 검토 및 종합 강의안 생성
if (stepType === 'final_review') {
  const curriculum = allOutputs.curriculum || '';
  const lessonPlan = allOutputs.lessonPlan || '';
  const labTemplate = allOutputs.labTemplate || '';
  const assessment = allOutputs.assessment || '';
  
  // AI에게 모든 콘텐츠를 통합한 완성된 강의안 생성 요청
  const prompt = `위 내용을 종합하여 완성된 강의안을 작성하세요:
    - 개요 (교육 시간, 과정, 회차)
    - 학습 목표
    - 커리큘럼
    - 세션별 수업 계획
    - 실습 활동
    - 평가 및 퀴즈
    - 강의 진행 가이드`;
}
```

## 배포 상태

- [x] 백엔드 (Azure Functions) - `func azure functionapp publish func-landing-page-pro`
- [x] 프론트엔드 빌드 완료 - `npm run build`
- [ ] 프론트엔드 배포 - 별도 SWA 배포 필요

## 테스트 방법

1. 로컬에서 테스트: `http://localhost:5173/dashboard`
2. 새 프로젝트 생성
3. Generation Studio에서 확인:
   - 파이프라인 각 단계 클릭 → 시각적 렌더링 확인
   - "종합 강의안" 탭에서 완성된 강의안 확인
   - 완료 후 다운로드 버튼 (TXT, MD, PDF, PPT) 확인

## 참고자료

- react-markdown: https://github.com/remarkjs/react-markdown
- remark-gfm (GitHub Flavored Markdown): https://github.com/remarkjs/remark-gfm
- pptxgenjs: https://github.com/gitbrent/PptxGenJS

## 기술적 결정

1. **react-markdown 사용**: AI가 생성하는 콘텐츠가 Markdown 형식이므로, 이를 깔끔하게 렌더링
2. **contextState 누적**: 각 단계가 이전 단계의 결과를 참조할 수 있도록 모든 output 누적
3. **다운로드 기능 복원**: 기존 `ProjectDetail.tsx`의 기능을 `GenerationStudioPage`로 이식

---

*작성일: 2026-01-10*
*담당: AI Assistant*
