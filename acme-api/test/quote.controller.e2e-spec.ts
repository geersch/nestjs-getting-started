import { afterAll, beforeAll, describe, it } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('QuoteController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should a 404 Not Found status code for an unknown quote', () => {
    return request(app.getHttpServer()).get('/9001').expect(404).expect({
      statusCode: 404,
      message: 'Cannot GET /9001',
      error: 'Not Found',
    });
  });
});
