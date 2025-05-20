import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import ExcelJS from 'exceljs';
import dayjs from 'dayjs'
import "dayjs/locale/ko";
import { of } from 'rxjs';
import { Cron } from '@nestjs/schedule';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as process from 'node:process';
import { imageSize } from 'image-size';
import imageType from 'image-type';


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
  request: string;
  orderNo: string;
  trackingNo: string;
  quickstarPrice: string,
  weight: string,
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly QUICKSTAR_URL = 'http://quickstar.co.kr/elpisbbs/ajax.nt_big_invoice_list_member.php?';

  // 매주 월요일 오전 10시
  @Cron('0 0 10 * * 1')
  async handleCron() {
    this.logger.log('엑셀 자동 저장 작업 시작');
    try {
      await this.createExcelSheet();
      this.logger.log(`엑셀 저장 완료`);
    } catch (e) {
      this.logger.error('엑셀 저장 실패', e);
    }
  }

  async createExcelSheet(): Promise<void> {
    let last = 0;
    let limit = 200;
    let edate = dayjs().format('YYYY-MM-DD');
    let sdate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

    let hasData = true;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Products_${dayjs().format('YYYY-MM-DD')}`);
    worksheet.columns = [
      { header: '이미지', key: 'image', width: 200 },
      { header: '상품코드', key: 'code', width: 20 },
      { header: '상품명', key: 'name', width: 30 },
      { header: '카테고리', key: 'category', width: 20 },
      { header: '수량', key: 'quantity', width: 10 },
      { header: '단가', key: 'price', width: 10 },
      { header: '옵션1', key: 'option1', width: 30 },
      { header: '옵션2', key: 'option2', width: 30 },
      { header: '요청사항', key: 'request', width: 30 },
      { header: '주문번호', key: 'orderNo', width: 25 },
      { header: '트레킹번호', key: 'trackingNo', width: 30 },
      { header: '퀵스타 택배비', key: 'quickstarPrice', width: 30 },
      { header: '무게', key: 'weight', width: 30 },
    ];

    while(hasData) {
      let url = this.generateUrlParam(last, 200, '2024-07-01', '2024-07-31');
      // let url = this.generateUrlParam(last, limit, sdate, edate);
      const res = await axios.get(url);
      const { data: html } = res;

      if (html === 'no_mid') {
        console.log('no data - finished');
        console.log(`total :: ${worksheet.rowCount}`);
        hasData = false;
        break;
      }

      await this.addDataRow(html, workbook, worksheet);
      console.log(`data count :: ${worksheet.rowCount}`);

      last += 200;
    }

    try {
      const dir = path.join(process.cwd(), 'excel');
      const filePath = path.join(dir, `products_${dayjs().format('YYYY-MM-DD_HH-mm')}.xlsx`);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await workbook.xlsx.writeFile(filePath);
    } catch (error) {
      console.error('엑셀 버퍼 생성 중 오류 발생:', error);
      throw new InternalServerErrorException('엑셀 파일 생성에 실패했습니다.');
    }
  }

  async addDataRow(html: any, workbook: any, worksheet: any): Promise<any> {
    const $ = cheerio.load(html);
    const $table_item_info = $('table.item_info');
    const products: Product[] = [];

    // 각 상품 테이블(item_info) 순회
    $table_item_info.each((_, table) => {
      let image,
          code,
          name,
          category,
          quantity,
          price,
          option1,
          option2,
          request,
          orderNo,
          trackingNo,
          quickstarPrice,
          weight;

      $(table)
        .find('tr')
        .each((_, tr) => {
          const $tr = $(tr);

          // 이미지
          image = $tr.find('td.CT.nodata_img img.thumbnail').attr('src') || '';

          // 상품코드
          code = $tr.find('div[id^=IT]').attr('id') || '';

          // 상품명
          name = $tr.find('div:contains("상품명") b').text().trim();

          // 품목
          category = $tr
            .find('div:contains("품목") span')
            .text()
            .split('·')[0]
            .trim();

          // 수량, 단가
          quantity = $tr.find('div:contains("수량") span').first().text().trim();
          price = $tr.find('div:contains("단가") span').last().text().trim();

          // 옵션1, 옵션2
          option1 = $tr.find('div:contains("옵션1") span').text().trim();
          option2 = $tr.find('div:contains("옵션2") span').text().trim();

          // 요청사항
          request = $tr.find('div:contains("요청사항") span').text().trim();

          // 주문번호
          orderNo = $tr
            .find('div:contains("주문번호") span')
            .last()
            .text()
            .trim();

          // 트레킹번호
          trackingNo = $tr
            .find('div:contains("트레킹번호") a')
            .first()
            .text()
            .replace('▶', '')
            .trim();
        });

      const extraDataNodes = [];
      let $next = $(table).next();

      while ($next.length && !$next.is('table')) {
        extraDataNodes.push($next);
        $next = $next.next();
      }

      extraDataNodes.forEach(($node, idx) => {
        const tagName = $node[0].tagName;
        const text = $node.text().trim();

        if (tagName === 'b') {
          if (text.indexOf('.') > -1) { // 무게
            weight = text;
          } else if (text.indexOf(',') > -1) {
            quickstarPrice = text;
          }
        }
      });
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
          request,
          orderNo,
          trackingNo,
          quickstarPrice,
          weight
        });
      }

    });

    const rowPromises = products.map(async (p) => {
      return new Promise<void>(async (resolve, reject) => {
        try {
          const row = worksheet.addRow({
            image: '',
            code: p.code,
            name: p.name,
            category: p.category,
            quantity: p.quantity,
            price: p.price,
            option1: p.option1,
            option2: p.option2,
            request: p.request,
            orderNo: p.orderNo,
            trackingNo: p.trackingNo,
            quickstarPrice: p.quickstarPrice,
            weight: p.weight,
          });

          const rowIndex = row.number;

          if (p.image) {
            const imageUrl = p.image.startsWith('http') ? p.image : `http://quickstar.co.kr/${p.image.replace(/^\//, '')}`;
            try {
              const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
              const imageBuffer = Buffer.from(imgRes.data, 'binary');

              // 이미지 크기 추출
              const dimensions = imageSize(imageBuffer);
              if (!dimensions || !dimensions.width || !dimensions.height) {
                console.log(`이미지 크기 정보가 없거나 잘못된 형식입니다 - URL: ${imageUrl}`);
                throw new Error(`이미지 크기 정보가 없습니다. URL: ${imageUrl}`);
              }
              const imgWidth = dimensions.width || 200;
              const imgHeight = dimensions.height || 200;
              // 엑셀의 단위 환산
              const pixelToRowHeight = 0.75;       // 1 row height ≈ 0.75px
              const pixelToColumnWidth = 0.13;     // 1 column width ≈ 7.5px → 1px ≈ 0.13

              const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
              const extension = ext === 'png' ? 'png' : 'jpeg';

              // 셀 크기 조절
              worksheet.getRow(rowIndex).height = 200; // 픽셀 단위 높이
              worksheet.getColumn(1).width = 50; // Excel 열 너비 단위
              // 확장자 유추
              // const type = await imageType(imageBuffer);
              // if (!type || !type.mime.startsWith('image/')) {
              //   throw new Error(`이미지 크기 정보가 없습니다. URL: ${type}`);
              // }
              // const ext = type.ext;
              // const extension = ext === 'jpg' ? 'jpeg' : ext;

              const imageId = workbook.addImage({
                buffer: imageBuffer,
                extension: extension || 'jpeg',
                });

              const rowPos = Math.max(0, rowIndex - 1);
              worksheet.addImage(imageId, {
                tl: { col: 0, row: rowPos },
                editAs: 'oneCell',
                ext: { width: 200, height: 200}

              });
            } catch (err) {

              console.log(`이미지 다운로드 실패: ${err.message}`);
            }
          }
          resolve();
        } catch (e) {
          console.log(`이미지 삽입 실패: ${e.message}`);
          resolve(); // 오류가 발생해도 계속 진행하도록 resolve 호출
        }
      });
    });

    try {
      await Promise.all(rowPromises);  // 모든 이미지 프로미스를 처리
    } catch (e) {
      console.error('전체 작업에서 오류 발생:', e);
    }

  }

  public generateUrlParam(last: number, limit: number, sdate: string, edate: string) :string {
    return `${this.QUICKSTAR_URL}last=${last}&limit=${limit}&value=&or_de_no=&sdate=${sdate}&edate=${edate}&mb_id=&last_code=&it_code=&dytpe=&gr_var5=`;
  }

  public resolveImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    return `http://quickstar.co.kr${url.startsWith('/') ? '' : '/'}${url}`;
  }
}