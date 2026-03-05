import { Module } from "@nestjs/common";
import { ProductsController } from "./presentation/http/products.controller";
import { CreateProductUseCase } from "./application/use-cases";
import { PRODUCT_REPOSITORY_TOKEN } from "./domain";
import { PrismaProductRepository } from "./infrastructure/repositories/prisma-product.repository";

@Module({
  providers: [
    // Use Cases
    CreateProductUseCase,

    // Repositories
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: PrismaProductRepository
    }
  ],
  controllers: [ProductsController],
})
export class ProductsModule { }