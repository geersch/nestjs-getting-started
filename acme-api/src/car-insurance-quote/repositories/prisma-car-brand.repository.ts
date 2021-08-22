import { Injectable } from '@nestjs/common';
import { CarBrand, CarBrandRepository } from './car-brand.repository';
import { PrismaService } from '../../prisma';

@Injectable()
export class PrismaCarBrandRepository implements CarBrandRepository {
  constructor(private readonly prismaService: PrismaService) {}

  public async findById(id: number): Promise<CarBrand> {
    const brand = await this.prismaService.carBrand.findUnique({
      where: { id },
    });

    return brand
      ? {
          id: brand.id,
          name: brand.name,
          yearlyPremium: brand.yearlyPremium.toNumber(),
          minimumDriverAge: brand.minimumDriverAge,
        }
      : null;
  }
}
