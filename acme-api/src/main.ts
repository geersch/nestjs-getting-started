import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
// import { BusinessRuleViolationFilter } from './business-rule-violation.filter';
import * as compression from 'compression';
import * as getenv from 'getenv';

async function bootstrap() {
  const globalPrefix: string = getenv.string('GLOBAL_PREFIX', 'api');

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe());
  // app.useGlobalFilters(new BusinessRuleViolationFilter());

  app.use(compression());

  const config = new DocumentBuilder()
    .setTitle('Acme API')
    .setDescription('Acme API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth({ description: 'JWT Token', type: 'http' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(globalPrefix, app, document);

  const port: number = getenv.int('PORT', 3000);
  await app.listen(port);
}
bootstrap();
