import { beforeEach, describe, expect, it } from 'vitest';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import {
  MockCarBrandRepository,
  MockCarInsuranceQuoteRepository,
} from '../../test';
import { NotFoundException } from '@nestjs/common';

describe('QuoteController', () => {
  let quoteController: QuoteController;
  let quoteService: QuoteService;

  beforeEach(() => {
    quoteService = new QuoteService(
      new MockCarBrandRepository(),
      new MockCarInsuranceQuoteRepository(),
    );
    quoteController = new QuoteController(quoteService);
  });

  describe('post', () => {
    it('should calculate a quote', async () => {
      const response = await quoteController.post({
        ageOfDriver: 18,
        carId: 2,
        purchasePrice: 56900,
      });

      expect(response).toEqual({
        id: 1,
        monthlyPremium: 104,
        yearlyPremium: 1250,
      });
    });
  });

  describe('getById', () => {
    let quoteId: number;

    beforeEach(async () => {
      quoteId = (
        await quoteController.post({
          ageOfDriver: 21,
          carId: 3,
          purchasePrice: 45000,
        })
      ).id;
    });

    it('should throw a NotFoundException exception for an unknown quote', async () => {
      await expect(() => quoteController.getById(9001)).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('should get a quote by its ID', async () => {
      const response = await quoteController.getById(quoteId);
      expect(response).toEqual({
        id: quoteId,
        monthlyPremium: 125,
        yearlyPremium: 1500,
      });
    });
  });
});
