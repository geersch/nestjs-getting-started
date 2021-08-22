export interface CarInsuranceQuote {
  id: number;
  ageOfDriver: number;
  monthlyPremium: number;
  yearlyPremium: number;
  createdOn: Date;
}

export abstract class CarInsuranceQuoteRepository {
  public abstract save(
    ageOfDriver: number,
    monthlyPremium: number,
    yearlyPremium: number,
  ): Promise<CarInsuranceQuote>;

  public abstract load(id: number): Promise<CarInsuranceQuote | null>;
}
