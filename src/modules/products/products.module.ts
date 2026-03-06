import { Module } from "@nestjs/common";
import { ProductsController } from "./presentation/http/products.controller";
import { CreateProductUseCase, DeleteProductUseCase, UpdateProductUseCase } from "./application/use-cases";
import { PRODUCT_QUERY_REPOSITORY_TOKEN, PRODUCT_REPOSITORY_TOKEN } from "./domain";
import { PrismaProductRepository } from "./infrastructure/repositories/prisma-product.repository";
import { PrismaProductQueryRepository } from "./infrastructure/repositories/prisma-product-query.repository";

@Module({
  providers: [
    // Use Cases
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,

    // Repositories
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: PrismaProductRepository
    },
    {
      provide: PRODUCT_QUERY_REPOSITORY_TOKEN,
      useClass: PrismaProductQueryRepository
    }
  ],
  controllers: [ProductsController],
})
export class ProductsModule { }