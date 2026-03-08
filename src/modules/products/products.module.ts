import { Module } from "@nestjs/common";
import {
  BrowsingProductsUseCase,
  CreateProductUseCase,
  DeleteProductUseCase,
  UpdateProductUseCase,
} from "./application/use-cases";
import { PRODUCT_QUERY_REPOSITORY_TOKEN, PRODUCT_REPOSITORY_TOKEN } from "./domain";
import { PrismaProductRepository } from "./infrastructure/repositories/prisma-product.repository";
import { PrismaProductQueryRepository } from "./infrastructure/repositories/prisma-product-query.repository";

import { ProductsReadController, ProductsWriteController } from "./presentation/http";

@Module({
  providers: [
    // Use Cases
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    BrowsingProductsUseCase,

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
  controllers: [
    ProductsWriteController,
    ProductsReadController,
  ],
})
export class ProductsModule { }