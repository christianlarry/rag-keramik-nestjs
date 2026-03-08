import { Module } from "@nestjs/common";
import {
  BrowsingProductsUseCase,
  CreateProductUseCase,
  DeleteProductUseCase,
  UpdateProductUseCase,
  GetProductDetailUseCase,
} from "./application/use-cases";
import {
  PRODUCT_QUERY_REPOSITORY_TOKEN,
  PRODUCT_REPOSITORY_TOKEN,
  PRODUCT_SEARCH_REPOSITORY_TOKEN,
} from "./domain";
import { ElasticsearchProductSearchRepository } from "./infrastructure/repositories/elasticsearch-product-search.repository";
import { PrismaProductRepository } from "./infrastructure/repositories/prisma-product.repository";
import { PrismaProductQueryRepository } from "./infrastructure/repositories/prisma-product-query.repository";

import { ProductsReadController, ProductsWriteController } from "./presentation/http";
import { LogProductCreatedListener } from "./application/listeners/log-product-created.listener";
import { LogProductUpdatedListener } from "./application/listeners/log-product-updated.listener";
import { AuditModule } from "src/core/infrastructure/services/audit/audit.module";
import { LogProductDeletedListener } from "./application/listeners";

@Module({
  imports: [
    AuditModule,
  ],
  providers: [
    // Use Cases
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    BrowsingProductsUseCase,
    GetProductDetailUseCase,

    // Listeners
    LogProductCreatedListener,
    LogProductUpdatedListener,
    LogProductDeletedListener,

    // Repositories
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: PrismaProductRepository
    },
    {
      provide: PRODUCT_QUERY_REPOSITORY_TOKEN,
      useClass: PrismaProductQueryRepository
    },
    {
      provide: PRODUCT_SEARCH_REPOSITORY_TOKEN,
      useClass: ElasticsearchProductSearchRepository,
    }
  ],
  controllers: [
    ProductsWriteController,
    ProductsReadController,
  ],
})
export class ProductsModule { }