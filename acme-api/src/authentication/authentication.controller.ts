import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { SignInRequestDto, SignInResponseDto } from './dtos';

@ApiTags('authentication')
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @ApiOkResponse({ description: 'Authentication succeeded.' })
  @ApiUnauthorizedResponse({ description: 'Authentication failed.' })
  @UseGuards(AuthGuard('local'))
  @Post('signin')
  public async signin(
    @Body() dto: SignInRequestDto,
    @Request() req,
  ): Promise<SignInResponseDto> {
    // On successfull authentication Passport makes the authenticated user (AuthenticatedUser)
    // available as a property on the request. We can obtain this using the @Request() decorator.
    console.log(req.user);

    return {
      accessToken: this.authenticationService.signin(req.user),
    };
  }
}
