
import {
  createParamDecorator,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { IRequestUser } from './interfaces/request-user.interface';

/**
 * Custom decorator untuk extract user dari request
 * User object ini di-inject oleh Passport JWT Strategy setelah token validation
 * 
 * @example
 * // Get full user object
 * async getProfile(@User() user: IRequestUser) { ... }
 * 
 * @example
 * // Get specific property (dengan type safety)
 * async getProfile(@User('id') userId: string) { ... }
 * 
 * @example
 * // Get email
 * async getProfile(@User('email') email: string) { ... }
 * 
 * @param data - Optional property name untuk extract specific field dari user object
 * @param ctx - Execution context dari NestJS
 * @returns User object atau specific property jika data parameter provided
 * @throws UnauthorizedException jika user tidak ditemukan di request (belum authenticated)
 */
export const User = createParamDecorator(
  <K extends keyof IRequestUser>(
    data: K | undefined,
    ctx: ExecutionContext,
  ): IRequestUser | IRequestUser[K] => {
    const logger = new Logger('UserDecorator');

    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IRequestUser | undefined;

    // Validasi: pastikan user exist di request
    // Ini terjadi jika decorator digunakan tanpa guard atau guard tidak set request.user
    if (!user) {
      logger.error('User not authenticated. Make sure to use @UseGuards(JwtAuthGuard) before using @User() decorator.');

      throw new UnauthorizedException(
        'User not authenticated. Make sure to use @UseGuards(JwtAuthGuard) before using @User() decorator.',
      );
    }

    // Jika data parameter provided, return specific property
    // Contoh: @User('id') akan return user.id
    if (data) {
      const value = user[data];

      // Additional validation untuk pastikan property exist
      if (value === undefined) {
        logger.error(`User property '${data}' not found in authenticated user.`);

        throw new UnauthorizedException(
          `User property '${data}' not found in authenticated user.`,
        );
      }

      return value;
    }

    // Return full user object jika tidak ada data parameter
    return user;
  },
);
