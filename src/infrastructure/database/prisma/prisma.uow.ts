import { TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { UnitOfWork } from "../interfaces/uow.interface";
import { PrismaService } from "./prisma.service";

export class PrismaUnitOfWork implements UnitOfWork {

  constructor(
    private readonly prismaService: PrismaService
  ) { }

  run<T>(work: (tx: TransactionClient) => Promise<T>): Promise<T> {
    // Implement transaction management using Prisma here
    return this.prismaService.$transaction(async (tx) => {
      return work(tx);
    });
  }
}