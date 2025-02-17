import { Injectable, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import * as _ from 'lodash';
import dayjs from 'dayjs';

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
                    status: OrderStatusType): Promise<any> {
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
