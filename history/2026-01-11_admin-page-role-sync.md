# 2026-01-11 - 관리자 페이지 권한 조회 업데이트

## 요청 내용
- 관리자 페이지 작업 내역을 히스토리에 추가

## 구현 내용
- `useUserRole`이 Azure Functions `/api/user/roles`를 호출하도록 변경하고 역할 문자열을 정규화.
- Azure Functions에 `getUserRoles` 엔드포인트를 추가하고 인덱스에 등록.
- Admin 페이지 테스트에서 `useUserRole`을 mock하여 관리자/비관리자 접근 시나리오를 검증.

## 변경 파일
- `src/hooks/useUserRole.ts`
- `src/lib/azureFunctions.ts`
- `azure-functions/src/functions/getUserRoles.ts`
- `azure-functions/src/index.ts`
- `src/pages/__tests__/AdminPage.test.tsx`

## 테스트
- 미실행
