import { beforeEach, describe, expect, it } from 'vitest';
import { QuoteService } from './quote.service';
import {
  DriveTooYoungError,
  PurchasePriceTooLowError,
  RiskTooHighError,
  UnknownCarBrandError,
} from './errors';
import {
  MockCarBrandRepository,
  MockCarInsuranceQuoteRepository,
} from '../../test';

describe('QuoteService', () => {
  let quoteService: QuoteService;

  beforeEach(() => {
    quoteService = new QuoteService(
      new MockCarBrandRepository(),
      new MockCarInsuranceQuoteRepository(),
    );
  });

  it('should calculate a premium', async () => {
    const quote = await quoteService.calculatePremium(18, 1, 40000);
    expect(quote.monthlyPremium).toEqual(83);
    expect(quote.yearlyPremium).toEqual(1000);
  });

  it('should reject the quote for an unknown brand', async () => {
    await expect(() =>
      quoteService.calculatePremium(18, 101, 37500),
    ).rejects.toThrow(UnknownCarBrandError);
  });

  it('should reject the quote if the minimum purchase price is too low', async () => {
    await expect(() =>
      quoteService.calculatePremium(18, 2, 4000),
    ).rejects.toThrow(PurchasePriceTooLowError);
  });

  it('should reject the quote if the driver is too young', async () => {
    await expect(() =>
      quoteService.calculatePremium(17, 3, 55000),
    ).rejects.toThrow(DriveTooYoungError);
  });

  it('should reject the quote if the risk is too high', async () => {
    await expect(() =>
      quoteService.calculatePremium(18, 4, 75000),
    ).rejects.toThrow(RiskTooHighError);
  });
});
