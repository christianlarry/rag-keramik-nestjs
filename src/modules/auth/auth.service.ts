import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { ConfigService } from "@nestjs/config";
import { AuthRegisterDto } from "./dto/auth-register.dto";
import bcrypt from 'bcrypt';
import { PrismaService } from "../prisma/prisma.service";
import { AuthProvider, Role, UserStatus } from "src/generated/prisma/browser";
import { AllConfigType } from "src/config/config.type";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly passwordSaltRounds: number = 10;

  // Implement authentication logic here
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly prismaService: PrismaService
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
    const createdUser = await this.prismaService.$transaction(async (tx) => {
      const newUser = await this.usersService.create({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        gender: registerDto.gender,
        password: hashedPassword,
        role: Role.CUSTOMER,
        email: registerDto.email,
        emailVerified: false,
        status: UserStatus.INACTIVE,
        provider: AuthProvider.LOCAL,
        // Additional Profile Info
        address: registerDto.address
      }, tx)

      // Generate Verification Token

      // Send Verification Email

      this.logger.log(`User registered successfully: ${newUser.id}`);

      return newUser
    })

    this.logger.log(`Registered user: ${createdUser.email}`);
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