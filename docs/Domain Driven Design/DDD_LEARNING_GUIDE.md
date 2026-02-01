# Domain-Driven Design (DDD) - Panduan Praktis

## 1. Introduction

**DDD adalah pendekatan desain software yang menempatkan domain bisnis sebagai pusat dari seluruh arsitektur, bukan database atau framework.** Tujuannya: kode yang "berbicara" dalam bahasa bisnis sehingga developer dan domain expert bisa berkolaborasi tanpa miskomunikasi.

### Kapan Menggunakan DDD?

| ✅ Gunakan DDD | ❌ Jangan Gunakan DDD |
|---------------|----------------------|
| Domain bisnis kompleks dengan banyak aturan | CRUD sederhana (blog, to-do list) |
| Tim bekerja dengan domain expert | Prototype atau MVP cepat |
| Sistem akan berkembang bertahun-tahun | Tim kecil, deadline ketat |
| Banyak edge case dan invariant | Tidak ada domain expert |

---

## 2. The Big Picture (Strategic Design)

Strategic Design menjawab: **"Bagaimana kita memecah sistem besar menjadi bagian-bagian yang bisa dikelola?"**

### 2.1 Ubiquitous Language

> **ELI5:** Semua orang (developer, PM, domain expert) harus menggunakan istilah yang sama. Jika bisnis menyebut "Pesanan", kode harus punya class `Order`, bukan `Transaction` atau `Purchase`.

**Aturan:**
- Satu istilah = satu makna (tidak ada sinonim)
- Istilah didefinisikan bersama domain expert
- Kode harus mencerminkan bahasa ini 1:1

```
❌ SALAH                          ✅ BENAR
class UserTransaction {}    →    class Order {}
function processItem()      →    function placeOrder()
```

### 2.2 Bounded Context

> **ELI5:** Satu kata bisa punya arti berbeda di departemen berbeda. "Product" di tim Sales berbeda dengan "Product" di tim Warehouse. Bounded Context adalah "pagar" yang memisahkan konteks-konteks ini.

```
┌─────────────────────┐    ┌─────────────────────┐
│   Sales Context     │    │  Inventory Context  │
│                     │    │                     │
│  Product:           │    │  Product:           │
│  - price            │    │  - sku              │
│  - discount         │    │  - quantity         │
│  - commission       │    │  - location         │
└─────────────────────┘    └─────────────────────┘
        ↓                           ↓
   Dua model berbeda untuk konsep "Product"
```

**Aturan:**
- Setiap Bounded Context punya model domain sendiri
- Tidak ada sharing database antar context
- Komunikasi via API atau Domain Events

### 2.3 Context Mapping

> **ELI5:** Peta yang menunjukkan bagaimana Bounded Context saling berbicara dan siapa yang "berkuasa" dalam relasi tersebut.

| Pattern | Penjelasan | Contoh |
|---------|------------|--------|
| **Shared Kernel** | Dua tim berbagi sebagian kode/model | Library authentication bersama |
| **Customer-Supplier** | Upstream menyediakan, downstream mengonsumsi | Payment → Order |
| **Conformist** | Downstream mengikuti model upstream apa adanya | Integrasi dengan API pihak ketiga |
| **Anti-Corruption Layer (ACL)** | Translator antara dua model berbeda | Legacy system → New system |
| **Open Host Service** | API publik dengan protokol terdefinisi | REST API untuk partner |
| **Published Language** | Format data standar (JSON Schema, Protobuf) | Event schema untuk messaging |

```
┌──────────────┐         ACL         ┌──────────────┐
│   Legacy     │ ←──────────────────→ │  New System  │
│   System     │   (Translator)       │              │
└──────────────┘                      └──────────────┘
```

---

## 3. The Building Blocks (Tactical Design)

Tactical Design menjawab: **"Bagaimana kita memodelkan domain dalam kode?"**

### 3.1 Entity

> **ELI5:** Objek yang punya identitas unik. Dua `User` dengan nama sama tetap berbeda jika ID-nya berbeda.

**Ciri-ciri:**
- Punya identifier unik (ID)
- Bisa berubah state-nya (mutable)
- Kesamaan ditentukan oleh ID, bukan atribut

```typescript
class User {
  constructor(
    private readonly id: UserId,      // Identity
    private email: Email,
    private name: string,
    private status: UserStatus
  ) {}

  // Behavior, bukan setter!
  activate(): void {
    if (this.status === UserStatus.BANNED) {
      throw new Error('Banned user cannot be activated');
    }
    this.status = UserStatus.ACTIVE;
  }

  equals(other: User): boolean {
    return this.id.equals(other.id);  // Perbandingan by ID
  }
}
```

### 3.2 Value Object

> **ELI5:** Objek yang tidak punya identitas. Dua `Money(100, 'IDR')` adalah sama persis. Seperti angka 5 - tidak ada "5 yang ini" dan "5 yang itu".

**Ciri-ciri:**
- Tidak punya ID
- Immutable (tidak bisa diubah setelah dibuat)
- Kesamaan ditentukan oleh semua atributnya
- Self-validating

```typescript
class Money {
  constructor(
    readonly amount: number,
    readonly currency: string
  ) {
    if (amount < 0) throw new Error('Amount cannot be negative');
    if (!['IDR', 'USD'].includes(currency)) {
      throw new Error('Invalid currency');
    }
    Object.freeze(this);  // Immutable
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.amount + other.amount, this.currency);  // Return new instance
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

class Email {
  constructor(readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email format');
    }
    Object.freeze(this);
  }

  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### 3.3 Aggregate & Aggregate Root

> **ELI5:** Aggregate adalah "cluster" objek yang harus konsisten bersama-sama. Aggregate Root adalah "pintu masuk" satu-satunya - seperti resepsionis yang mengatur siapa boleh masuk ke kantor.

**Aturan Invariant (WAJIB DIHAFAL):**

| Aturan | Penjelasan |
|--------|------------|
| **1. Satu transaksi = satu aggregate** | Jangan update 2 aggregate dalam 1 transaksi DB |
| **2. Akses hanya via Root** | Tidak boleh akses `OrderItem` langsung, harus via `Order` |
| **3. Root menjaga konsistensi** | Semua validasi bisnis ada di Root |
| **4. Reference by ID** | Aggregate lain direferensi via ID, bukan object reference |

```typescript
// ══════════════════════════════════════════════════
//                ORDER AGGREGATE
// ══════════════════════════════════════════════════
// Order = Aggregate Root
// OrderItem = Entity dalam Aggregate (tidak bisa diakses langsung)
// Money, Address = Value Objects

class Order {  // ← AGGREGATE ROOT
  private items: OrderItem[] = [];
  private status: OrderStatus = OrderStatus.DRAFT;

  constructor(
    private readonly id: OrderId,
    private readonly customerId: CustomerId,  // Reference by ID!
    private shippingAddress: Address
  ) {}

  // ═══════════ BEHAVIOR (bukan getter/setter) ═══════════

  addItem(productId: ProductId, quantity: number, price: Money): void {
    // Invariant: tidak bisa tambah item jika sudah disubmit
    if (this.status !== OrderStatus.DRAFT) {
      throw new Error('Cannot modify submitted order');
    }
    
    // Invariant: maksimal 10 item per order
    if (this.items.length >= 10) {
      throw new Error('Maximum 10 items per order');
    }

    const existingItem = this.items.find(i => i.productId.equals(productId));
    if (existingItem) {
      existingItem.increaseQuantity(quantity);
    } else {
      this.items.push(new OrderItem(productId, quantity, price));
    }
  }

  submit(): void {
    // Invariant: minimal 1 item untuk submit
    if (this.items.length === 0) {
      throw new Error('Cannot submit empty order');
    }
    this.status = OrderStatus.SUBMITTED;
  }

  getTotal(): Money {
    return this.items.reduce(
      (sum, item) => sum.add(item.getSubtotal()),
      new Money(0, 'IDR')
    );
  }
}

class OrderItem {  // ← ENTITY dalam Aggregate (BUKAN Root)
  constructor(
    readonly productId: ProductId,
    private quantity: number,
    private unitPrice: Money
  ) {}

  increaseQuantity(amount: number): void {
    this.quantity += amount;
  }

  getSubtotal(): Money {
    return new Money(
      this.unitPrice.amount * this.quantity,
      this.unitPrice.currency
    );
  }
}
```

### 3.4 Domain Service

> **ELI5:** Ketika suatu operasi tidak "milik" satu Entity/Aggregate tertentu, taruh di Domain Service. Contoh: transfer uang melibatkan 2 Account, jadi tidak cocok di salah satu Account.

**Kapan pakai Domain Service:**
- Operasi melibatkan multiple aggregates
- Logika bisnis yang tidak natural di Entity manapun
- Stateless (tidak menyimpan state)

```typescript
class MoneyTransferService {  // Domain Service
  transfer(
    from: Account,
    to: Account,
    amount: Money
  ): void {
    // Business rule: tidak bisa transfer ke diri sendiri
    if (from.id.equals(to.id)) {
      throw new Error('Cannot transfer to same account');
    }

    from.withdraw(amount);
    to.deposit(amount);
  }
}

class PricingService {  // Domain Service
  calculateDiscount(
    order: Order,
    customer: Customer,
    promos: Promotion[]
  ): Money {
    // Complex pricing logic involving multiple aggregates
    let discount = new Money(0, 'IDR');
    
    if (customer.isVIP()) {
      discount = discount.add(order.getTotal().multiply(0.1));
    }
    
    for (const promo of promos) {
      if (promo.isApplicable(order)) {
        discount = discount.add(promo.calculate(order));
      }
    }
    
    return discount;
  }
}
```

### 3.5 Repository

> **ELI5:** Abstraksi untuk menyimpan dan mengambil Aggregate. Domain tidak tahu (dan tidak peduli) apakah data disimpan di PostgreSQL, MongoDB, atau file text.

**Aturan:**
- Satu Repository per Aggregate Root
- Interface di Domain Layer, implementasi di Infrastructure
- Hanya untuk Aggregate Root (tidak ada `OrderItemRepository`)

```typescript
// ═══════════ DOMAIN LAYER (Interface) ═══════════
interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  findByCustomer(customerId: CustomerId): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(order: Order): Promise<void>;
}

// ═══════════ INFRASTRUCTURE LAYER (Implementation) ═══════════
class PrismaOrderRepository implements OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: OrderId): Promise<Order | null> {
    const data = await this.prisma.order.findUnique({
      where: { id: id.value },
      include: { items: true }
    });
    return data ? this.toDomain(data) : null;
  }

  async save(order: Order): Promise<void> {
    await this.prisma.order.upsert({
      where: { id: order.id.value },
      create: this.toPersistence(order),
      update: this.toPersistence(order)
    });
  }

  private toDomain(data: PrismaOrder): Order {
    // Mapping dari DB model ke Domain model
  }

  private toPersistence(order: Order): PrismaOrderData {
    // Mapping dari Domain model ke DB model
  }
}
```

### 3.6 Domain Events

> **ELI5:** "Pengumuman" bahwa sesuatu yang penting sudah terjadi di domain. Contoh: "Order sudah dibuat!" - siapapun yang peduli bisa bereaksi (kirim email, update inventory, dll).

**Kapan pakai Domain Events:**
- Trigger side effects tanpa coupling
- Komunikasi antar Bounded Context
- Audit trail

```typescript
// ═══════════ EVENT DEFINITION ═══════════
abstract class DomainEvent {
  readonly occurredAt: Date = new Date();
  abstract readonly eventType: string;
}

class OrderPlacedEvent extends DomainEvent {
  readonly eventType = 'ORDER_PLACED';
  
  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly totalAmount: number
  ) {
    super();
  }
}

// ═══════════ AGGREGATE ROOT DENGAN EVENTS ═══════════
class Order {
  private domainEvents: DomainEvent[] = [];

  submit(): void {
    if (this.items.length === 0) {
      throw new Error('Cannot submit empty order');
    }
    
    this.status = OrderStatus.SUBMITTED;
    
    // Raise event
    this.addDomainEvent(new OrderPlacedEvent(
      this.id.value,
      this.customerId.value,
      this.getTotal().amount
    ));
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }
}

// ═══════════ EVENT HANDLER ═══════════
class SendOrderConfirmationHandler {
  constructor(private mailService: MailService) {}

  handle(event: OrderPlacedEvent): void {
    this.mailService.send({
      to: event.customerId,
      subject: 'Order Confirmation',
      body: `Your order ${event.orderId} has been placed!`
    });
  }
}
```

---

## 4. The Workflow (Application Service)

> **ELI5:** Application Service adalah "konduktor orkestra". Dia tidak main musik (business logic), tapi mengatur siapa main kapan.

**Tanggung jawab Application Service:**
- Orchestration (koordinasi antar komponen)
- Transaction management
- Authorization
- DTO conversion
- Event dispatching

**BUKAN tanggung jawab Application Service:**
- Business logic (itu di Domain)
- Database query langsung (itu di Repository)

```typescript
class PlaceOrderUseCase {  // Application Service / Use Case
  constructor(
    private orderRepo: OrderRepository,
    private customerRepo: CustomerRepository,
    private eventBus: EventBus,
    private unitOfWork: UnitOfWork
  ) {}

  async execute(command: PlaceOrderCommand): Promise<PlaceOrderResult> {
    // 1. Load aggregates
    const customer = await this.customerRepo.findById(
      new CustomerId(command.customerId)
    );
    if (!customer) {
      throw new CustomerNotFoundError(command.customerId);
    }

    // 2. Execute domain logic
    const order = new Order(
      OrderId.generate(),
      customer.id,
      new Address(command.shippingAddress)
    );

    for (const item of command.items) {
      order.addItem(
        new ProductId(item.productId),
        item.quantity,
        new Money(item.price, 'IDR')
      );
    }

    order.submit();  // Domain logic happens here!

    // 3. Persist
    await this.unitOfWork.execute(async () => {
      await this.orderRepo.save(order);
    });

    // 4. Dispatch domain events
    const events = order.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // 5. Return result
    return {
      orderId: order.id.value,
      total: order.getTotal().amount
    };
  }
}
```

---

## 5. The Architecture (Dependency Inversion)

### Hexagonal / Clean Architecture

> **ELI5:** Domain adalah "raja" yang tidak bergantung pada siapapun. Framework, database, API - semuanya adalah "pelayan" yang bisa diganti tanpa mengganggu Domain.

```
┌───────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                        │
│  (Controllers, Repositories Impl, External Services)          │
│                                                               │
│   ┌───────────────────────────────────────────────────────┐   │
│   │                  APPLICATION LAYER                     │   │
│   │  (Use Cases, Application Services, DTOs)              │   │
│   │                                                       │   │
│   │   ┌───────────────────────────────────────────────┐   │   │
│   │   │              DOMAIN LAYER                      │   │   │
│   │   │  (Entities, Value Objects, Domain Services,   │   │   │
│   │   │   Repository Interfaces, Domain Events)       │   │   │
│   │   │                                               │   │   │
│   │   │        🏰 TIDAK ADA DEPENDENCY KELUAR 🏰       │   │   │
│   │   └───────────────────────────────────────────────┘   │   │
│   │                         ↑                             │   │
│   │               depends on domain                       │   │
│   └───────────────────────────────────────────────────────┘   │
│                             ↑                                 │
│                   depends on application                      │
└───────────────────────────────────────────────────────────────┘
```

### Dependency Rule

```typescript
// ═══════════ DOMAIN LAYER ═══════════
// Tidak import apapun dari layer luar!

interface OrderRepository {           // Interface di Domain
  save(order: Order): Promise<void>;
}

class Order {                         // Entity murni
  // No Prisma, No NestJS, No Express
}

// ═══════════ APPLICATION LAYER ═══════════
// Hanya import dari Domain

import { Order, OrderRepository } from '../domain';

class PlaceOrderUseCase {
  constructor(private orderRepo: OrderRepository) {}  // Depend on interface
}

// ═══════════ INFRASTRUCTURE LAYER ═══════════
// Implement interface dari Domain

import { OrderRepository } from '../../domain';
import { PrismaClient } from '@prisma/client';  // External dependency OK di sini

class PrismaOrderRepository implements OrderRepository {
  // Implementation
}
```

### Folder Structure (NestJS Example)

```
src/
├── modules/
│   └── order/
│       ├── domain/                    # 🏰 DOMAIN LAYER
│       │   ├── entities/
│       │   │   ├── order.entity.ts
│       │   │   └── order-item.entity.ts
│       │   ├── value-objects/
│       │   │   ├── money.vo.ts
│       │   │   └── order-id.vo.ts
│       │   ├── events/
│       │   │   └── order-placed.event.ts
│       │   ├── services/
│       │   │   └── pricing.service.ts
│       │   └── repositories/
│       │       └── order.repository.ts      # Interface only!
│       │
│       ├── application/               # 📋 APPLICATION LAYER
│       │   ├── commands/
│       │   │   └── place-order.command.ts
│       │   ├── queries/
│       │   │   └── get-order.query.ts
│       │   ├── use-cases/
│       │   │   └── place-order.use-case.ts
│       │   └── dto/
│       │       └── order.dto.ts
│       │
│       └── infrastructure/            # 🔧 INFRASTRUCTURE LAYER
│           ├── persistence/
│           │   └── prisma-order.repository.ts  # Implementation
│           ├── controllers/
│           │   └── order.controller.ts
│           └── order.module.ts
```

---

## 6. Checklist: Apakah DDD Anda Sudah Benar?

### ✅ Strategic Design

| # | Pertanyaan | Tanda Bahaya |
|---|------------|--------------|
| 1 | Apakah tim dan domain expert menggunakan bahasa yang sama? | Developer bilang "user", PM bilang "customer", kode bilang "account" |
| 2 | Apakah setiap Bounded Context punya model sendiri? | Satu "mega model" dipakai di mana-mana |
| 3 | Apakah Context Map terdokumentasi? | Tidak ada yang tahu siapa depend ke siapa |

### ✅ Tactical Design

| # | Pertanyaan | Tanda Bahaya |
|---|------------|--------------|
| 4 | Apakah Entity punya behavior, bukan hanya getter/setter? | Class penuh dengan `getName()`, `setName()` |
| 5 | Apakah Value Object immutable? | `money.amount = 100` bisa dilakukan |
| 6 | Apakah akses ke child entity hanya via Aggregate Root? | `orderItemRepository.save(item)` ada di kode |
| 7 | Apakah satu transaksi hanya mengubah satu Aggregate? | Satu use case memanggil `save()` untuk 3 aggregate |
| 8 | Apakah Aggregate mereferensi Aggregate lain via ID? | `Order` punya property `customer: Customer` (object langsung) |
| 9 | Apakah Repository hanya untuk Aggregate Root? | Ada `AddressRepository`, `OrderItemRepository` |

### ✅ Architecture

| # | Pertanyaan | Tanda Bahaya |
|---|------------|--------------|
| 10 | Apakah Domain Layer bebas dari framework? | `import { Injectable } from '@nestjs/common'` di Entity |
| 11 | Apakah Repository adalah interface di Domain? | Domain langsung import `PrismaClient` |
| 12 | Apakah business logic ada di Domain, bukan Application? | Use case penuh dengan `if-else` business rules |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    DDD BUILDING BLOCKS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ENTITY            = Identity + Mutable + Behavior              │
│  VALUE OBJECT      = No Identity + Immutable + Self-validating  │
│  AGGREGATE ROOT    = Consistency Boundary + Single Entry Point  │
│  DOMAIN SERVICE    = Stateless + Cross-aggregate Logic          │
│  REPOSITORY        = Collection Abstraction (Interface!)        │
│  DOMAIN EVENT      = "Something happened" Notification          │
│  APPLICATION SVC   = Orchestration + No Business Logic          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    AGGREGATE RULES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. One transaction = One aggregate                             │
│  2. Access child only via Root                                  │
│  3. Root enforces invariants                                    │
│  4. Reference other aggregates by ID only                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    DEPENDENCY DIRECTION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Infrastructure → Application → Domain                          │
│       ↓                ↓            ↓                           │
│   (depends)        (depends)    (depends on NOTHING)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Referensi Lanjutan

| Resource | Untuk Apa |
|----------|-----------|
| **"Domain-Driven Design" - Eric Evans** | Buku asli, wajib baca |
| **"Implementing DDD" - Vaughn Vernon** | Lebih praktikal |
| **"Learning Domain-Driven Design" - Vlad Khononov** | Modern, mudah dicerna |
| **github.com/ddd-crew** | Templates dan cheat sheets |
