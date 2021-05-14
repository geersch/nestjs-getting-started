import { DynamicModule, Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LocalStrategy } from './local.strategy';
import { UsersService } from './users.service';
import { AuthenticationController } from './authentication.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy, JwtStrategyConfiguration } from './jwt.strategy';

export interface AuthenticationModuleOptions {
  jwtSecret: string;
  expiresIn?: string;
}

@Module({})
export class AuthenticationModule {
  public static register(options: AuthenticationModuleOptions): DynamicModule {
    return {
      module: AuthenticationModule,
      providers: [
        AuthenticationService,
        UsersService,
        LocalStrategy,
        {
          provide: JwtStrategyConfiguration,
          useValue: {
            jwtSecret: options.jwtSecret,
          },
        },
        JwtStrategy,
      ],
      controllers: [AuthenticationController],
      imports: [
        JwtModule.register({
          secret: options.jwtSecret,
          signOptions: {
            expiresIn: options.expiresIn || '1h', // default to 1 hour
          },
        }),
      ],
    };
  }
}
