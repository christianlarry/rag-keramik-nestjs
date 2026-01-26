import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './application/users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService
  ],
  exports: [UsersService], // Export untuk digunakan module lain (Auth, dll)
})
export class UsersModule { }
