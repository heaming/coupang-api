import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BoardModule } from './board/board.module';
import { LoggingMiddleware } from './middleware/logging.middleware';
import ConfigModule from './config'
import { HttpModule } from '@nestjs/axios';
import { CoupangApiController } from './coupang-api/coupang-api.controller';
import { CoupangApiService } from './coupang-api/coupang-api.service';

@Module({
  imports: [
    ConfigModule(),
    BoardModule,
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
    // consumer.apply(LoggingMiddleware).forRoutes(BoardController);
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
