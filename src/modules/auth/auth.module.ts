import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({})
  ],
  controllers: [],
  providers: [
    AuthService
  ],
  exports: [],
})
export class AuthModule { }