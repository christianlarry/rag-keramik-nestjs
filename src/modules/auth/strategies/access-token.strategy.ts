import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.type';
import { IRequestUser } from '../../../common/decorator/interfaces/request-user.interface';
import { JwtPayloadType } from '../enums/jwt-payload-type.enum';

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
  constructor(private configService: ConfigService) {
    super({
      // Extract JWT dari Authorization header dengan format: "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Jangan terima expired token
      ignoreExpiration: false,

      // Secret key untuk verify signature
      // PENTING: Gunakan environment variable untuk production!
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET', { infer: true }),
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
  async validate(payload: JwtPayload): Promise<IRequestUser> {
    // Validasi token type - hanya terima access token
    // Refresh token tidak boleh digunakan untuk access protected routes
    if (payload.type !== JwtPayloadType.ACCESS) {
      throw new UnauthorizedException('Invalid token type. Access token required.');
    }

    // Optional: Tambahkan validasi tambahan di sini
    // Contoh:
    // - Check apakah token sudah di-blacklist (untuk logout)
    // - Check apakah user masih exist di database
    // - Check apakah user masih active/tidak di-ban

    // Transform JWT payload ke RequestUser
    // Object ini akan tersedia di request.user
    const user: IRequestUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    return user;
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
