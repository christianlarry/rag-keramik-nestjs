import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/core/infrastructure/persistence/prisma/prisma.service';
import { CacheService } from 'src/core/infrastructure/services/cache/cache.service';
import { Product, ProductId, ProductRepository, SKU } from '../../domain';
import { PrismaProductMapper } from '../mappers/prisma-product.mapper';
import { ProductCache } from '../cache/product.cache';
import { PrismaRepositoryBase } from 'src/core/infrastructure/persistence/prisma/prisma-repository.base';

@Injectable()
export class PrismaProductRepository extends PrismaRepositoryBase implements ProductRepository {
  private readonly logger = new Logger(PrismaProductRepository.name);

  constructor(
    prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(prisma);
  }

  async findById(productId: ProductId): Promise<Product | null> {
    const id = productId.getValue();

    const cached = await this.cache.wrap(
      ProductCache.getProductByIdKey(id),
      async () => {
        return this.client.product.findUnique({
          where: { id },
          select: PrismaProductMapper.productSelect,
        });
      },
      ProductCache.PRODUCT_DETAIL_TTL,
    );

    const product = cached ? PrismaProductMapper.toDomain(cached) : null;

    if (product && product.isDeleted()) {
      return null; // Treat deleted products as non-existent
    }

    return product;
  }

  async findBySKU(sku: SKU): Promise<Product | null> {
    const skuValue = sku.getValue();

    const cached = await this.cache.wrap(
      ProductCache.getProductBySKUKey(skuValue),
      async () => {
        return this.client.product.findUnique({
          where: { sku: skuValue },
          select: PrismaProductMapper.productSelect,
        });
      },
      ProductCache.PRODUCT_DETAIL_TTL,
    );

    const product = cached ? PrismaProductMapper.toDomain(cached) : null;

    if (product && product.isDeleted()) {
      return null; // Treat deleted products as non-existent
    }

    return product;
  }

  async existsBySKU(sku: SKU): Promise<boolean> {
    const product = await this.findBySKU(sku);
    return !!product;
  }

  async save(product: Product): Promise<void> {
    const data = PrismaProductMapper.toPersistence(product);
    const { id, ...rest } = data;

    await this.client.product.upsert({
      where: { id },
      create: { id, ...rest },
      update: { ...rest },
    });

    // Emit domain events
    const events = product.pullDomainEvents();
    for (const event of events) {
      await this.eventEmitter.emitAsync(event.name, event);
    }

    // Invalidate cache after write
    const invalidationKeys = ProductCache.getInvalidationKeys(
      product.id.getValue(),
      product.sku.getValue(),
    );
    for (const key of invalidationKeys) {
      await this.cache.del(key);
    }
  }

  async delete(productId: ProductId): Promise<void> {
    const id = productId.getValue();

    // Fetch raw record to reconstruct domain entity (needed to call entity.delete())
    const raw = await this.client.product.findUnique({
      where: { id },
      select: PrismaProductMapper.productSelect,
    });

    if (!raw) {
      this.logger.warn(`Product with ID ${id} not found for deletion – skipping`);
      return;
    }

    const product = PrismaProductMapper.toDomain(raw);

    // Delegate status transition + domain event emission to the domain entity
    product.delete();

    const data = PrismaProductMapper.toPersistence(product);

    // Perform upsert to update the record with deleted status and timestamps, This is soft delete pattern to preserve data integrity and history
    await this.client.product.upsert({
      where: { id: data.id },
      create: { ...data },
      update: { ...data },
    });

    // Emit domain events
    const events = product.pullDomainEvents();
    for (const event of events) {
      await this.eventEmitter.emitAsync(event.name, event);
    }

    // Invalidate cache
    const invalidationKeys = ProductCache.getInvalidationKeys(
      id,
      product.sku.getValue(),
    );
    for (const key of invalidationKeys) {
      await this.cache.del(key);
    }

    this.logger.log(`Product with ID ${id} has been soft-deleted`);
  }
}
