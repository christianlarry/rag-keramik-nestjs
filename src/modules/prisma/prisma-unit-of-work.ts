import { Injectable } from "@nestjs/common";
import { UnitOfWork } from "../../core/application/unit-of-work.interface";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async withTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (txPrisma) => {

      this.prisma.setTransactionClient(txPrisma);

      return work();
    });
  }
}