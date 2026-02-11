import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { IRequestUser } from '../../../../common/decorator/interfaces/request-user.interface';
import { AllConfigType } from 'src/config/config.type';
import { UsersService } from 'src/modules/users/users.service';
import { UserStatus } from 'src/generated/prisma/enums';
import { BlacklistedAccessTokenRepository } from '../repositories/blacklisted-access-token.repository';
import { AccessTokenGenerator, AccessTokenPayload } from '../generator/access-token.generator';

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
    private readonly usersService: UsersService,
    private readonly blacklistedAccessTokenRepository: BlacklistedAccessTokenRepository
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
  async validate(payload: AccessTokenPayload): Promise<IRequestUser> {
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

    // Cek status user
    const user = await this.usersService.findById(payload.sub);

    // Jika user tidak ditemukan atau statusnya tidak valid, tolak akses
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // Cek email verified, Unauthorized jika tidak memenuhi syarat
    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified. Please verify your email to access this resource.');
    }

    // Cek status user, Forbidden jika statusnya tidak aktif
    switch (user.status) {
      case UserStatus.INACTIVE:
        throw new ForbiddenException('User account is inactive. Please reactivate your account.');
      case UserStatus.SUSPENDED:
        throw new ForbiddenException('User account is suspended. Contact support for more information.');
      case UserStatus.DELETED:
        throw new ForbiddenException('User account has been deleted.');
    }

    // Transform JWT payload ke RequestUser
    // Object ini akan tersedia di request.user
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    } as IRequestUser;
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
