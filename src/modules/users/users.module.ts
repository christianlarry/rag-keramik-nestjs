import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './application/users.service';
import { USER_QUERY_REPOSITORY, USER_REPOSITORY } from './domain';
import { UserRepository } from './infrastructure/repositories/user.repository';
import { UserQueryRepository } from './infrastructure/repositories/user-query,repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: USER_QUERY_REPOSITORY,
      useClass: UserQueryRepository,
    }
  ],
  exports: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: USER_QUERY_REPOSITORY,
      useClass: UserQueryRepository,
    }
  ], // Export untuk digunakan module lain (Auth, dll)
})
export class UsersModule { }
