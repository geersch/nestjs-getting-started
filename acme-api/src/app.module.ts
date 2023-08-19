import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthenticationModule } from './authentication/authentication.module';
import { BusinessRuleViolationFilter } from './business-rule-violation.filter';
import { CarInsuranceQuoteModule } from './car-insurance-quote/car-insurance-quote.module';
// import { KnexModule } from 'nestjs-knex';
// import { ContentTypeMiddlewareConfiguration } from 'src/require-content-type.middleware';
import * as getenv from 'getenv';

@Module({
  imports: [
    CarInsuranceQuoteModule,
    AuthenticationModule.register({
      jwtSecret: getenv.string('JWT_SECRET'),
      expiresIn: getenv.string('JWT_EXPIRES_IN', '1h'),
    }),
    /*
    KnexModule.forRootAsync({
      useFactory: () => ({
        config: {
          client: 'pg',
          connection: {
            host: getenv.string('POSTGRES_HOST'),
            user: getenv.string('POSTGRES_USER'),
            password: getenv.string('POSTGRES_PASSWORD'),
            database: getenv.string('DB_NAME'),
            // ssl: { rejectUnauthorized: false },
            ssl: false,
          },
        },
      }),
    }),
    */
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: BusinessRuleViolationFilter,
    },

    /*
    {
      provide: ContentTypeMiddlewareConfiguration,
      useValue: { requiredContentType: 'application/json' }
    }
    */
  ],
})
export class AppModule {}
