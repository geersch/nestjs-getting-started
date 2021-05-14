export interface CarBrand {
  id: number;
  name: string;
  minimumDriverAge: number;
  yearlyPremium: number;
}

export class CarBrandRepository {
  private readonly brands: CarBrand[] = [
    { id: 1, name: 'Audi', minimumDriverAge: 18, yearlyPremium: 250 },
    { id: 1, name: 'BMW', minimumDriverAge: 18, yearlyPremium: 150 },
    { id: 1, name: 'Porsche', minimumDriverAge: 25, yearlyPremium: 500 },
  ];

  public findById(id: number): CarBrand | undefined {
    return this.brands.find((brand: CarBrand) => brand.id === id);
  }
}
