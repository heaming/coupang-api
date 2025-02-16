// coupang-api.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CoupangApiService } from './coupang-api.service';

@Controller('coupang')
export class CoupangApiController {
  constructor(private readonly coupangApiService: CoupangApiService) {}

  @Get('orders')
  async getOrders() {
    return await this.coupangApiService.fetchOrders();
  }
}
