import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import {
  AuthenticationService,
  AuthenticatedUser,
} from './authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authenticationService: AuthenticationService) {
    super();
  }

  public async validate(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user: AuthenticatedUser | null =
      await this.authenticationService.validate(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
