import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs'
import "dayjs/locale/ko";
import { of } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as process from 'node:process'; //한국어

dayjs.locale("ko");

interface Product {
  image: string;
  code: string;
  name: string;
  category: string;
  quantity: string;
  price: string;
  option1: string;
  option2: string;
  orderNo: string;
  trackingNo: string;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly QUICKSTAR_URL = 'http://quickstar.co.kr/elpisbbs/ajax.nt_big_invoice_list_member.php?';

  // 매주 월요일 오전 10시
  @Cron('0 30 23 * * *')
  async handleCron() {
    this.logger.log('엑셀 자동 저장 작업 시작');
    try {
      const buffer = await this.createExcelSheet();
      const dir = path.join(process.cwd(), 'excel'); // 폴더명은 자기가 만들기
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(
        dir,
        `products_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`
      );
      fs.writeFileSync(filePath, buffer);
      this.logger.log(`엑셀 저장 완료: ${filePath}`);
    } catch (e) {
      this.logger.error('엑셀 저장 실패', e);
    }
  }

  async createExcelSheet(): Promise<Buffer> {
    let last = 0;
    let limit = 200;
    let edate = dayjs().format('YYYY-MM-DD');
    let sdate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

    let hasData = true;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Products_${dayjs().format('YYYY-MM-DD')}`);
    worksheet.columns = [
      { header: '이미지', key: 'image', width: 20 },
      { header: '상품코드', key: 'code', width: 20 },
      { header: '상품명', key: 'name', width: 30 },
      { header: '카테고리', key: 'category', width: 20 },
      { header: '수량', key: 'quantity', width: 10 },
      { header: '단가', key: 'price', width: 10 },
      { header: '옵션1', key: 'option1', width: 30 },
      { header: '옵션2', key: 'option2', width: 30 },
      { header: '주문번호', key: 'orderNo', width: 25 },
      { header: '트레킹번호', key: 'trackingNo', width: 30 },
    ];

    while(hasData) {
      let url = this.generateUrlParam(last, limit, '2025-04-15', '2025-04-22');
      // let url = this.generateUrlParam(last, limit, sdate, edate);
      const res = await axios.get(url);
      const { data: html } = res;

      if (html === 'no_mid') {
        console.log('no data - finished');
        console.log(`data count :: ${worksheet.rowCount}`);
        hasData = false;
        break;
      }

      await this.addDataRow(html, workbook, worksheet);
      console.log(`data count :: ${worksheet.rowCount}`);

      last += 200;
      limit += 200;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }

  async addDataRow(html: any, workbook: any, worksheet: any): Promise<any> {
    const $ = cheerio.load(html);
    const $table_item_info = $('table.item_info');
    const products: Product[] = [];

    // 각 상품 테이블(item_info) 순회
    $table_item_info.each((_, table) => {
      $(table)
        .find('tr')
        .each((_, tr) => {
          const $tr = $(tr);

          // 이미지
          const image = $tr.find('td.CT.nodata_img img.thumbnail').attr('src') || '';

          // 상품코드
          const code = $tr.find('div[id^=IT]').attr('id') || '';

          // 상품명
          const name = $tr.find('div:contains("상품명") b').text().trim();

          // 품목
          const category = $tr
            .find('div:contains("품목") span')
            .text()
            .replace(/^\[.*?\]\s*/, '') // [코드] 제거
            .split('·')[0]
            .trim();

          // 수량, 단가
          const quantity = $tr.find('div:contains("수량") span').first().text().trim();
          const price = $tr.find('div:contains("단가") span').last().text().trim();

          // 옵션1, 옵션2
          const option1 = $tr.find('div:contains("옵션1") span').text().trim();
          const option2 = $tr.find('div:contains("옵션2") span').text().trim();

          // 주문번호
          const orderNo = $tr
            .find('div:contains("주문번호") span')
            .last()
            .text()
            .trim();

          // 트레킹번호
          const trackingNo = $tr
            .find('div:contains("트레킹번호") a')
            .first()
            .text()
            .replace('▶', '')
            .trim();

          // 상품명 등 필수값이 있을 때만 추가
          if (name) {
            products.push({
              image,
              code,
              name,
              category,
              quantity,
              price,
              option1,
              option2,
              orderNo,
              trackingNo,
            });
          }
        });
    });


    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      await worksheet.addRow({
        image: '', // 이미지는 아래에서 삽입
        code: p.code,
        name: p.name,
        category: p.category,
        quantity: p.quantity,
        price: p.price,
        option1: p.option1,
        option2: p.option2,
        orderNo: p.orderNo,
        trackingNo: p.trackingNo,
      });

      // 이미지 삽입
      if (p.image) {
        try {
          const imageUrl = p.image.startsWith('http') ? p.image : `http://quickstar.co.kr/${p.image.replace(/^\//, '')}`;
          const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          const imageId = workbook.addImage({
            buffer: Buffer.from(imgRes.data, 'binary'),
            extension: 'jpeg',
          });
          worksheet.addImage(imageId, {
            tl: { col: 0, row: i + 1 },
            ext: { width: 80, height: 80 },
            editAs: 'oneCell',
          });
          worksheet.getRow(i + 2).height = 60;
        } catch (e) {
          // 이미지 다운로드 실패시 무시
        }
      }
    }
  }

  public generateUrlParam(last: number, limit: number, sdate: string, edate: string) :string {
    return `${this.QUICKSTAR_URL}last=${last}&limit=${limit}&value=&or_de_no=&sdate=${sdate}&edate=${edate}&mb_id=&last_code=&it_code=&dytpe=&gr_var5=`;
  }
}