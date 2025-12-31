import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

// TIDAK PERLU import PrismaModule karena sudah @Global()
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export untuk digunakan module lain (Auth, dll)
})
export class UsersModule { }
