import {
  CarInsuranceQuote,
  CarInsuranceQuoteRepository,
} from '../../src/car-insurance-quote/repositories';

export class MockCarInsuranceQuoteRepository extends CarInsuranceQuoteRepository {
  private quotes: CarInsuranceQuote[] = [];

  public async save(
    ageOfDriver: number,
    monthlyPremium: number,
    yearlyPremium: number,
  ): Promise<CarInsuranceQuote> {
    const quote = {
      id: this.quotes.length + 1,
      ageOfDriver,
      monthlyPremium,
      yearlyPremium,
      createdOn: new Date(),
    };
    this.quotes.push(quote);
    return quote;
  }

  public async load(id: number): Promise<CarInsuranceQuote | null> {
    const quote = this.quotes.find((quote) => quote.id === id);
    return quote ?? null;
  }
}
