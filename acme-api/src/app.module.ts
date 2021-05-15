import { Module } from '@nestjs/common';
import { CarInsuranceQuoteModule } from './car-insurance-quote/car-insurance-quote.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { APP_FILTER } from '@nestjs/core';
import { BusinessRuleViolationFilter } from './business-rule-violation.filter';
import { KnexModule } from 'nestjs-knex';
// import { ContentTypeMiddlewareConfiguration } from 'src/require-content-type.middleware';

@Module({
  imports: [
    CarInsuranceQuoteModule,
    // TODO: Retrieve these values from environment variables.
    AuthenticationModule.register({
      jwtSecret: 'my-secret-key',
      expiresIn: '1h',
    }),
    KnexModule.forRootAsync({
      useFactory: () => ({
        config: {
          client: 'pg',
          connection: {
            host: process.env.PG_HOST,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: 'acme',
          },
        },
      }),
    }),
  ],
  controllers: [],
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
