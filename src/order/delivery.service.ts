import { Injectable, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from '../entity/invoice.entity';
import { CoupangApiController } from '../coupang-api/coupang-api.controller';
import { InvoiceService } from '../invoice/invoice.service';
import { async } from 'rxjs';
import { CoupangApiService, OrderStatusType } from '../coupang-api/coupang-api.service';
import dayjs from 'dayjs';
import { OrderSheetItem } from '../coupang-api/dto/instruct-response.dto';
import { OrderSheetInvoiceApplyDto } from '../coupang-api/dto/update-invoices-request.dto';

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
      const availableInvoiceNumberList: Invoice[] = await this.invoiceService.getNotUsedInvoices();

      // 5. 순서 대로 updateInvoices()
      await this.coupangApiController.updateInvoices(this.toOrderSheetInvoiceApplyDto(availableInvoiceNumberList));
    }

    private toOrderSheetInvoiceApplyDto(o: number[], invoiceNumberList : string[]) {
      invoiceNumberList.map(invoiceNumber => {
        return {
          shipmentBoxId: ,
          orderId: number,
          vendorItemId: number,
          deliveryCompanyCode: string,
          invoiceNumber: string,
          splitShipping: boolean,
          preSplitShipped: boolean,
          estimatedShippingDate?: string,
        }
      })

    }




}