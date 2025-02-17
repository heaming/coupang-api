export interface OrderSheetItem {
  shipmentBoxId: number; // 묶음배송번호
  succeed: boolean; // 성공 여부
  resultCode: string; // 결과 코드
  resultMessage: string; // 결과 메시지
  retryRequired: boolean; // 재시도 가능 여부
}

export class InstructResponseDto {
  responseKey: number; // 요청 구분값
  responseCode: number; // 전체 결과 코드 (-1, 0, 1, 99)
  responseMessage?: string; // 전체 결과 메시지
  responseList?: OrderSheetItem[]; // 개별 건 결과 리스트
}