import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { LoginDto } from './dto/login.dto.js';

export interface JwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresInSeconds: number;
  private readonly pilotUsername: string;
  private readonly pilotPassword: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret =
      this.configService.get<string>('jwtSecret') ??
      process.env.JWT_SECRET ??
      'susi-air-pilot-secret-key-2026-super-secure-token';

    const expiresInRaw =
      this.configService.get<string>('jwtExpiresIn') ??
      process.env.JWT_EXPIRES_IN ??
      '86400';
    this.jwtExpiresInSeconds = parseInt(expiresInRaw, 10) || 86400;

    this.pilotUsername =
      this.configService.get<string>('pilotUsername') ??
      process.env.PILOT_USERNAME ??
      'johndoe';

    this.pilotPassword =
      this.configService.get<string>('pilotPassword') ??
      process.env.PILOT_PASSWORD ??
      'susiairtest';
  }

  /**
   * Constant-time string comparison using Node.js crypto.timingSafeEqual
   * to protect against timing attacks.
   */
  private timingSafeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf-8');
    const bufB = Buffer.from(b, 'utf-8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Base64Url encode buffer/string
   */
  private base64UrlEncode(data: string | Buffer): string {
    const base64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data).toString('base64');
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  /**
   * Base64Url decode to string
   */
  private base64UrlDecode(input: string): string {
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * Generate RFC 7519 HMAC-SHA256 JWT using Node.js built-in crypto module
   */
  public generateToken(payload: JwtPayload): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + this.jwtExpiresInSeconds,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(signingInput)
      .digest();
    const encodedSignature = this.base64UrlEncode(signature);

    return `${signingInput}.${encodedSignature}`;
  }

  /**
   * Verify JWT using Node.js built-in crypto timing-safe comparison
   */
  public verifyToken(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(signingInput)
      .digest();
    const expectedEncodedSignature = this.base64UrlEncode(expectedSignature);

    const sigBufA = Buffer.from(encodedSignature, 'utf-8');
    const sigBufB = Buffer.from(expectedEncodedSignature, 'utf-8');

    if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    try {
      const payload: JwtPayload = JSON.parse(this.base64UrlDecode(encodedPayload));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new UnauthorizedException('Token has expired');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Missing or invalid token');
    }
  }

  /**
   * Authenticate pilot and issue OAuth 2.0 Bearer token
   */
  public async login(loginDto: LoginDto): Promise<AuthTokenResponse> {
    const isUsernameValid = this.timingSafeCompare(loginDto.username, this.pilotUsername);
    const isPasswordValid = this.timingSafeCompare(loginDto.password, this.pilotPassword);

    if (!isUsernameValid || !isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const token = this.generateToken({
      sub: 'pilot-001',
      username: loginDto.username,
    });

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresInSeconds,
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.jwtExpiresInSeconds,
    };
  }
}
