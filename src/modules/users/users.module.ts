import { Module } from '@nestjs/common';
import { UpdateUserProfileListener } from './application/listeners/update-user-profile.listener';
import { USER_REPOSITORY_TOKEN } from './domain/repositories/user-repository.interface';
import { USER_QUERY_REPOSITORY_TOKEN } from './domain/repositories/user-query-repository.interface';
import { PrismaUserRepository, PrismaUserQueryRepository } from './infrastructure/repositories';
import { AuditLogUserProfileUpdateListener } from './application/listeners/audit-log-user-profile-update.listener';
import { AuditModule } from 'src/core/infrastructure/services/audit/audit.module';
import { UsersController } from './presentation/users.controller';
import {
  GetCurrentUserProfileUseCase,
  UpdateCurrentUserProfileUseCase,
  GetAllUsersUseCase,
  GetUserByIdUseCase,
} from './application/use-cases';

// TIDAK PERLU import PrismaModule karena sudah @Global()
@Module({
  imports: [
    AuditModule,
  ],
  controllers: [
    UsersController,
  ],
  providers: [
    // Repositories - Command (Write)
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository
    },

    // Repositories - Query (Read)
    {
      provide: USER_QUERY_REPOSITORY_TOKEN,
      useClass: PrismaUserQueryRepository
    },

    // Use Cases
    GetCurrentUserProfileUseCase,
    UpdateCurrentUserProfileUseCase,
    GetAllUsersUseCase,
    GetUserByIdUseCase,

    // Listeners
    UpdateUserProfileListener,
    AuditLogUserProfileUpdateListener,

  ]
})
export class UsersModule { }
