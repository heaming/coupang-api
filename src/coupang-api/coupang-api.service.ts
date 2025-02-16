import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';
import * as _ from 'lodash';

@Injectable()
export class CoupangApiService {
  private readonly ACCESS_KEY = 'e2e68e9c-2b0a-489b-9072-fff24feb2a2f';
  private readonly SECRET_KEY = 'b9a01557c79e04a0b09e252949527b42563047cf';
  private readonly VENDOR_ID = 'A01128242';
  private readonly BASE_URL = 'https://api-gateway.coupang.com';
  private readonly ENDPOINT = `/v2/providers/openapi/apis/api/v4/vendors/${this.VENDOR_ID}/ordersheets`;

  constructor(private readonly httpService: HttpService) {}

  async fetchOrders(): Promise<any> {
    const queryParams = 'createdAtFrom=2025-02-15&createdAtTo=2025-02-15&maxPerPage=2&status=DEPARTURE';
    const requestUrl = `${this.BASE_URL}${this.ENDPOINT}?${queryParams}`;

    const timestamp = this.getTimestamp();
    const signature = this.getAuthHeader('GET', requestUrl);

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
    // 현재 시간을 ISO 8601 형식으로 변환하고 :와 -을 제거하여 원하는 포맷으로 변환
    let timestamp = new Date().toISOString().split('.')[0] + "Z";
    timestamp = timestamp.replace(/:/g, "").replace(/-/g, "").substring(2);
    return timestamp;
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

  private getAuthHeader(httpMethod: string, requestUrl: string): string {
    const requestPath = this.getPath(requestUrl);
    const queryString = this.getQueryString(requestUrl);

    const timestamp = this.getTimestamp();
    let requestData = [timestamp, httpMethod, requestPath, queryString].join('');
    requestData = this.replaceVariables(requestData);

    // HMAC 생성
    const hash = crypto.createHmac('sha256', this.SECRET_KEY).update(requestData).digest('hex');
    return hash;
  }

  private replaceVariables(templateString: string): string {
    const tokens = _.uniq(templateString.match(/{{\w*}}/g));

    _.forEach(tokens, t => {
      const variable = t.replace(/[{}]/g, '');
      const value = process.env[variable] || global[variable];
      templateString = templateString.replace(new RegExp(t, 'g'), value);
    });

    return templateString;
  }
}
