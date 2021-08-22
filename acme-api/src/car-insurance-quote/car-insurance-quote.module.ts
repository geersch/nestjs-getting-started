import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import {
  CarBrandRepository,
  CarInsuranceQuoteRepository,
  PrismaCarBrandRepository,
  PrismaCarInsuranceQuoteRepository,
} from './repositories';

@Module({
  controllers: [QuoteController],
  imports: [PrismaModule],
  providers: [
    QuoteService,
    {
      provide: CarBrandRepository,
      useClass: PrismaCarBrandRepository,
    },
    {
      provide: CarInsuranceQuoteRepository,
      useClass: PrismaCarInsuranceQuoteRepository,
    },
  ],
})
export class CarInsuranceQuoteModule {}
