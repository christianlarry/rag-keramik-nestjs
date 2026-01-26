import { Injectable } from "@nestjs/common";
import { IUserRepository, PagedResult, UserEntity, UserSearchCriteria } from "../../domain";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { UserMapper } from "../mappers/user.mapper";

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prismaService: PrismaService) { }

  findMany(criteria: UserSearchCriteria): Promise<PagedResult<UserEntity>> {
    return this.prismaService.user.findMany({
      where: {
        role: UserMapper.role.toPrismaSafe(criteria.role),

      }
    });
  }
}