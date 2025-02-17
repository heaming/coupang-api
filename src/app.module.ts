import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingMiddleware } from './middleware/logging.middleware';
import ConfigModule from './config'
import { HttpModule } from '@nestjs/axios';
import { CoupangApiController } from './coupang-api/coupang-api.controller';
import { CoupangApiService } from './coupang-api/coupang-api.service';
import configuration from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // Docker에서 PostgreSQL 컨테이너가 로컬에서 실행되고 있다고 가정
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'youngil',
      entities: [],
      synchronize: true, // 개발 중에만 true로 설정 (프로덕션에서는 false로 설정)
    }),
    HttpModule,
  ],
  controllers: [
    AppController,
    CoupangApiController,
  ],
  providers: [
    AppService,
    CoupangApiService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // consumer.apply(LoggingMiddleware).forRoutes(CoupangApiController);
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
