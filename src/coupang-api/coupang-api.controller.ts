import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Patch, Post,
  Query,
  UseInterceptors
} from '@nestjs/common';
import { CoupangApiService, OrderStatusType } from './coupang-api.service';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { CoupangApiResponse } from './dto/coupang-api-response.dto';
import { UpdateInvoicesRequestDto } from './dto/update-invoices-request.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { InstructResponseDto } from './dto/instruct-response.dto';
import { UpdateInvoicesResponseDto } from './dto/update-invoices-response.dto';

dayjs.locale('ko');

@UseInterceptors(ClassSerializerInterceptor)
@Controller('coupang')
export class CoupangApiController {
  constructor(private readonly coupangApiService: CoupangApiService) {}

  // 주문조회
  @Get('/orders')
  async getOrders(@Query('createdAtFrom') createdAtFrom: string = dayjs().format('YYYY-MM-DD'),
                  @Query('createdAtTo') createdAtTo:  string = dayjs().format('YYYY-MM-DD'),
                  @Query('maxPerPage') maxPerPage: number = 10,
                  @Query('status') status: OrderStatusType,
                  ) : Promise<CoupangApiResponse<OrderResponseDto[]>> {
    const response =  await this.coupangApiService.fetchOrders(createdAtFrom, createdAtTo, maxPerPage, status);
    console.log(response.data);
    return response;
  }

  // 상품 준비중 처리
  @Patch('/instruct')
  async updateOrderStatusToInstruct(@Body('shipmentBoxIds') shipmentBoxIds: number[]) : Promise<CoupangApiResponse<InstructResponseDto>> {
    return this.coupangApiService.updateOrderStatusToInstruct(shipmentBoxIds);
  }

  // 송장 업로드 처리
  @Post('/invoices')
  async updateInvoices(
    @Body() request: UpdateInvoicesRequestDto,
  ) : Promise<CoupangApiResponse<UpdateInvoicesResponseDto>> {
    const result = await this.coupangApiService.updateOrderInvoices(request);
    console.log(result.data);
    return result;
  }
}
