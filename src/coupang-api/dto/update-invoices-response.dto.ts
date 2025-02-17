export interface ResponseItemDto {
  shipmentBoxId: number;
  succeed: boolean;
  resultCode: string;
  retryRequired: boolean;
  resultMessage?: string;
}

export class UpdateInvoicesResponseDto {
  responseCode: number;
  responseMessage: string;
  responseList: ResponseItemDto[];
}