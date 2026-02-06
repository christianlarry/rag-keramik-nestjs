import { Injectable } from "@nestjs/common";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { AuthUserRepository } from "../../domain/repositories/auth-user.repository";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { PrismaAuthUserMapper } from "../mapper/prisma-auth-user.mapper";

@Injectable()
export class PrismaAuthUserRepository implements AuthUserRepository {

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async findById(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
        password: true,
        role: true,
        status: true,
        refreshTokens: true,
        lastLoginAt: true,
        loginAttempts: true,
        createdAt: true,
        updatedAt: true,
        provider: true,
        providerId: true
      }
    });

    return user ? PrismaAuthUserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
        password: true,
        role: true,
        status: true,
        refreshTokens: true,
        lastLoginAt: true,
        loginAttempts: true,
        createdAt: true,
        updatedAt: true,
        provider: true,
        providerId: true
      }
    });

    return user ? PrismaAuthUserMapper.toDomain(user) : null;
  }

  async save(user: AuthUser): Promise<void> {
    const persistenceUser = PrismaAuthUserMapper.toPersistence(user);

    await this.prisma.user.upsert({
      where: { id: persistenceUser.id },
      create: persistenceUser,
      update: persistenceUser
    });
  }
}