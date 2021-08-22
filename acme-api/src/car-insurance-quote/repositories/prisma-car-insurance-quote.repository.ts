import { Injectable } from '@nestjs/common';
import {
  CarInsuranceQuote,
  CarInsuranceQuoteRepository,
} from './car-insurance-quote.repository';
import { PrismaService } from '../../prisma';

@Injectable()
export class PrismaCarInsuranceQuoteRepository
  implements CarInsuranceQuoteRepository
{
  constructor(private readonly prismaService: PrismaService) {}

  public async save(
    ageOfDriver: number,
    monthlyPremium: number,
    yearlyPremium: number,
  ): Promise<CarInsuranceQuote> {
    const createdOn: Date = new Date();
    const quote = await this.prismaService.carInsuranceQuote.create({
      data: {
        ageOfDriver,
        monthlyPremium,
        yearlyPremium,
        createdOn,
      },
    });

    return {
      id: quote.id,
      ageOfDriver: quote.ageOfDriver,
      monthlyPremium: quote.monthlyPremium.toNumber(),
      yearlyPremium: quote.yearlyPremium.toNumber(),
      createdOn: quote.createdOn,
    };
  }

  public async load(id: number): Promise<CarInsuranceQuote | null> {
    const quote = await this.prismaService.carInsuranceQuote.findUnique({
      where: { id },
    });

    return quote
      ? {
          id: quote.id,
          ageOfDriver: quote.ageOfDriver,
          monthlyPremium: quote.monthlyPremium.toNumber(),
          yearlyPremium: quote.yearlyPremium.toNumber(),
          createdOn: quote.createdOn,
        }
      : null;
  }
}
