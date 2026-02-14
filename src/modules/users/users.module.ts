import { Module } from '@nestjs/common';
import { UpdateUserProfileListener } from './application/listeners/update-user-profile.listener';

// TIDAK PERLU import PrismaModule karena sudah @Global()
@Module({
  providers: [
    // Listeners
    UpdateUserProfileListener
  ]
})
export class UsersModule { }
