import { ApiProperty } from '@nestjs/swagger';

export class SignInRequestDto {
  @ApiProperty({
    type: String,
    description: "The user's username.",
    example: 'johnsmith',
  })
  username: string;

  @ApiProperty({
    type: String,
    description: "The user's password.",
    example: 'secret-password',
  })
  password: string;
}
