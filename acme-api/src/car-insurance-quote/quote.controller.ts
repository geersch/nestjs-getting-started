import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CalculateQuoteRequestDto, CarInsuranceQuoteResponseDto } from './dtos';
import { QuoteService } from './quote.service';

@ApiTags('car insurance quotes')
@Controller('quote')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @ApiCreatedResponse({
    description: 'The car insurance quote has been successfully created.',
  })
  @Post('calculate')
  public async post(
    @Body() quote: CalculateQuoteRequestDto,
  ): Promise<CarInsuranceQuoteResponseDto> {
    const premium = await this.quoteService.calculatePremium(
      quote.ageOfDriver,
      quote.carId,
      quote.purchasePrice,
    );

    return premium;
  }

  @ApiOkResponse({
    type: CarInsuranceQuoteResponseDto,
    description: 'A car insurance quote.',
  })
  @Get(':id')
  public async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CarInsuranceQuoteResponseDto> {
    const premium = await this.quoteService.getById(id);
    if (!premium) {
      throw new NotFoundException();
    }
    return premium;
  }
}
