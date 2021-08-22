import { Injectable } from '@nestjs/common';
import {
  DriveTooYoungError,
  PurchasePriceTooLowError,
  RiskTooHighError,
  UnknownCarBrandError,
} from './errors';
import {
  CarBrandRepository,
  CarInsuranceQuoteRepository,
} from './repositories';

export interface Premium {
  id: number;
  monthlyPremium: number;
  yearlyPremium: number;
}

const MINIMUM_AGE = 18;
const MINIMUM_PURCHASE_PRICE = 5000;

@Injectable()
export class QuoteService {
  constructor(
    private readonly carBrandRepository: CarBrandRepository,
    private readonly quoteRepository: CarInsuranceQuoteRepository,
  ) {}

  public async calculatePremium(
    ageOfDriver: number,
    carId: number,
    purchasePrice: number,
  ): Promise<Premium> {
    if (ageOfDriver < MINIMUM_AGE) {
      throw new DriveTooYoungError();
    }

    if (purchasePrice < MINIMUM_PURCHASE_PRICE) {
      throw new PurchasePriceTooLowError();
    }

    const brand = await this.carBrandRepository.findById(carId);
    if (!brand) {
      throw new UnknownCarBrandError();
    }

    if (ageOfDriver < brand.minimumDriverAge) {
      throw new RiskTooHighError();
    }

    const premium = await this.quoteRepository.save(
      ageOfDriver,
      Math.round(brand.yearlyPremium / 12),
      brand.yearlyPremium,
    );

    return {
      id: premium.id,
      monthlyPremium: premium.monthlyPremium,
      yearlyPremium: premium.yearlyPremium,
    };
  }

  public async getById(id: number): Promise<Premium | undefined> {
    const quote = await this.quoteRepository.load(id);

    return quote
      ? {
          id: quote.id,
          monthlyPremium: quote.monthlyPremium,
          yearlyPremium: quote.yearlyPremium,
        }
      : undefined;
  }
}
