import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Membuat module ini global, tidak perlu import berulang
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export agar bisa digunakan module lain
})
export class PrismaModule { }
