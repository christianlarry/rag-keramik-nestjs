import { Module } from '@nestjs/common';
import { UpdateUserProfileListener } from './application/listeners/update-user-profile.listener';
import { USER_REPOSITORY_TOKEN } from './domain/repositories/user-repository.interface';
import { PrismaUserRepository } from './infrastructure/repositories';

// TIDAK PERLU import PrismaModule karena sudah @Global()
@Module({
  providers: [
    // Repositories
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository
    },

    // Listeners
    UpdateUserProfileListener
  ]
})
export class UsersModule { }
