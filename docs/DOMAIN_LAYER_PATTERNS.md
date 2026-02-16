# Domain Layer Implementation Pattern

This document outlines the proper patterns for implementing domain layer components in this NestJS application following Domain-Driven Design (DDD) and Clean Architecture principles.

## Table of Contents

- [Overview](#overview)
- [Enums](#enums)
- [Value Objects](#value-objects)
- [Domain Errors](#domain-errors)
- [Entities (Aggregate Roots)](#entities-aggregate-roots)
- [Repositories](#repositories)
- [Domain Events](#domain-events)

---

## Overview

The domain layer represents the core business logic and rules. It should be:
- **Framework-agnostic**: No dependencies on NestJS or external libraries
- **Persistent-agnostic**: No knowledge of database implementation
- **Immutable where possible**: Use value objects for immutable concepts
- **Self-validating**: Validation happens in constructors
- **Event-driven**: Emit domain events for important state changes

---

## Enums

### ✅ Correct Pattern

Enums should be exported as **const objects** with a **type export** for TypeScript typing.

```typescript
// ✅ CORRECT
export const ProductStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DISCONTINUED: 'DISCONTINUED',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
} as const;

export type ProductStatus = typeof ProductStatus[keyof typeof ProductStatus];
```

**Benefits:**
- Type-safe
- Can be used in mappers and infrastructure layer
- Doesn't instantiate class instances
- Consistent with TypeScript best practices

### ❌ Incorrect Pattern

```typescript
// ❌ WRONG - Don't use class-based enums
export class ProductStatus {
  static readonly ACTIVE = new ProductStatus('ACTIVE');
  static readonly INACTIVE = new ProductStatus('INACTIVE');
  
  private constructor(private readonly value: string) {}
  
  getValue(): string {
    return this.value;
  }
}
```

**Why it's wrong:**
- Unnecessary complexity
- Creates class instances
- Harder to use in plain mapping contexts
- Not a TypeScript idiom

---

## Value Objects

### ✅ Correct Pattern

Value objects should:
1. Have **private constructor** with validation
2. Throw **domain-specific errors** (not generic `Error`)
3. Provide **static factory methods** (`create`, `fromString`, etc.)
4. Be **immutable**
5. Implement **equals** method

```typescript
// ✅ CORRECT
import { InvalidSKUError } from '../errors';

export class SKU {
  private readonly value: string;

  private constructor(value: string) {
    const sanitized = value.trim().toUpperCase();
    
    if (!sanitized) {
      throw new InvalidSKUError('SKU cannot be empty');
    }

    if (!/^[A-Z0-9-]+$/.test(sanitized)) {
      throw new InvalidSKUError(
        'SKU must contain only alphanumeric characters and hyphens'
      );
    }

    if (sanitized.length < 3 || sanitized.length > 50) {
      throw new InvalidSKUError('SKU must be between 3 and 50 characters');
    }

    this.value = sanitized;
  }

  public static create(value: string): SKU {
    return new SKU(value);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: SKU): boolean {
    if (!other) return false;
    return this.value === other.value;
  }
}
```

**Key Points:**
- Validation in constructor
- Throws `InvalidSKUError` (domain error) not generic `Error`
- Static `create` method for instantiation
- Immutable (readonly value)
- Equals method for comparison

### ❌ Incorrect Pattern

```typescript
// ❌ WRONG - Don't throw generic Error
export class SKU {
  private readonly value: string;

  private constructor(value: string) {
    if (!value) {
      throw new Error('SKU cannot be empty'); // ❌ Generic Error
    }
    this.value = value;
  }

  // ❌ No validation beyond empty check
  // ❌ No sanitization
}
```

**Why it's wrong:**
- Uses generic `Error` instead of domain-specific error
- Missing proper validation
- No sanitization logic
- Harder to handle errors at application layer

---

## Domain Errors

### ✅ Correct Pattern

Domain errors should:
1. Extend `DomainError` base class
2. Have a **unique error code** constant
3. Accept **descriptive message** and optional **metadata**

```typescript
// ✅ CORRECT
import { DomainError } from 'src/core/domain/domain.error';

export const INVALID_SKU_ERROR = 'INVALID_SKU';

export class InvalidSKUError extends DomainError {
  constructor(message: string = 'Invalid SKU format', metadata?: unknown) {
    super(message, INVALID_SKU_ERROR, metadata);
  }
}
```

**Usage in Value Objects:**

```typescript
if (!sanitized) {
  throw new InvalidSKUError('SKU cannot be empty');
}

if (!/^[A-Z0-9-]+$/.test(sanitized)) {
  throw new InvalidSKUError(
    'SKU must contain only alphanumeric characters and hyphens'
  );
}
```

**Export Pattern:**

```typescript
// src/modules/products/domain/errors/index.ts
export * from './invalid-sku.error';
export * from './invalid-price.error';
export * from './product-not-found.error';
// ... other errors
```

---

## Entities (Aggregate Roots)

### ✅ Correct Pattern

Entities should follow this structure:

```typescript
// ✅ CORRECT
import { AggregateRoot } from 'src/core/domain/aggregate-root.base';
import { ProductId, SKU, ProductName, Price, ProductStatus } from '../value-objects';
import { ProductCreatedEvent, ProductUpdatedEvent } from '../events';

interface ProductProps {
  sku: SKU;
  name: ProductName;
  price: Price;
  status: ProductStatus;
  readonly createdAt: Date;
  updatedAt: Date;
}

export class Product extends AggregateRoot {
  private readonly _id: ProductId;
  private props: ProductProps; // ✅ Props pattern

  private constructor(id: ProductId, props: ProductProps) {
    super();
    this._id = id;
    this.props = props;
    this.validate();
  }

  // ✅ Factory method for creation
  public static create(params: CreateProductParams): Product {
    const productId = ProductId.create();
    const product = new Product(productId, {
      sku: SKU.create(params.sku),
      name: ProductName.create(params.name),
      price: Price.create(params.price),
      status: ProductStatus.createActive(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit domain event
    product.addDomainEvent(
      new ProductCreatedEvent({
        productId: productId.getValue(),
        sku: params.sku,
      })
    );

    return product;
  }

  // ✅ Reconstruct from persistence
  public static reconstruct(id: string, props: ProductProps): Product {
    return new Product(ProductId.fromString(id), props);
  }

  // ✅ Business logic methods
  public activate(): void {
    if (this.props.status.isActive()) {
      return;
    }
    
    this.props.status = ProductStatus.createActive();
    this.applyChange();
    
    this.addDomainEvent(
      new ProductActivatedEvent({ productId: this._id.getValue() })
    );
  }

  private applyChange(): void {
    this.props.updatedAt = new Date();
    this.validate();
  }

  private validate(): void {
    // Domain invariants
  }

  // ✅ Property getters (NOT function getters)
  public get id(): ProductId {
    return this._id;
  }

  public get sku(): SKU {
    return this.props.sku;
  }

  public get name(): ProductName {
    return this.props.name;
  }

  public get status(): ProductStatus {
    return this.props.status;
  }
}
```

**Key Points:**
1. **Props pattern**: `private props: ProductProps` (not individual private fields)
2. **Property getters**: `get id()` NOT `getId()`
3. **Static factory methods**: `create()` and `reconstruct()`
4. **Private constructor**: Forces use of factory methods
5. **Domain events**: Emit events for important state changes
6. **Encapsulation**: Business logic in methods, not exposed props
7. **Use Value Objects**: Import VOs, not enums directly

### ❌ Incorrect Pattern

```typescript
// ❌ WRONG
export class Product extends AggregateRoot {
  private _id: string;
  private _sku: string;
  private _name: string;
  private _status: ProductStatus; // ❌ Importing enum, not VO

  // ❌ Function getters instead of property getters
  public getId(): string {
    return this._id;
  }

  public getSKU(): string {
    return this._sku;
  }

  // ❌ No props pattern
  // ❌ No static factory methods
  // ❌ No domain events
}
```

**Why it's wrong:**
- Uses function getters (`getId()`) instead of property getters (`get id()`)
- Stores primitive strings instead of Value Objects
- Imports enum directly instead of Value Object wrapper
- No props pattern
- No factory methods
- No domain events

---

## Repositories

### ✅ Correct Pattern - CQRS Separation

Repositories should be split into **Command** (write) and **Query** (read) repositories following CQRS pattern.

#### Command Repository (Write Operations)

```typescript
// ✅ CORRECT - Command Repository
import { Product } from '../entities/product.entity';
import { ProductId, SKU } from '../value-objects';

export const PRODUCT_REPOSITORY_TOKEN = Symbol('PRODUCT_REPOSITORY');

export interface IProductRepository {
  // Returns entities for domain logic
  findById(id: ProductId): Promise<Product | null>;
  findBySKU(sku: SKU): Promise<Product | null>;
  existsBySKU(sku: SKU): Promise<boolean>;
  
  // Write operations
  save(product: Product): Promise<void>;
  delete(id: ProductId): Promise<void>;
}
```

**Key Points:**
- Returns **entities** (for domain logic)
- Uses **Value Objects** as parameters
- Only **write operations** and entity-loading for updates
- Token for dependency injection

#### Query Repository (Read Operations)

```typescript
// ✅ CORRECT - Query Repository
export const PRODUCT_QUERY_REPOSITORY_TOKEN = Symbol('PRODUCT_QUERY_REPOSITORY');

export interface FindAllProductsQuery {
  skip?: number;
  take?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListItemResult {
  id: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  status: string;
  imageUrl: string | null;
}

export interface FindAllProductsQueryResult {
  data: ProductListItemResult[];
  total: number;
}

export interface IProductQueryRepository {
  // Returns DTOs for reads
  findAllProducts(query: FindAllProductsQuery): Promise<FindAllProductsQueryResult>;
  getProductDetailById(id: string): Promise<ProductDetailResult | null>;
  searchProducts(searchTerm: string): Promise<ProductListItemResult[]>;
  count(): Promise<number>;
}
```

**Key Points:**
- Returns **DTOs** (plain objects), not entities
- Accepts **plain strings/primitives** as parameters
- Only **read operations**
- Optimized for query performance
- Separate token for dependency injection

### ❌ Incorrect Pattern

```typescript
// ❌ WRONG - Mixing command and query
export interface IProductRepository {
  // ❌ Mixing entity returns with DTO returns
  findById(id: string): Promise<Product | null>;
  findAllProducts(): Promise<ProductDTO[]>; // ❌ Query in command repo
  
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
  
  // ❌ Query methods in command repository
  searchProducts(term: string): Promise<ProductDTO[]>;
  getProductStats(): Promise<StatsDTO>;
}
```

**Why it's wrong:**
- Mixes command and query concerns
- Returns both entities and DTOs from same interface
- Violates CQRS principle
- Harder to optimize queries independently

---

## Domain Events

### ✅ Correct Pattern

Domain events should:
1. Extend `DomainEvent` base class
2. Have a **typed payload** interface
3. Be **immutable**
4. Represent **past tense** (something that happened)

```typescript
// ✅ CORRECT
import { DomainEvent } from 'src/core/domain/domain-event.base';

export interface ProductCreatedPayload {
  productId: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  status: string;
}

export class ProductCreatedEvent extends DomainEvent<ProductCreatedPayload> {
  constructor(payload: ProductCreatedPayload) {
    super(payload);
  }
}
```

**Usage in Entity:**

```typescript
public static create(params: CreateProductParams): Product {
  const product = new Product(/* ... */);
  
  product.addDomainEvent(
    new ProductCreatedEvent({
      productId: product.id.getValue(),
      sku: product.sku.getValue(),
      name: product.name.getValue(),
      price: product.price.getAmount(),
      currency: product.price.getCurrency(),
      status: product.status.getValue(),
    })
  );
  
  return product;
}
```

**Export Pattern:**

```typescript
// src/modules/products/domain/events/index.ts
export * from './product-created.event';
export * from './product-updated.event';
export * from './product-deleted.event';
// ... other events
```

---

## Summary Checklist

When implementing domain layer components, ensure:

- [ ] **Enums**: Exported as `const` with type export
- [ ] **Value Objects**: 
  - Private constructor with validation
  - Throw domain-specific errors
  - Static factory methods
  - Immutable
  - Equals method
- [ ] **Domain Errors**:
  - Extend `DomainError`
  - Unique error code constant
  - Descriptive messages
- [ ] **Entities**:
  - Props pattern (`private props: Props`)
  - Property getters (`get id()`)
  - Static factory methods (`create`, `reconstruct`)
  - Domain events for state changes
  - Use Value Objects, not primitives
- [ ] **Repositories**:
  - Separate command and query interfaces
  - Command returns entities
  - Query returns DTOs
  - Different DI tokens
- [ ] **Domain Events**:
  - Extend `DomainEvent`
  - Typed payload interface
  - Past tense naming

---

## Reference Implementation

For complete reference implementations, see:
- **Users Module**: `src/modules/users/domain/`
- **Auth Module**: `src/modules/auth/domain/`
- **Products Module**: `src/modules/products/domain/`

---

**Last Updated**: February 2026
