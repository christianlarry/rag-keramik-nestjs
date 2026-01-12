import { registerAs } from "@nestjs/config"
import { IsInt, IsPositive, IsString, Max, Min } from "class-validator"
import validateConfig from "src/utils/validate-config"
import { AuthConfig } from "./auth-config.type"

class EnvironmentVariablesValidator {
  @IsString()
  ACCESS_TOKEN_SECRET: string

  @IsString()
  REFRESH_TOKEN_SECRET: string

  @IsInt()
  @Min(1)
  @Max(1440)
  @IsPositive()
  ACCESS_TOKEN_EXPIRATION_MINUTES: number

  @IsInt()
  @Min(1)
  @Max(365)

  @IsPositive()
  REFRESH_TOKEN_EXPIRATION_DAYS: number
}

export default registerAs<AuthConfig>('auth', () => {
  // Validate environment variables
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'default_access_token_secret',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default_refresh_token_secret',
    accessTokenExpirationMinutes: process.env.ACCESS_TOKEN_EXPIRATION_MINUTES
      ? parseInt(process.env.ACCESS_TOKEN_EXPIRATION_MINUTES, 10) : 15,
    refreshTokenExpirationDays: process.env.REFRESH_TOKEN_EXPIRATION_DAYS
      ? parseInt(process.env.REFRESH_TOKEN_EXPIRATION_DAYS, 10) : 30,
  }
})