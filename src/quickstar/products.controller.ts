import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductsService } from './products.service';

@Controller('quickstar-products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('export')
  async exportProducts(@Res() res: Response) {
    try {
      const buffer = await this.productsService.createExcelSheet();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
      res.end(buffer);
    } catch (e) {
      res.status(500).json({ error: '처리 중 오류 발생', detail: (e as Error).message });
    }
  }
}