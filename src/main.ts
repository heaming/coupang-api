// import * as crypto from 'node:crypto';
// (globalThis as any).crypto = crypto;

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './exception/http.exception';
import * as child_process from 'node:child_process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter);

  const PORT = process.env.PORT || 3000;
  if (process.platform === 'win32') {
    try {
      const cmd = `netstat -ano | findstr :${PORT}`;
      const result = child_process.execSync(cmd).toString();
      const pidMatch = result.match(/\s+(\d+)\s*$/);
      if (pidMatch) {
        const pid = pidMatch[1];
        child_process.execSync(`taskkill /PID ${pid} /F`);
        console.log(`Killed process using port ${PORT}`);
      }
    } catch (error) {
      console.error(`No process found using port ${PORT}`);
    }
  }

  const config = new DocumentBuilder()
    .setTitle('Simple Board')
    .setDescription('The Simple Board API description')
    .setVersion('1.0')
    .addTag('Board')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}
bootstrap();
