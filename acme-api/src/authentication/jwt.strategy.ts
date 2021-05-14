import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthenticationUser } from './authentication.service';

interface JwtPayload {
  sub: string;
  username: string;
}

export class JwtStrategyConfiguration {
  jwtSecret: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configuration: JwtStrategyConfiguration) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configuration.jwtSecret,
    });
  }

  public async validate(payload: JwtPayload): Promise<AuthenticationUser> {
    return {
      id: parseInt(payload.sub, 10),
      username: payload.username,
    };
  }
}
