import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import {
  CarBrandRepository,
  CarInsuranceQuoteRepository,
  // KnexCarInsuranceQuoteRepository,
  PrismaCarInsuranceQuoteRepository,
  PrismaService,
} from './repositories';

@Module({
  controllers: [QuoteController],
  providers: [
    CarBrandRepository,
    QuoteService,
    PrismaService,
    {
      provide: CarInsuranceQuoteRepository,
      // useClass: KnexCarInsuranceQuoteRepository,
      useClass: PrismaCarInsuranceQuoteRepository,
    },
  ],
})
export class CarInsuranceQuoteModule {}
