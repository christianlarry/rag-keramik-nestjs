# Products Domain Layer - Tile Ceramics E-Commerce

> **Context**: Products Bounded Context  
> **Architecture**: Domain-Driven Design (DDD)  
> **Pattern**: Clean Architecture / Hexagonal Architecture

Dokumentasi ini menjelaskan implementasi domain layer untuk modul Products dalam aplikasi e-commerce ubin keramik lantai.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Domain Model](#domain-model)
3. [Value Objects](#value-objects)
4. [Domain Enums](#domain-enums)
5. [Domain Errors](#domain-errors)
6. [Domain Events](#domain-events)
7. [Repository Interface](#repository-interface)
8. [Product Entity](#product-entity)
9. [Business Rules](#business-rules)
10. [Usage Examples](#usage-examples)

---

## 🎯 Overview

Products domain layer bertanggung jawab untuk:
- **Product Lifecycle**: Create, update, activate, deactivate, discontinue
- **Price Management**: Track and update product prices with history
- **Status Transitions**: Manage product availability states
- **Tile-Specific Attributes**: Handle ceramic tile characteristics (size, grade, finishing, etc.)
- **Business Rules Enforcement**: Ensure product data integrity and valid state transitions

---

## 📦 Domain Model

### Core Concepts

```
┌─────────────────────────────────────────────────┐
│              Product (Aggregate Root)            │
├─────────────────────────────────────────────────┤
│  - ProductId (unique identifier)                │
│  - SKU (stock keeping unit)                     │
│  - ProductName                                  │
│  - Price (amount + currency)                    │
│  - ProductAttributes (tile-specific)            │
│  - ProductStatus (lifecycle state)              │
│  - TilePerBox (quantity)                        │
│  - Brand, Description, Image                    │
└─────────────────────────────────────────────────┘
```

### Tile Ceramic Attributes

As a tile ceramic e-commerce platform, products have specialized attributes:

- **Size**: Dimensions (e.g., "40x40", "60x60", "30x60" cm)
- **Grade**: Quality classification (Premium, Grade A, B, C)
- **Finishing**: Surface type (Glossy, Matte, Polished, Rustic, etc.)
- **Application Areas**: Usage locations (Floor, Wall, Bathroom, Kitchen, Outdoor, etc.)
- **Anti-Slip Rating**: Safety rating (R9-R13)
- **Water Absorption**: Percentage (important for outdoor/bathroom tiles)
- **Thickness**: In millimeters
- **PEI Rating**: Wear resistance (1-5)
- **Color & Pattern**: Aesthetic attributes
- **Frost Resistant**: For outdoor use

---

## 🧩 Value Objects

### 1. **ProductId**

Unique identifier for products using UUID v4.

```typescript
const productId = ProductId.create(); // Generate new
const productId = ProductId.create('existing-uuid'); // From existing
```

### 2. **SKU (Stock Keeping Unit)**

Unique product code for inventory management.

**Validation Rules**:
- Alphanumeric characters, hyphens, underscores only
- Automatically converted to uppercase
- Max length: 100 characters

```typescript
const sku = SKU.create('TILE-40X40-GLO-001');
```

### 3. **ProductName**

Product display name.

**Validation Rules**:
- Cannot be empty
- Max length: 500 characters
- Trimmed automatically

```typescript
const name = ProductName.create('Glossy Ceramic Floor Tile 40x40cm');
```

### 4. **Price**

Monetary value with currency.

**Validation Rules**:
- Cannot be negative
- Must be finite number
- Rounded to 2 decimal places
- Supports multiple currencies (IDR, USD, EUR, SGD, MYR)

**Features**:
- Currency validation
- Price comparison (same currency only)
- Arithmetic operations (add, subtract, multiply)

```typescript
const price = Price.create(150000, 'IDR');
const isExpensive = price.isGreaterThan(otherPrice);
const discounted = price.multiply(0.8); // 20% discount
```

### 5. **ProductAttributes**

Tile-specific characteristics stored as structured JSON.

**Type-Safe Interface**:
```typescript
interface TileAttributes {
  size?: string;               // "40x40", "60x60"
  grade?: 'PREMIUM' | 'GRADE_A' | 'GRADE_B' | 'GRADE_C';
  finishing?: 'GLOSSY' | 'MATTE' | 'POLISHED' | ...;
  applicationAreas?: string[]; // ['FLOOR', 'BATHROOM']
  antiSlipRating?: string;     // 'R9', 'R10', etc.
  waterAbsorption?: string;    // '0.5%'
  thickness?: number;          // in mm
  color?: string;
  pattern?: string;
  isOutdoor?: boolean;
  frostResistant?: boolean;
  peiRating?: number;          // 1-5
  [key: string]: unknown;      // Extensible
}
```

**Validation**:
- Size format: "WIDTHxHEIGHT" (e.g., "40x40")
- Anti-slip rating: R9-R13 only
- PEI rating: 1-5 only
- Thickness: must be > 0

```typescript
const attributes = ProductAttributes.create({
  size: '60x60',
  grade: 'PREMIUM',
  finishing: 'GLOSSY',
  applicationAreas: ['FLOOR', 'COMMERCIAL'],
  antiSlipRating: 'R10',
  thickness: 10,
  peiRating: 4,
});

const size = attributes.getSize(); // "60x60"
const grade = attributes.getGrade(); // "PREMIUM"
```

---

## 🔢 Domain Enums

### 1. **ProductStatus**

Product lifecycle states with transition rules.

**States**:
- `ACTIVE`: Available for purchase
- `INACTIVE`: Temporarily unavailable
- `OUT_OF_STOCK`: No inventory available
- `DISCONTINUED`: Permanently removed (terminal state)

**Transition Rules**:
```
ACTIVE → INACTIVE, OUT_OF_STOCK, DISCONTINUED
INACTIVE → ACTIVE, DISCONTINUED
OUT_OF_STOCK → ACTIVE, DISCONTINUED
DISCONTINUED → (no transitions, terminal)
```

```typescript
const status = ProductStatus.ACTIVE;
const canChange = status.canTransitionTo(ProductStatus.INACTIVE); // true
```

### 2. **FinishingType**

Surface finishing types for tiles.

**Values**: `GLOSSY`, `MATTE`, `POLISHED`, `RUSTIC`, `TEXTURED`, `SEMI_POLISHED`, `NATURAL`

```typescript
const finishing = FinishingType.create('GLOSSY');
```

### 3. **Grade**

Quality classification for tiles.

**Values**: `PREMIUM`, `GRADE_A`, `GRADE_B`, `GRADE_C`

```typescript
const grade = Grade.create('PREMIUM');
const isPremium = grade.isPremium(); // true
```

### 4. **ApplicationArea**

Where the tile can be used.

**Values**: `FLOOR`, `WALL`, `OUTDOOR`, `BATHROOM`, `KITCHEN`, `COMMERCIAL`, `RESIDENTIAL`, `POOL`, `FACADE`

```typescript
const area = ApplicationArea.create('BATHROOM');
```

---

## ❌ Domain Errors

All errors extend `DomainError` base class and have unique error codes.

### Error Codes

```typescript
ProductErrorCode = {
  // Validation
  INVALID_SKU
  INVALID_PRICE
  INVALID_NAME
  INVALID_ATTRIBUTES
  INVALID_STATUS
  
  // Business Rules
  PRODUCT_NOT_FOUND
  PRODUCT_ALREADY_EXISTS
  SKU_ALREADY_EXISTS
  INVALID_STATUS_TRANSITION
  PRODUCT_IS_DISCONTINUED
  PRODUCT_IS_INACTIVE
  PRODUCT_OUT_OF_STOCK
  
  // Price
  PRICE_CANNOT_BE_NEGATIVE
  PRICE_CHANGE_TOO_LARGE
  
  // Tile Attributes
  INVALID_TILE_SIZE
  INVALID_GRADE
  INVALID_FINISHING
  INVALID_APPLICATION_AREA
  
  // Operations
  CANNOT_DELETE_PRODUCT
  CANNOT_UPDATE_PRODUCT
}
```

### Usage

```typescript
throw new InvalidSKUError(sku, 'SKU must be alphanumeric');
throw new ProductNotFoundError(productId);
throw new InvalidStatusTransitionError('DISCONTINUED', 'ACTIVE');
```

---

## 📢 Domain Events

Events emitted during product lifecycle for decoupled side effects (cache invalidation, search index updates, notifications, etc.).

### Events List

| Event | Trigger | Payload |
|-------|---------|---------|
| `ProductCreatedEvent` | New product created | productId, sku, name, price, status |
| `ProductUpdatedEvent` | Product info updated | productId, sku, changes{} |
| `ProductDeletedEvent` | Product deleted | productId, sku, name |
| `ProductActivatedEvent` | Product activated | productId, sku, previousStatus |
| `ProductDeactivatedEvent` | Product deactivated | productId, sku, previousStatus, reason |
| `ProductDiscontinuedEvent` | Product discontinued | productId, sku, name, previousStatus, reason |
| `ProductPriceChangedEvent` | Price updated | productId, sku, oldPrice, newPrice, currency |
| `ProductOutOfStockEvent` | Marked out of stock | productId, sku, name, previousStatus |
| `ProductBackInStockEvent` | Back in stock | productId, sku, name |
| `ProductImageUpdatedEvent` | Image changed | productId, sku, oldImageUrl, newImageUrl |

### Event Names Convention

All events use dot notation:
- `product.created`
- `product.updated`
- `product.price_changed`
- etc.

### Usage Example

```typescript
// Events automatically emitted by entity methods
const product = Product.create({ /* params */ });
product.updatePrice(200000);
product.discontinue('No longer manufactured');

// Get uncommitted events
const events = product.getUncommittedEvents();
// [ProductCreatedEvent, ProductPriceChangedEvent, ProductDiscontinuedEvent]
```

---

## 🗄️ Repository Interface

Interface untuk persistence (implementasi di infrastructure layer).

```typescript
interface ProductRepository {
  findById(productId: ProductId): Promise<Product | null>;
  findBySKU(sku: SKU): Promise<Product | null>;
  findByCriteria(criteria: ProductSearchCriteria): Promise<Product[]>;
  findAllActive(): Promise<Product[]>;
  findByBrand(brand: string): Promise<Product[]>;
  findByStatus(status: ProductStatus): Promise<Product[]>;
  existsBySKU(sku: SKU): Promise<boolean>;
  save(product: Product): Promise<void>;
  delete(productId: ProductId): Promise<void>;
  count(criteria: ProductSearchCriteria): Promise<number>;
  countAll(): Promise<number>;
}
```

### Search Criteria

```typescript
interface ProductSearchCriteria {
  sku?: string;
  name?: string;
  brand?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  // Tile-specific
  size?: string;
  grade?: string;
  finishing?: string;
  applicationArea?: string;
  // Pagination
  skip?: number;
  take?: number;
}
```

---

## 🏗️ Product Entity

Aggregate root untuk Products bounded context.

### Factory Methods

#### Create New Product

```typescript
const product = Product.create({
  sku: 'TILE-60X60-GLO-001',
  name: 'Premium Glossy Floor Tile 60x60cm',
  description: 'High-quality glossy ceramic floor tile',
  brand: 'Ceramica Indonesia',
  price: 250000,
  currency: 'IDR',
  tilePerBox: 4,
  attributes: {
    size: '60x60',
    grade: 'PREMIUM',
    finishing: 'GLOSSY',
    applicationAreas: ['FLOOR', 'COMMERCIAL'],
    antiSlipRating: 'R10',
    thickness: 10,
    peiRating: 4,
    isOutdoor: false,
  },
});

// Events emitted: ProductCreatedEvent
```

#### Reconstruct from Persistence

```typescript
const product = Product.reconstruct({
  id: ProductId.create('uuid'),
  sku: SKU.create('TILE-60X60-GLO-001'),
  name: ProductName.create('Premium Glossy Floor Tile'),
  // ... other props
});
```

### Query Methods

#### Basic Info

```typescript
product.getId(): ProductId
product.getSKU(): SKU
product.getName(): ProductName
product.getDescription(): string | null
product.getBrand(): string | null
product.getImageUrl(): string | null
product.getPrice(): Price
product.getTilePerBox(): number
product.getAttributes(): ProductAttributes
product.getStatus(): ProductStatus
product.getCreatedAt(): Date
product.getUpdatedAt(): Date
```

#### Status Checks

```typescript
product.isActive(): boolean
product.isInactive(): boolean
product.isDiscontinued(): boolean
product.isOutOfStock(): boolean
product.isAvailableForPurchase(): boolean
```

#### Tile-Specific Queries

```typescript
product.getSize(): string | undefined
product.getGrade(): string | undefined
product.getFinishing(): string | undefined
product.getApplicationAreas(): string[] | undefined
product.hasAttribute(key: string): boolean
product.getAttribute(key: string): unknown
```

### Command Methods

#### Update Product Info

```typescript
product.updateInfo({
  name: 'New Product Name',
  description: 'Updated description',
  brand: 'New Brand',
  imageUrl: 'https://example.com/new-image.jpg',
  tilePerBox: 5,
  attributes: {
    size: '60x60',
    grade: 'PREMIUM',
    // ... other attributes
  },
});

// Events: ProductUpdatedEvent, ProductImageUpdatedEvent
```

#### Update Price

```typescript
product.updatePrice(300000, 'IDR');

// Events: ProductPriceChangedEvent, ProductUpdatedEvent
```

#### Update Image

```typescript
product.updateImage('https://example.com/new-image.jpg');

// Event: ProductImageUpdatedEvent
```

#### Status Transitions

```typescript
// Activate
product.activate();
// Events: ProductActivatedEvent
// If from OUT_OF_STOCK: ProductBackInStockEvent

// Deactivate
product.deactivate('Seasonal product, out of season');
// Event: ProductDeactivatedEvent

// Mark out of stock
product.markAsOutOfStock();
// Event: ProductOutOfStockEvent

// Discontinue (terminal)
product.discontinue('Product line discontinued');
// Event: ProductDiscontinuedEvent

// Delete
product.delete();
// Event: ProductDeletedEvent
```

---

## 📜 Business Rules

### 1. Status Transition Rules

- **DISCONTINUED is terminal**: Once discontinued, cannot transition to any other status
- **OUT_OF_STOCK** can only go to ACTIVE (when restocked) or DISCONTINUED
- **INACTIVE** can go to ACTIVE or DISCONTINUED
- **ACTIVE** can transition to any status

### 2. Modification Rules

- **Discontinued products cannot be modified**: All update operations will throw `ProductIsDiscontinuedError`
- This includes: updateInfo, updatePrice, updateImage, activate, deactivate

### 3. SKU Rules

- **Must be unique**: SKU must be unique across all products
- **Immutable**: SKU cannot be changed after product creation
- **Format**: Alphanumeric, hyphens, underscores only

### 4. Price Rules

- **Cannot be negative**: All prices must be >= 0
- **Currency consistency**: Price comparisons only work with same currency
- **Precision**: Always rounded to 2 decimal places

### 5. Tile Attributes Rules

- **Size format**: Must follow "WIDTHxHEIGHT" pattern (e.g., "40x40")
- **Anti-slip rating**: Only R9, R10, R11, R12, R13 allowed
- **PEI rating**: Must be between 1 and 5
- **Thickness**: Must be greater than 0

---

## 💡 Usage Examples

### Example 1: Create Premium Bathroom Tile

```typescript
const bathroomTile = Product.create({
  sku: 'TILE-30X60-MAT-BATH-001',
  name: 'Premium Matte Bathroom Wall Tile',
  description: 'Water-resistant matte finish tile perfect for bathrooms',
  brand: 'AquaTile',
  price: 180000,
  currency: 'IDR',
  tilePerBox: 6,
  imageUrl: 'https://cdn.example.com/bathroom-tile.jpg',
  attributes: {
    size: '30x60',
    grade: 'PREMIUM',
    finishing: 'MATTE',
    applicationAreas: ['WALL', 'BATHROOM'],
    waterAbsorption: '0.5%',
    thickness: 8,
    color: 'White Marble',
    isOutdoor: false,
  },
});
```

### Example 2: Update Product Price with Discount

```typescript
const product = await productRepo.findBySKU(SKU.create('TILE-60X60-001'));

if (product) {
  const currentPrice = product.getPrice().getAmount();
  const discountedPrice = currentPrice * 0.85; // 15% off
  
  product.updatePrice(discountedPrice);
  
  await productRepo.save(product);
  // Event: ProductPriceChangedEvent will be emitted
}
```

### Example 3: Discontinue Old Product Line

```typescript
const oldProducts = await productRepo.findByBrand('OldBrand');

for (const product of oldProducts) {
  if (product.isActive()) {
    product.discontinue('Replacing with new product line');
    await productRepo.save(product);
    // Event: ProductDiscontinuedEvent
  }
}
```

### Example 4: Search for Outdoor Floor Tiles

```typescript
const outdoorFloorTiles = await productRepo.findByCriteria({
  status: ProductStatus.ACTIVE,
  applicationArea: 'OUTDOOR',
  minPrice: 100000,
  maxPrice: 500000,
  finishing: 'TEXTURED',
  skip: 0,
  take: 20,
});
```

### Example 5: Handle Out of Stock

```typescript
// When inventory reaches zero
const product = await productRepo.findById(productId);

if (product && product.isActive()) {
  product.markAsOutOfStock();
  await productRepo.save(product);
  // Event: ProductOutOfStockEvent
  // Listener can send notification to customers
}

// When restocked
if (product && product.isOutOfStock()) {
  product.activate();
  await productRepo.save(product);
  // Events: ProductActivatedEvent, ProductBackInStockEvent
  // Listener can notify waiting customers
}
```

---

## 🔄 Next Steps (Implementation Layers)

After completing the domain layer, implement:

### 1. **Infrastructure Layer**
- [ ] **PrismaProductRepository**: Implement ProductRepository interface
- [ ] **PrismaProductMapper**: Map between Product entity and Prisma models
- [ ] **ProductCache**: Cache utilities for performance
- [ ] **ProductElasticsearchService**: Full-text search integration (optional)

### 2. **Application Layer**
- [ ] **Use Cases**: 
  - CreateProductUseCase
  - UpdateProductUseCase
  - UpdateProductPriceUseCase
  - ActivateProductUseCase
  - DeactivateProductUseCase
  - DiscontinueProductUseCase
  - DeleteProductUseCase
  - GetProductByIdUseCase
  - GetProductBySKUUseCase
  - SearchProductsUseCase
- [ ] **Event Listeners**:
  - InvalidateProductCacheListener
  - UpdateSearchIndexListener
  - NotifyPriceChangeListener (optional)
  - NotifyBackInStockListener (optional)

### 3. **Presentation Layer (HTTP)**
- [ ] **Controllers**: ProductsController
- [ ] **DTOs**: 
  - CreateProductDto
  - UpdateProductDto
  - UpdateProductPriceDto
  - ProductResponseDto
  - ProductListResponseDto
  - SearchProductsDto
- [ ] **Guards**: AdminGuard (only admins can modify products)
- [ ] **Decorators**: Custom decorators if needed

### 4. **Module Registration**
- [ ] **products.module.ts**: Wire all components together
- [ ] Register repository implementation
- [ ] Register use cases
- [ ] Register event listeners
- [ ] Import DatabaseModule, CacheModule
- [ ] Export ProductsService (if needed)

### 5. **Testing**
- [ ] **Unit Tests**: Test all domain logic
- [ ] **Integration Tests**: Test repository implementations
- [ ] **E2E Tests**: Test API endpoints

---

## 📚 References

- [DEVELOPMENT_PATTERNS.md](../../../docs/DEVELOPMENT_PATTERNS.md) - Pattern guidelines
- [SYSTEM_DESIGN.md](../../../docs/SYSTEM_DESIGN.md) - System architecture
- [schema.prisma](../../../prisma/schema.prisma) - Database schema
- Auth Module - Reference implementation

---

**Last Updated**: February 17, 2026  
**Domain Layer Status**: ✅ **Complete**  
**Next**: Implement Infrastructure Layer
