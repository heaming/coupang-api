import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';

export default ({} = {}) => ConfigModule.forRoot({
  isGlobal: true,
  // envFilePath: `.env.development.${process.env.NODE_ENV}`,
  // envFilePath: `.env.local`,
  envFilePath: `.env.development`,
  load: [configuration]
});