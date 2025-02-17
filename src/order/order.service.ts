import { Injectable, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from '../entity/invoice.entity';
import { CoupangApiController } from '../coupang-api/coupang-api.controller';
import { InvoiceService } from '../invoice/invoice.service';
import { async } from 'rxjs';
import { CoupangApiService, OrderStatusType } from '../coupang-api/coupang-api.service';
import dayjs from 'dayjs';

@Injectable()
export class OrderService {
  constructor(
    private readonly invoiceService : InvoiceService,
    private readonly coupangApiController : CoupangApiController
  ) {}

    async updateProcess() {
      const now = dayjs().format('YYYY-MM-DD');

      // 1. 주문 조회 Cron
      const response = await this.coupangApiController.getOrders(now, now, 10, 'ACCEPT')

      if (!response || response.code != 200 || response.data.length <= 0) return;

      const shipmentBoxIds = response.data.map(order => order.)


      await this.coupangApiController.updateOrderStatusToInstruct();


    }

    // 2. 상품 준비중 처리

    // 3. 안 쓴 송장 번호 가져오기

    // 4. 순서 대로 updateInvoices()

}