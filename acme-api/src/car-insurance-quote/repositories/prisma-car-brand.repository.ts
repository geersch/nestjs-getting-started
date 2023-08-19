import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CarBrand, CarBrandRepository } from './car-brand.repository';

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
