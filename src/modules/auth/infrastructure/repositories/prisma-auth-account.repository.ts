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

    return accountRecord ? this.mapper.toDomain(accountRecord) : null;
  }

  async findByEmail(email: string): Promise<AuthAccount | null> {
    const accountRecord = await this.prismaService.user.findUnique({
      where: { email },
    });
    return accountRecord ? this.mapper.toDomain(accountRecord) : null;
  }
  async emailExists(email: string): Promise<boolean> {
    const count = await this.prismaService.user.count({
      where: { email },
    });
    return count > 0;
  }

  async save(account: AuthAccount): Promise<void> {
    const persistence = this.mapper.toPersistence(account);

    await this.prismaService.user.upsert({
      where: { id: persistence.id },
      create: persistence,
      update: persistence,
    });
  }
}