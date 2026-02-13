import { createParamDecorator, ExecutionContext, Logger, UnauthorizedException } from "@nestjs/common";
import { OAuthUser as OAuthUserInterface } from "../interfaces/oauth-user.interface";

export const OAuthUser = createParamDecorator(
  <K extends keyof OAuthUserInterface>(data: K | undefined, ctx: ExecutionContext): OAuthUserInterface | OAuthUserInterface[K] => {
    const logger = new Logger('OAuthUserDecorator');

    const request = ctx.switchToHttp().getRequest();
    const user = request.user as OAuthUserInterface | undefined;

    // Validasi: pastikan user exist di request
    // Ini terjadi jika decorator digunakan tanpa guard atau guard tidak set request.user
    if (!user) {
      logger.error('User not authenticated. Make sure to use @UseGuards(JwtAuthGuard) before using @OAuthUser() decorator.');

      throw new UnauthorizedException(
        'User not authenticated. Make sure to use @UseGuards(JwtAuthGuard) before using @OAuthUser() decorator.',
      );
    }

    // Jika data parameter provided, return specific property
    // Contoh: @OAuthUser('id') akan return user.id
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
  }
)