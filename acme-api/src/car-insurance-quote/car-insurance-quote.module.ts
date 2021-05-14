import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { CarBrandRepository } from './repositories';
import { CarInsuranceQuoteRepository } from './repositories/car-insurance-quote.repository';
import { KnexCarInsuranceQuoteRepository } from './repositories/knex-car-insurance-quote.repository';

@Module({
  controllers: [QuoteController],
  providers: [
    CarBrandRepository,
    QuoteService,
    {
      provide: CarInsuranceQuoteRepository,
      useClass: KnexCarInsuranceQuoteRepository,
    },
  ],
})
export class CarInsuranceQuoteModule {}
