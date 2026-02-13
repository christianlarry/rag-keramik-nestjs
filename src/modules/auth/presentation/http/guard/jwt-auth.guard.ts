import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * 
 * Guard ini menggunakan JwtStrategy untuk validate JWT token
 * dari Authorization header.
 * 
 * Gunakan guard ini untuk protect routes yang memerlukan authentication.
 * Guard akan:
 * 1. Extract JWT token dari Authorization header
 * 2. Validate signature menggunakan JWT_SECRET
 * 3. Check expiration
 * 4. Call JwtStrategy.validate() untuk transform payload
 * 5. Inject user object ke request.user
 * 
 * @example
 * // Protect single route
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * async getProfile(@User() user: RequestUser) {
 *   return user;
 * }
 * 
 * @example
 * // Protect entire controller
 * @Controller('users')
 * @UseGuards(JwtAuthGuard)
 * export class UsersController { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt-access') {
  /**
   * Optional: Override canActivate untuk custom logic
   * Misalnya: tambahan validasi, logging, rate limiting, etc.
   */
  canActivate(context: ExecutionContext) {
    // Call parent implementation (Passport JWT validation)
    return super.canActivate(context);
  }

  /**
   * Optional: Override handleRequest untuk custom error handling
   * Default behavior sudah cukup untuk most cases
   */
  // handleRequest(err: any, user: any, info: any) {
  //   if (err || !user) {
  //     throw err || new UnauthorizedException('Invalid token');
  //   }
  //   return user;
  // }
}

/**
 * CARA PENGGUNAAN:
 * 
 * 1. Register JwtStrategy di auth.module.ts
 * 2. Import AuthModule di module yang memerlukan auth
 * 3. Gunakan @UseGuards(JwtAuthGuard) di controller/route
 * 4. Access authenticated user dengan @User() decorator
 * 
 * CONTOH REQUEST:
 * GET /api/v1/users/me
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
