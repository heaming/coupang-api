import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entity/invoice.entity';
import dayjs from 'dayjs';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  async insertInvoice(
    invoiceNumber: string,
    deliveryCompanyCode: string = 'CJGLS',
  ): Promise<Invoice> {
    const invoice = new Invoice();
    invoice.invoiceNumber = invoiceNumber;
    invoice.deliveryCompanyCode = deliveryCompanyCode;

    return this.invoiceRepository.save(invoice);
  }

  async updateInvoiceUsedAt(
    invoiceNumber: string
  ): Promise<Invoice> {
    // 송장 찾기
    const invoice = await this.getInvoiceByInvoiceNumber(invoiceNumber);

    if (!invoice) {
      return;
    }

    invoice.usedAt = new Date();
    return this.invoiceRepository.save(invoice);
  }

  async getInvoiceByInvoiceNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceNumber },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice;
  }

  async getNotUsedInvoices(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { usedAt: null },
      order: { id: 'asc' },
    });
  }
}
