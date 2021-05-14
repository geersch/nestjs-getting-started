import { ApiProperty } from '@nestjs/swagger';

export class CarInsuranceQuoteResponseDto {
  @ApiProperty({
    type: Number,
    description: 'The ID of the car insurance quote',
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: Number,
    description: 'The monthly price of the car insurance premium.',
    example: 35000,
  })
  monthlyPremium: number;

  @ApiProperty({
    type: Number,
    description: 'The yearly price of the car insurance premium',
    example: 35000,
  })
  yearlyPremium: number;
}
