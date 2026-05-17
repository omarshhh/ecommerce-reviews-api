import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'omar@test.com',
    description: 'Customer email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Customer password',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
