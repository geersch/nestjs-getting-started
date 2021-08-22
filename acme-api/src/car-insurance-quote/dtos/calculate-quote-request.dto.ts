import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CalculateQuoteRequestDto {
  @ApiProperty({
    type: Number,
    description: 'The age of the driver. Minimum 18 years.',
    example: 18,
  })
  @IsNumber()
  ageOfDriver: number;

  @ApiProperty({
    type: Number,
    description: 'The ID of the car brand',
    example: 1,
  })
  @IsNumber()
  carId: number;

  @ApiProperty({
    type: Number,
    description: 'The purchase price of the car.',
    example: 35000,
  })
  @IsNumber()
  purchasePrice: number;
}
