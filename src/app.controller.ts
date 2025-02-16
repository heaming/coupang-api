import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { AppService } from "./app.service";
import { Ip } from './decorators/ip.decorator';
import * as http from 'node:http';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(); // DI 불가

  @Get()
  getHello(@Ip() ip: string): string {
    // this.logger.log("ip:"+ip);
    // this.logger.debug("ip:"+ip);
    // this.logger.error("ip:"+ip);
    // this.logger.verbose("ip:"+ip);
    // this.logger.warn("ip:"+ip);

    console.log(this.configService.get<string>('ENVIRONMENT'))
    return this.appService.getHello();
    // throw new HttpException('NotFound', HttpStatus.NOT_FOUND);
  }

  @Get('name')
  getName(@Query('name') name: string): string {
    return `${name} hello!`;
  }
}
