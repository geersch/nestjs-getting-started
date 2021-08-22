export interface CarBrand {
  id: number;
  name: string;
  minimumDriverAge: number;
  yearlyPremium: number;
}

export abstract class CarBrandRepository {
  public abstract findById(id: number): Promise<CarBrand | null>;
}
