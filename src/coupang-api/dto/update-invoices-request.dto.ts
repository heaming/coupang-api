export interface OrderSheetInvoiceApplyDto {
  shipmentBoxId: number;
  orderId: number;
  vendorItemId: number;
  deliveryCompanyCode: string;
  invoiceNumber: string;
  splitShipping: boolean;
  preSplitShipped: boolean;
  estimatedShippingDate?: string;
}

export class UpdateInvoicesRequestDto {
  orderSheetInvoiceApplyDtos: OrderSheetInvoiceApplyDto[];
}