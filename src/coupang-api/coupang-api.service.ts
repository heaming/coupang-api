import { Injectable, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import { UpdateInvoicesRequestDto } from './dto/update-invoices-request.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { CoupangApiResponse } from './dto/coupang-api-response.dto';
import { InstructResponseDto, OrderSheetItem } from './dto/instruct-response.dto';
import { UpdateInvoicesResponseDto } from './dto/update-invoices-response.dto';
import e from 'express';

export type OrderStatusType =
  | 'ACCEPT'
  | 'INSTRUCT'
  | 'DEPARTURE'
  | 'DELIVERING'
  | 'FINAL_DELIVERY'
  | 'NONE_TRACKING';


export const OrderStatusLabels: Record<OrderStatusType, string> = {
  ACCEPT: '결제완료',
  INSTRUCT: '상품준비중',
  DEPARTURE: '배송지시',
  DELIVERING: '배송중',
  FINAL_DELIVERY: '배송완료',
  NONE_TRACKING: '업체 직접 배송(배송 연동 미적용), 추적불가',
};

@Injectable()
export class CoupangApiService {
  private readonly ACCESS_KEY: string;
  private readonly SECRET_KEY: string;
  private readonly VENDOR_ID: string;
  private readonly BASE_URL: string;
  private readonly ENDPOINT: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ACCESS_KEY = this.configService.get<string>('ACCESS_KEY');
    this.SECRET_KEY = this.configService.get<string>('SECRET_KEY');
    this.VENDOR_ID = this.configService.get<string>('VENDOR_ID');
    this.BASE_URL = this.configService.get<string>('BASE_URL');
    this.ENDPOINT = `/v2/providers/openapi/apis/api/v4/vendors/${this.VENDOR_ID}/ordersheets`;
  }

  async fetchOrders(createdAtFrom: string,
                    createdAtTo:  string,
                    maxPerPage: number,
                    status: OrderStatusType):Promise<CoupangApiResponse<OrderResponseDto>> {
    const queryParams = `createdAtFrom=${createdAtFrom}&createdAtTo=${createdAtTo}&maxPerPage=${maxPerPage}&status=${status}`;
    const requestUrl = `${this.BASE_URL}${this.ENDPOINT}?${queryParams}`;

    const timestamp = this.getTimestamp();
    const signature = this.getAuthHeader('GET', requestUrl, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `CEA algorithm=HmacSHA256, access-key=${this.ACCESS_KEY}, signed-date=${timestamp}, signature=${signature}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(requestUrl, { headers }),
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error.response?.data || error.message);
      throw new Error('Failed to fetch orders from Coupang API');
    }
  }

  async updateOrderStatusToInstruct(shipmentBoxIds: number[]): Promise<InstructResponseDto> {
    const requestUrl = `${this.BASE_URL}/v2/providers/openapi/apis/api/v4/vendors/${this.VENDOR_ID}/ordersheets/acknowledgement`;

    const timestamp = this.getTimestamp();
    const signature = this.getAuthHeader('PATCH', requestUrl, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `CEA algorithm=HmacSHA256, access-key=${this.ACCESS_KEY}, signed-date=${timestamp}, signature=${signature}`,
    };

    const requestBody = {
      vendorId: this.VENDOR_ID, shipmentBoxIds
    };

    try {
      const response = await firstValueFrom(
        this.httpService.patch(requestUrl, requestBody, { headers }),
      );

      response.data.responseList = response.data.responseList.filter((item : OrderSheetItem) => item.succeed === true)

      return response.data;
    } catch (error) {
      console.error(
        'Error updating order status:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to update order status to "상품준비중"');
    }
  }

  async updateOrderInvoices(request: UpdateInvoicesRequestDto): Promise<CoupangApiResponse<UpdateInvoicesResponseDto>> {
    const { orderSheetInvoiceApplyDtos } = request;
    const requestUrl = `${this.BASE_URL}/v2/providers/openapi/apis/api/v4/vendors/${this.VENDOR_ID}/orders/invoices`;

    const timestamp = this.getTimestamp();
    const signature = this.getAuthHeader('POST', requestUrl, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `CEA algorithm=HmacSHA256, access-key=${this.ACCESS_KEY}, signed-date=${timestamp}, signature=${signature}`,
    };

    const requestBody = {
      vendorId: this.VENDOR_ID,
      orderSheetInvoiceApplyDtos,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(requestUrl, requestBody, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error('Error updating order invoices:', error.response?.data || error.message);
      throw new Error('Failed to update order invoices in Coupang API');
    }
  }

  async getOrdersheetsByShipmentBoxIds(shipmentBoxIds: number[]): Promise<OrderSheetResponseDto[]> {
    let result: OrderSheetResponseDto[] = [];

    try {
      for (const shipmentBoxId of shipmentBoxIds) {
        const response = await this.getOrdersheetByShipmentBoxId(shipmentBoxId);

        if (response.code === 200) {
          const data = response.data[0];
          if(!data.splitShipping) {
            result = [...result, response.data[0]];
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error get ordersheetss by shipmentBoxId:', error.response?.data || error.message);
      throw new Error('Failed to get ordersheets by shipmentBoxIds in Coupang API');
    }
  }

  async getOrdersheetByShipmentBoxId(shipmentBoxId: number): Promise<CoupangApiResponse<OrderSheetResponseDto>> {
    const requestUrl = `${this.BASE_URL}/v2/providers/openapi/apis/api/v4/vendors/${this.VENDOR_ID}/ordersheets/${shipmentBoxId}`;

    const timestamp = this.getTimestamp();
    const signature = this.getAuthHeader('GET', requestUrl, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `CEA algorithm=HmacSHA256, access-key=${this.ACCESS_KEY}, signed-date=${timestamp}, signature=${signature}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(requestUrl, { headers }),
      );
      return response.data;
    } catch (error) {
      console.error('Error get ordersheet by shipmentBoxId:', error.response?.data || error.message);
      throw new Error('Failed to get ordersheet by shipmentBoxId in Coupang API');
    }
  }

  private getTimestamp(): string {
    let timestamp = new Date().toISOString().split('.')[0] + "Z";
    return timestamp.replace(/:/g, "").replace(/-/g, "").substring(2);
  }

  private getPath(url: string): string {
    const pathRegex = /.+?\:\/\/.+?(\/.+?)(?:#|\?|$)/;
    const result = url.match(pathRegex);
    return result && result.length > 1 ? result[1] : '';
  }

  private getQueryString(url: string): string {
    const arrSplit = url.split('?');
    return arrSplit.length > 1 ? url.substring(url.indexOf('?') + 1) : '';
  }

  private getAuthHeader(httpMethod: string, requestUrl: string, timestamp: string): string {
    const requestPath = this.getPath(requestUrl);
    const queryString = this.getQueryString(requestUrl);
    let requestData = [timestamp, httpMethod, requestPath, queryString].join('');

    // HMAC SHA256 서명 생성
    const hash = crypto.createHmac('sha256', this.SECRET_KEY).update(requestData).digest('hex');
    return hash;
  }
}
