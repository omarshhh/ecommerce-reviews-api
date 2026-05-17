import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Login user and return JWT token',
    description:
      'Authenticates a seeded customer using email and password, then returns a JWT access token.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
  })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
