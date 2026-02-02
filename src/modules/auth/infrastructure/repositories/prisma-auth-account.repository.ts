import { Injectable } from "@nestjs/common";
import { AuthAccount } from "../../domain/entities/auth-account.entity";
import { AuthAccountRepository } from "../../domain/repositories/auth-account-repository.interface";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { AuthAccountMapper } from "../mapper/auth-account.mapper";

@Injectable()
export class PrismaAuthAccountRepository implements AuthAccountRepository {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mapper: AuthAccountMapper,
  ) { }

  async findById(id: string): Promise<AuthAccount | null> {
    const accountRecord = await this.prismaService.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<AuthAccount | null> {

  }
  async emailExists(email: string): Promise<boolean> {

  }

  async save(account: AuthAccount): Promise<void> {

  }
}