import { Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import {
  CarInsuranceQuote,
  CarInsuranceQuoteRepository,
} from './car-insurance-quote.repository';

@Injectable()
export class KnexCarInsuranceQuoteRepository
  implements CarInsuranceQuoteRepository
{
  private table = 'car_insurance_quote';

  constructor(@InjectKnex() private readonly knex: Knex) {}

  public async save(
    ageOfDriver: number,
    monthlyPremium: number,
    yearlyPremium: number,
  ): Promise<CarInsuranceQuote> {
    const createdOn: Date = new Date();
    const result = await this.knex.table(this.table).insert(
      {
        ageofdriver: ageOfDriver,
        monthlypremium: monthlyPremium,
        yearlypremium: yearlyPremium,
        createdon: createdOn,
      },
      'id',
    );

    return {
      id: result[0],
      ageOfDriver,
      monthlyPremium,
      yearlyPremium,
      createdOn,
    };
  }

  public async load(id: number): Promise<CarInsuranceQuote> {
    const row = await this.knex
      .table(this.table)
      .where('id', id)
      .select<CarInsuranceQuote>(
        'id',
        'ageofdriver as ageOfDriver',
        'monthlypremium as monthlyPremium',
        'yearlypremium as yearlyPremium',
        'createdon as createdOn',
      )
      .first<CarInsuranceQuote>();

    return {
      id: row.id,
      ageOfDriver: row.ageOfDriver,
      // TODO: use node-pg-types to configure parsers to convert PostgreSQL types back into JavaScript types.
      monthlyPremium: parseFloat(row.monthlyPremium as any),
      yearlyPremium: parseFloat(row.yearlyPremium as any),
      createdOn: row.createdOn,
    };
  }
}
