import { Injectable, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from '../entity/invoice.entity';
import { CoupangApiController } from '../coupang-api/coupang-api.controller';
import { InvoiceService } from '../invoice/invoice.service';
import { async } from 'rxjs';
import { CoupangApiService, OrderStatusType } from '../coupang-api/coupang-api.service';
import dayjs from 'dayjs';
import { OrderSheetItem } from '../coupang-api/dto/instruct-response.dto';
import { OrderSheetInvoiceApplyDto, UpdateInvoicesRequestDto } from '../coupang-api/dto/update-invoices-request.dto';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly invoiceService : InvoiceService,
    private readonly coupangApiController : CoupangApiController
  ) {}

    async changeDeliveryStatusProcess() {
      const now = dayjs().format('YYYY-MM-DD');

      // 1. 주문 조회 Cron
      const orders = await this.coupangApiController.getOrders(now, now, 10, 'ACCEPT')

      if (!orders || orders.code != 200 || orders.data.length <= 0) return;

      const shipmentBoxIds = orders.data.map(order => order.shipmentBoxId);

      // 2. 상품 준비중 처리 (처리된 것만 받아옴)
      const instructResponse = await this.coupangApiController.updateOrderStatusToInstruct(shipmentBoxIds);

      // 3. 배송지 정보 확인
      const newlyOrdersheets = await this.coupangApiController.getOrderSheetsByShipmentBoxIds(shipmentBoxIds);

      // 4. 안 쓴 송장 번호 가져오기
      const availableInvoices: Invoice[] = await this.invoiceService.getNotUsedInvoices();

      let invoiceIdx = 0;
      const ordersheetInvoiceApplyDtos: OrderSheetInvoiceApplyDto[] = [];
      for(let ordersheet of newlyOrdersheets) {
        if (!availableInvoices || availableInvoices.length <= invoiceIdx) {
          console.error("사용 가능한 송장 없음");
          break;
        }
        let invoice = availableInvoices[invoiceIdx];
        ordersheetInvoiceApplyDtos.push(this.toOrderSheetInvoiceApplyDto(ordersheet, invoice));
        await this.invoiceService.updateInvoiceUsedAt(invoice.invoiceNumber);
        invoiceIdx++;
      }

      // 5. 송장 업데이트
      await this.coupangApiController.updateInvoices(new UpdateInvoicesRequestDto(ordersheetInvoiceApplyDtos));
    }

    private toOrderSheetInvoiceApplyDto(ordersheet: OrderSheetResponseDto, invoice : Invoice) {
      return {
        shipmentBoxId: ordersheet.shipmentBoxId,
        orderId: ordersheet.orderId,
        vendorItemId: ordersheet.orderItems[0].vendorItemId,
        deliveryCompanyCode: invoice.deliveryCompanyCode,
        invoiceNumber: invoice.invoiceNumber,
        splitShipping: false,
        preSplitShipped: false,
        estimatedShippingDate: ordersheet.orderItems[0].estimatedShippingDate,
      }
    }
}