# Cara Menggunakan PrismaService di Module Lain

## ✅ Setup Sudah Selesai

File yang sudah dibuat:
1. ✅ `prisma.service.ts` - Service untuk Prisma Client
2. ✅ `prisma.module.ts` - Module wrapper (dengan `@Global()`)
3. ✅ `app.module.ts` - Import PrismaModule

---

## 🚀 Cara Menggunakan di Module Lain

### Karena PrismaModule dibuat `@Global()`, Anda **TIDAK perlu import** di setiap module! 

Cukup **inject** langsung di service/controller:

---

## 📝 Contoh 1: Products Module

### 1. Products Service (`src/modules/products/products.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  // Inject PrismaService langsung
  constructor(private readonly prisma: PrismaService) {}

  // Create product
  async create(data: any) {
    return this.prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        price: data.price,
        tilePerBox: data.tilePerBox,
        status: 'ACTIVE',
      },
    });
  }

  // Find all products with pagination
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        where: { status: 'ACTIVE' },
        include: { inventory: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Find one product
  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true,
      },
    });
  }

  // Update product
  async update(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // Delete product
  async delete(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
```

### 2. Products Module (`src/modules/products/products.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

// TIDAK PERLU import PrismaModule karena sudah @Global()

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // Export jika module lain perlu
})
export class ProductsModule {}
```

---

## 📝 Contoh 2: Orders Module

### Orders Service (`src/modules/orders/orders.service.ts`)

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // Create order dengan transaction
  async createOrder(userId: string, items: any[]) {
    // Gunakan Prisma transaction untuk atomic operations
    return this.prisma.$transaction(async (tx) => {
      // 1. Calculate totals
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found`);
        }

        subtotal += Number(product.price) * item.quantity;
        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          originalPrice: product.price,
        });
      }

      // 2. Create order
      const order = await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId,
          status: 'PENDING_PAYMENT',
          subtotal,
          tax: 0,
          shippingCost: 0,
          discountAmount: 0,
          total: subtotal,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 3. Update inventory (reserve stock)
      for (const item of items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            reserved: {
              increment: item.quantity,
            },
          },
        });
      }

      return order;
    });
  }

  // Get user orders
  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

---

## 📝 Contoh 3: Users Module

### Users Service (`src/modules/users/users.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Create user
  async create(data: { email: string; password: string; name: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        // Don't return password
      },
    });
  }

  // Find by email (for auth)
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Find by id
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
```

---

## 📝 Contoh 4: Documents Module (RAG)

### Documents Service (`src/modules/documents/documents.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Upload document metadata
  async create(data: {
    title: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    sourceType?: string;
  }) {
    return this.prisma.document.create({
      data: {
        ...data,
        status: DocumentStatus.UPLOADED,
      },
    });
  }

  // Update status after ingestion
  async updateStatus(id: string, status: DocumentStatus) {
    return this.prisma.document.update({
      where: { id },
      data: { status },
    });
  }

  // Create chunks after processing
  async createChunks(documentId: string, chunks: any[]) {
    return this.prisma.$transaction(
      chunks.map((chunk, index) =>
        this.prisma.documentChunk.create({
          data: {
            documentId,
            seq: index + 1,
            content: chunk.content,
            metadata: chunk.metadata,
            vectorId: chunk.vectorId, // ID dari Qdrant
          },
        })
      )
    );
  }

  // Get document with chunks
  async findOneWithChunks(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { seq: 'asc' },
        },
      },
    });
  }

  // Delete document and all chunks (cascade)
  async delete(id: string) {
    return this.prisma.document.delete({
      where: { id },
      // Chunks akan terhapus otomatis karena cascade
    });
  }
}
```

---

## 🎯 Key Points

### 1. **@Global() Decorator**
```typescript
@Global() // ← Ini membuat PrismaService available di semua module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 2. **Tidak Perlu Import di Module Lain**
```typescript
// ❌ TIDAK PERLU ini:
@Module({
  imports: [PrismaModule], // Tidak perlu!
  providers: [ProductsService],
})

// ✅ Cukup seperti ini:
@Module({
  providers: [ProductsService], // Langsung inject di service
})
```

### 3. **Inject di Constructor**
```typescript
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService // ← Inject langsung
  ) {}
}
```

---

## 🚀 Advanced: Prisma Transactions

### Example: Complex Order with Multiple Operations

```typescript
async createOrderWithDiscount(userId: string, data: any) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Validate discount
    const discount = await tx.discount.findUnique({
      where: { code: data.discountCode },
    });

    if (discount && discount.usageCount >= discount.usageLimit) {
      throw new BadRequestException('Discount usage limit reached');
    }

    // 2. Create order
    const order = await tx.order.create({
      data: {
        userId,
        orderNumber: `ORD-${Date.now()}`,
        status: 'PENDING_PAYMENT',
        subtotal: data.subtotal,
        discountAmount: data.discountAmount,
        total: data.total,
        discountId: discount?.id,
      },
    });

    // 3. Update discount usage
    if (discount) {
      await tx.discount.update({
        where: { id: discount.id },
        data: {
          usageCount: { increment: 1 },
        },
      });
    }

    // 4. Create audit log
    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'ORDER_CREATED',
        targetType: 'Order',
        targetId: order.id,
      },
    });

    return order;
  });
}
```

---

## ✅ Summary

1. **PrismaModule sudah `@Global()`** → Tidak perlu import berulang
2. **Inject di constructor** → `constructor(private prisma: PrismaService)`
3. **Gunakan `this.prisma`** untuk semua database operations
4. **Gunakan transactions** untuk operasi yang perlu atomic
5. **Include relations** sesuai kebutuhan dengan `include: {}`

Sekarang Anda bisa pakai PrismaService di **semua module** tanpa import tambahan! 🎉
