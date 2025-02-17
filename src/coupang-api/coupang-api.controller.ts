import { Controller, Get, Query } from '@nestjs/common';
import { CoupangApiService, OrderStatusType } from './coupang-api.service';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { CoupangApiResponse } from './dto/coupang-api-response.dto';
import { CoupangOrderDto } from './dto/coupang-order.dto';

dayjs.locale('ko');

@Controller('coupang')
export class CoupangApiController {
  constructor(private readonly coupangApiService: CoupangApiService) {}

  @Get('orders')
  async getOrders(@Query('createdAtFrom') createdAtFrom: string = dayjs().format('YYYY-MM-DD'),
                  @Query('createdAtTo') createdAtTo:  string = dayjs().format('YYYY-MM-DD'),
                  @Query('maxPerPage') maxPerPage: number = 10,
                  @Query('status') status: OrderStatusType,
                  ) : Promise<CoupangApiResponse<CoupangOrderDto>> {
    const response =  await this.coupangApiService.fetchOrders(createdAtFrom, createdAtTo, maxPerPage, status);
    console.log(response);
    return response;
  }
}
