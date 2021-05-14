import { ApiProperty } from '@nestjs/swagger';

export class SignInResponseDto {
  @ApiProperty({
    type: String,
    description: 'Jason Web Token (JWT) for an authenticated user.',
    example: 'eyJhbGci...',
  })
  accessToken: string;
}
