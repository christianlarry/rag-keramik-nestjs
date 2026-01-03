import { Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  // Implement authentication logic here
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) { }


}