import { Injectable } from "@nestjs/common";
import { IUnitOfWork, IUnitOfWorkContext } from "../interfaces/uow.interface";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { UserRepository } from "src/modules/users/infrastructure/repositories/user.repository";

@Injectable()
export class PrismaUnitOfWorkService implements IUnitOfWork {
  constructor(private readonly prismaService: PrismaService) { }

  async run<T>(work: (context: IUnitOfWorkContext) => Promise<T>): Promise<T> {
    return this.prismaService.$transaction(async (tx) => {
      const context: IUnitOfWorkContext = {
        userRepository: new UserRepository(tx),
      };
      return await work(context);
    });
  }
}