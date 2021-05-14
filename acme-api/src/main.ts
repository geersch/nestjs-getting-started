import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
// import { BusinessRuleViolationFilter } from './business-rule-violation.filter';

const GLOBAL_PREFIX = 'api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.useGlobalPipes(new ValidationPipe());
  // app.useGlobalFilters(new BusinessRuleViolationFilter());

  const config = new DocumentBuilder()
    .setTitle('Acme API')
    .setDescription('Acme API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth({ description: 'JWT Token', type: 'http' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(GLOBAL_PREFIX, app, document);

  await app.listen(3000);
}
bootstrap();
