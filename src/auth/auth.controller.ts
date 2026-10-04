import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from '../common/decorators/public.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pilot login to receive OAuth 2.0 Bearer token' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns Bearer accessToken',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        tokenType: 'Bearer',
        expiresIn: 86400,
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token_type: 'Bearer',
        expires_in: 86400,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Bad credentials',
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid username or password',
        path: '/auth/login',
        timestamp: '2026-05-15T00:00:00.000Z',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
