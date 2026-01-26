# User Domain Layer Documentation

**Last Updated:** January 27, 2026  
**Status:** ✅ Complete & Proper

---

## 📋 Overview

Domain layer adalah jantung dari business logic. Layer ini **TIDAK BOLEH** memiliki dependency ke infrastructure (Prisma, NestJS decorators, database, external services).

**Principles:**
- ✅ Pure TypeScript (no framework dependencies)
- ✅ Framework-agnostic (can be used outside NestJS)
- ✅ Testable without database or external services
- ✅ Contains business rules and validation
- ✅ Self-documenting through clear interfaces

---

## 🗂️ Structure

```
domain/
├── entities/                    # Business models
│   └── user.entity.ts
├── errors/                      # Domain exceptions
│   ├── index.ts
│   ├── user-not-found.error.ts
│   ├── user-email-already-exists.error.ts
│   └── ... (34 total error types)
├── repositories/                # Repository contracts (interfaces)
│   ├── index.ts
│   ├── tokens.ts
│   ├── user.repository.interface.ts
│   └── user-query.repository.interface.ts
├── types/                       # Business types
│   ├── create-user-params.type.ts
│   └── update-user-params.type.ts
└── index.ts                     # Barrel export
```

---

## 🏗️ Components

### 1. **Entities** (`entities/`)

**What:** Business models with behavior (methods).

**Rules:**
- ✅ Can have computed properties (getters)
- ✅ Can have business logic methods
- ✅ Can use `class-transformer` decorators for serialization
- ❌ NO Prisma types
- ❌ NO database-specific logic

**Example:**
```typescript
export class UserEntity {
  id: string;
  email: string;
  firstName?: string;
  
  // ✅ Computed property (business logic)
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
  
  // ✅ Business method
  get isActive(): boolean {
    return this.status === 'active';
  }
  
  // ❌ WRONG: Database logic
  // toPrisma() { } // NO!
}
```

---

### 2. **Errors** (`errors/`)

**What:** Domain-specific exceptions.

**Rules:**
- ✅ Extend `DomainError` base class
- ✅ Use semantic error codes
- ✅ Include helpful context (field, value)
- ❌ NO HTTP status codes (that's presentation concern)

**Example:**
```typescript
export class UserNotFoundError extends DomainError {
  constructor(context: { field: string; value: string }) {
    super('User not found', UserErrorCode.USER_NOT_FOUND, context);
  }
}
```

**Why 34 Error Types?**
- ✅ Clear error semantics
- ✅ Easy to handle specific cases
- ✅ Type-safe error handling
- ✅ Self-documenting API

---

### 3. **Repository Interfaces** (`repositories/`)

**What:** Contracts for data access (NOT implementations).

**Two Interfaces:**

#### **A. `IUserRepository` - Write Operations**

**Purpose:** CRUD operations returning domain entities

**Returns:** `UserEntity` (full domain object)

**Used by:** 
- `UsersService` (business logic)
- Any service that needs to manipulate user data

**Methods:**
```typescript
interface IUserRepository {
  // Queries (return domain entities)
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(params: FindAllUsersParams): Promise<PaginatedResult<UserEntity>>;
  existsByEmail(email: string): Promise<boolean>;
  
  // Commands (mutations)
  create(data: CreateUserParams, tx?: TransactionClient): Promise<UserEntity>;
  update(id: string, data: UpdateUserParams): Promise<UserEntity>;
  updatePassword(id: string, hashedPassword: string, tx?: TransactionClient): Promise<void>;
  upsertOAuthUser(data: UpsertOAuthUserData): Promise<UserEntity>;
  clearRefreshTokens(userId: string, tx?: TransactionClient): Promise<boolean>;
  markEmailAsVerified(userId: string, tx?: TransactionClient): Promise<Pick<UserEntity, ...>>;
  softDelete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
}
```

**Key Features:**
- ✅ Supports transactions (`tx?: TransactionClient`)
- ✅ Returns domain entities (for business logic)
- ✅ Throws domain exceptions

---

#### **B. `IUserQueryRepository` - Read-Only Operations**

**Purpose:** Optimized read queries returning DTOs (NOT domain entities)

**Returns:** DTOs (plain objects, no methods)

**Used by:**
- `AuthService` (authentication)
- `JwtStrategy` (token validation)
- Controllers (for display data)

**Methods:**
```typescript
interface IUserQueryRepository {
  // Auth-specific queries
  findByIdForAuth(id: string): Promise<UserAuthDto | null>;
  findByEmailForAuth(email: string): Promise<UserAuthWithPasswordDto | null>;
  existsByEmail(email: string): Promise<boolean>;
  
  // Projection queries (optimized)
  findUserProfile(id: string): Promise<UserProfileDto | null>;
  findUserListItem(id: string): Promise<UserListItemDto | null>;
  findUserAvatar(id: string): Promise<string | null>;
  
  // Batch queries
  findManyByIds(ids: string[]): Promise<UserListItemDto[]>;
}
```

**DTOs Included:**
- `UserAuthDto` - For JWT validation
- `UserAuthWithPasswordDto` - For login
- `UserProfileDto` - For profile display
- `UserListItemDto` - For lists/tables

**Key Features:**
- ✅ No domain entities (prevents leakage)
- ✅ Optimized field selection
- ✅ Read-only (no mutations)
- ✅ Auth-focused

---

### 4. **Types** (`types/`)

**What:** Business data structures (not Prisma types).

**Rules:**
- ✅ Define business requirements
- ✅ Use TypeScript types/interfaces
- ❌ NO Prisma-specific types

**Files:**

#### `CreateUserParams`
Defines **what data is required** to create a user (business rule)

```typescript
type CreateUserParams = {
  email: string;       // Required
  password?: string;   // Optional (OAuth users don't have password)
  firstName: string;
  lastName: string;
  gender: Gender;
  emailVerified?: boolean;
  provider?: AuthProvider;
  role?: Role;
  status?: UserStatus;
  address?: { ... };   // Nested creation
};
```

#### `UpdateUserParams`
Defines **what fields can be updated** (business rule)

```typescript
type UpdateUserParams = Partial<Omit<CreateUserParams, 'address' | 'email'>>;
```

**Why `email` not updatable?**
- Business rule: Email is immutable identifier
- Security: Prevents account hijacking

---

## 🎯 Usage Examples

### **Example 1: Service Using Repository**

```typescript
@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) 
    private readonly userRepo: IUserRepository
  ) {}
  
  async createUser(data: CreateUserParams): Promise<UserEntity> {
    // ✅ Service has business logic
    if (!this.isValidEmail(data.email)) {
      throw new UserEmailInvalidError(data.email);
    }
    
    // ✅ Repository handles persistence
    return this.userRepo.create(data);
  }
  
  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findById(id);
    
    if (!user) {
      throw new UserNotFoundError({ field: 'id', value: id });
    }
    
    return user; // ✅ Returns domain entity
  }
}
```

---

### **Example 2: Auth Using Query Repository**

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQuery: IUserQueryRepository
  ) {
    super({ ... });
  }
  
  async validate(payload: JwtPayload): Promise<UserAuthDto> {
    // ✅ Returns DTO, NOT domain entity
    const user = await this.userQuery.findByIdForAuth(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException();
    }
    
    if (user.status !== 'active') {
      throw new UnauthorizedException('User is not active');
    }
    
    return user; // ✅ UserAuthDto (read-only)
  }
}
```

---

### **Example 3: Transaction Support**

```typescript
async registerUser(dto: RegisterDto): Promise<UserEntity> {
  return this.prisma.$transaction(async (tx) => {
    // ✅ Pass transaction to repository
    const user = await this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      // ...
    }, tx);
    
    // Create audit log in same transaction
    await this.auditRepo.create({
      action: 'USER_CREATED',
      userId: user.id,
    }, tx);
    
    return user;
  });
}
```

---

## 🚫 Common Mistakes

### ❌ **Mistake 1: Returning Domain Entity from Query Repo**

```typescript
// ❌ WRONG
interface IUserQueryRepository {
  findByIdForAuth(id: string): Promise<UserEntity | null>; // ❌
}

// ✅ CORRECT
interface IUserQueryRepository {
  findByIdForAuth(id: string): Promise<UserAuthDto | null>; // ✅
}
```

**Why wrong?**
- Query repo should return DTOs, not domain entities
- Auth doesn't need domain methods (`fullName`, `isAdult`, etc.)
- Performance: DTO can have fewer fields

---

### ❌ **Mistake 2: Putting Prisma Types in Domain**

```typescript
// ❌ WRONG
import { Prisma } from '@prisma/client';

type CreateUserParams = Prisma.UserCreateInput; // ❌

// ✅ CORRECT
type CreateUserParams = {
  email: string;
  password?: string;
  // ... pure business fields
};
```

**Why wrong?**
- Domain should be framework-agnostic
- Can't change ORM without rewriting domain

---

### ❌ **Mistake 3: Business Logic in Repository Interface**

```typescript
// ❌ WRONG
interface IUserRepository {
  canUserLogin(id: string): Promise<boolean>; // ❌ Business logic
}

// ✅ CORRECT
class UsersService {
  async canUserLogin(userId: string): Promise<boolean> { // ✅ In service
    const user = await this.userRepo.findById(userId);
    return user.isActive && user.emailVerified; // Business rule
  }
}
```

**Why wrong?**
- Repository = data access only
- Business logic belongs in service

---

## ✅ Benefits of This Structure

| Aspect | Benefit |
|--------|---------|
| **Testability** | ✅ Mock interfaces easily |
| **Maintainability** | ✅ Clear separation of concerns |
| **Flexibility** | ✅ Change infrastructure without touching domain |
| **Type Safety** | ✅ Full TypeScript support |
| **Documentation** | ✅ Self-documenting through interfaces |
| **Performance** | ✅ Query repo optimized for specific use cases |
| **Security** | ✅ Auth uses read-only DTOs |

---

## 📝 Next Steps

1. ✅ **DONE:** Define repository interfaces
2. ⏳ **TODO:** Implement repositories in `infrastructure/`
3. ⏳ **TODO:** Update `UsersService` to use repositories
4. ⏳ **TODO:** Update `AuthService` to use query repository
5. ⏳ **TODO:** Remove `PrismaService` from service layer

---

## 📚 Related Documentation

- [INCREMENTAL_REFACTOR_PLAN.md](../../INCREMENTAL_REFACTOR_PLAN.md) - Overall refactor strategy
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html) - Martin Fowler
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/) - Eric Evans

---

**Remember:** Domain is the **core** of your application. Keep it pure, testable, and framework-agnostic! 🎯
