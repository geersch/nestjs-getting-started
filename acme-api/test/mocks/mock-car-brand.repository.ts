import {
  CarBrand,
  CarBrandRepository,
} from '../../src/car-insurance-quote/repositories';

const BRANDS: CarBrand[] = [
  { id: 1, name: 'Mercedes', minimumDriverAge: 18, yearlyPremium: 1000 },
  { id: 2, name: 'BMW', minimumDriverAge: 18, yearlyPremium: 1250 },
  { id: 3, name: 'Audi', minimumDriverAge: 18, yearlyPremium: 1500 },
  { id: 4, name: 'Porsche', minimumDriverAge: 25, yearlyPremium: 2500 },
];

export class MockCarBrandRepository extends CarBrandRepository {
  public async findById(id: number): Promise<CarBrand | null> {
    const brand = BRANDS.find((car) => car.id === id);
    return brand ?? null;
  }
}
