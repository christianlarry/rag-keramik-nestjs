import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { BlacklistedAccessTokenRepository } from '../repositories/blacklisted-access-token.repository';
import { AccessTokenGenerator, AccessTokenPayload } from '../generator/access-token.generator';
import { AUTH_USER_REPOSITORY_TOKEN, type AuthUserRepository } from '../../domain/repositories/auth-user-repository.interface';

/**
 * JWT Authentication Strategy
 * 
 * Strategy ini digunakan oleh Passport untuk validate JWT token
 * dan inject user information ke dalam request object.
 * 
 * Flow:
 * 1. Client mengirim request dengan Bearer token di header
 * 2. Passport extract token dari Authorization header
 * 3. Passport verify signature menggunakan JWT_SECRET
 * 4. Jika valid, method validate() dipanggil dengan payload dari token
 * 5. Object yang di-return dari validate() akan di-assign ke request.user
 * 6. @User() decorator bisa digunakan untuk access request.user
 * 
 * @example
 * // Di controller
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * async getProfile(@User() user: RequestUser) {
 *   return user;
 * }
 */
@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly blacklistedAccessTokenRepository: BlacklistedAccessTokenRepository,
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
  ) {
    super({
      // Extract JWT dari Authorization header dengan format: "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Jangan terima expired token
      ignoreExpiration: false,

      // Secret key untuk verify signature
      // PENTING: Gunakan environment variable untuk production!
      secretOrKey: configService.getOrThrow<string>('auth.accessTokenSecret', { infer: true }),
    });
  }

  /**
   * Validate JWT payload dan transform ke RequestUser
   * 
   * Method ini dipanggil setelah JWT signature ter-verify.
   * Return value akan di-assign ke request.user
   * 
   * @param payload - Decoded JWT payload
   * @returns RequestUser object yang akan di-inject ke request.user
   * @throws UnauthorizedException jika token type bukan 'access'
   */
  async validate(payload: AccessTokenPayload): Promise<Record<string, any>> {
    // Check token blacklisting
    const isBlacklisted = await this.blacklistedAccessTokenRepository.get(payload.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked.');
    }

    // Validasi token type - hanya terima access token
    // Refresh token tidak boleh digunakan untuk access protected routes
    if (payload.type !== AccessTokenGenerator.TokenType) {
      throw new UnauthorizedException('Invalid token type. Access token required.');
    }

    // Fetch user dari database
    const authUser = await this.authUserRepository.findById(payload.sub);
    if (!authUser) {
      throw new UnauthorizedException('User not found.');
    }

    // Cek email verified, Unauthorized jika tidak memenuhi syarat
    if (!authUser.emailVerified) {
      throw new UnauthorizedException('Email not verified. Please verify your email to access this resource.');
    }

    // Cek status user, Forbidden jika statusnya tidak aktif
    switch (authUser.status.getValue()) {
      case 'inactive':
        throw new ForbiddenException('User account is inactive. Please reactivate your account.');
      case 'suspended':
        throw new ForbiddenException('User account is suspended. Contact support for more information.');
      case 'deleted':
        throw new ForbiddenException('User account has been deleted.');
    }

    // Object ini akan tersedia di request.user
    return {
      id: authUser.id.getValue(),
      email: authUser.email.getValue(),
      role: authUser.role.getValue(),
    };
  }
}

/**
 * CARA PENGGUNAAN:
 * 
 * 1. Register strategy di auth.module.ts:
 *    providers: [JwtStrategy, ...]
 * 
 * 2. Gunakan JwtAuthGuard di controller:
 *    @UseGuards(JwtAuthGuard)
 *    @Get('protected-route')
 *    async protectedRoute(@User() user: RequestUser) { ... }
 * 
 * 3. Access user info dengan @User() decorator:
 *    - @User() user: RequestUser           // full user object
 *    - @User('id') userId: string          // specific property
 *    - @User('email') email: string        // specific property
 *    - @User('role') role: Role            // specific property
 */
