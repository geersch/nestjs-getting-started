import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import {
  CarBrandRepository,
  CarInsuranceQuoteRepository,
  PrismaCarBrandRepository,
  PrismaCarInsuranceQuoteRepository,
  PrismaService,
} from './repositories';

@Module({
  controllers: [QuoteController],
  providers: [
    QuoteService,
    {
      provide: CarBrandRepository,
      useClass: PrismaCarBrandRepository,
    },
    PrismaService,
    {
      provide: CarInsuranceQuoteRepository,
      useClass: PrismaCarInsuranceQuoteRepository,
    },
  ],
})
export class CarInsuranceQuoteModule {}
