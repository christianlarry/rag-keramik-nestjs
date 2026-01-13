import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { ConfigService } from "@nestjs/config";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly passwordSaltRounds: number = 10;

  // Implement authentication logic here
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) { }

  async register(registerDto: AuthRegisterDto): Promise<void> {
    // Check Email Availability
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }
    // Hash Password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create User Record
    this.logger.log(`hashedPassword: ${hashedPassword}`);

    // Generate Verification Token
    // Send Verification Email

    this.logger.log(`Registered user: ${registerDto.email}`);
  }

  async verifyEmail(token: string): Promise<void> {
    this.logger.log(token)
  }

  async resendVerification(email: string): Promise<void> {
    this.logger.log(email)
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.passwordSaltRounds);
  }
}