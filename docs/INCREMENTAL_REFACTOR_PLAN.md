# Incremental Refactor Plan: User & Auth Modules

**Date:** January 27, 2026  
**Status:** Planning Phase  
**Approach:** Pragmatic, incremental refactor (NOT full Clean Architecture)

---

## 📋 Executive Summary

**Current State:**
- ✅ `UserEntity` exists but still mixed with Prisma types
- ✅ `UserMapper` exists but incomplete (no `toPersistence`, only `toEntity`)
- ❌ Services directly depend on `PrismaService`
- ❌ `UserEntity` used in Auth (JWT strategies) - **ANTI-PATTERN**
- ❌ No repository abstraction
- ❌ Database changes cause ripple effects across services

**Goal:**
Reduce coupling between business logic and persistence, making the codebase resilient to database schema changes while keeping it maintainable for a solo developer.

**NOT Goals:**
- ❌ Full Clean Architecture
- ❌ Full CQRS with Event Sourcing
- ❌ Microservices
- ❌ Complete rewrite

---

## 🎯 Refactor Principles

### 1. **Domain Entities = Business Logic Only**
```typescript
// ✅ CORRECT: Pure domain entity
export class UserEntity {
  // No Prisma imports
  // No NestJS decorators (except class-transformer for serialization)
  // Only business methods
}
```

### 2. **Repository Pattern for Data Access**
```typescript
// ✅ CORRECT: Service depends on interface
class UsersService {
  constructor(private readonly userRepo: IUserRepository) {}
}

// ✅ CORRECT: Repository implements interface
class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}
}
```

### 3. **Auth Must Use Query DTOs, NOT Domain Entities**
```typescript
// ❌ WRONG: JWT strategy using domain entity
@Injectable()
export class JwtStrategy {
  async validate(payload: any): Promise<UserEntity> { } // ❌
}

// ✅ CORRECT: JWT strategy using read-only DTO
@Injectable()
export class JwtStrategy {
  async validate(payload: any): Promise<UserAuthDto> { } // ✅
}
```

### 4. **Selective Queries = DTOs, NOT Domain Entities**
```typescript
// ❌ WRONG: Partial domain entity from DB
async findByIdSelective<K extends keyof User>(
  id: string, 
  fields: K[]
): Promise<Pick<UserEntity, K>> { } // ❌ Mixing persistence with domain

// ✅ CORRECT: Return DTO
async findUserFields(id: string, fields: string[]): Promise<UserFieldsDto> { } // ✅
```

---

## 📝 Detailed Refactor Steps

### **Phase 1: Foundation (No Breaking Changes)**

#### Step 1.1: Create Repository Interface
**Location:** `src/modules/users/domain/repositories/user.repository.interface.ts`

**Purpose:** Define contract for user data access

**Why First?** 
- No breaking changes
- Documents the abstraction we're moving toward
- Can be implemented gradually

**Example:**
```typescript
export interface IUserRepository {
  // Query methods
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(params: FindAllParams): Promise<PaginatedResult<UserEntity>>;
  
  // Command methods
  create(user: CreateUserData): Promise<UserEntity>;
  update(id: string, data: UpdateUserData): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  
  // Special operations
  existsByEmail(email: string): Promise<boolean>;
  updatePassword(id: string, hashedPassword: string): Promise<void>;
  clearRefreshTokens(id: string): Promise<void>;
}
```

**⚠️ Critical Decision:**
- `findById` returns `UserEntity | null` (domain object for business logic)
- Auth will NOT use this - it will use `IUserQueryRepository` instead

---

#### Step 1.2: Complete UserMapper
**Location:** `src/modules/users/domain/mappers/user.mapper.ts`

**Current Issue:** Only has `toEntity`, missing `toPersistence`

**Add Missing Methods:**
```typescript
export class UserMapper {
  // ✅ Already exists
  static toEntity(user: User): UserEntity { }
  
  // ✅ Already exists
  static toEntities(users: User[]): UserEntity[] { }
  
  // ❌ MISSING: Add this
  static toPersistence(entity: UserEntity): Prisma.UserCreateInput {
    return {
      id: entity.id,
      email: entity.email,
      // ... map all fields
    };
  }
  
  // ❌ MISSING: Add this
  static toUpdateData(entity: Partial<UserEntity>): Prisma.UserUpdateInput {
    return {
      // ... map only provided fields
    };
  }
}
```

**⚠️ Important:**
- `toPersistence` returns Prisma types (allowed in mapper)
- Mapper is the ONLY place where Prisma and Domain meet

---

#### Step 1.3: Create Auth-Specific Query DTOs
**Location:** `src/modules/auth/dto/query/user-auth.dto.ts`

**Purpose:** Read-only snapshot for JWT/Auth, NOT domain entity

**Why Separate?**
- Auth doesn't need full `UserEntity` with business methods
- Prevents domain entity from leaking into auth strategies
- Smaller payload for JWT validation

**Example:**
```typescript
export class UserAuthDto {
  readonly id: string;
  readonly email: string;
  readonly role: string;
  readonly status: string;
  readonly emailVerified: boolean;
  
  // No business methods
  // No computed properties
  // Just data transfer
}
```

**Mapper:**
```typescript
// In auth module, NOT user module
export class AuthMapper {
  static toAuthDto(user: User): UserAuthDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
    };
  }
}
```

---

### **Phase 2: Implement Repository (Gradual Migration)**

#### Step 2.1: Implement UserRepository
**Location:** `src/modules/users/infrastructure/repositories/user.repository.ts`

**Purpose:** Move all Prisma calls from service to repository

**Structure:**
```typescript
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}
  
  async findById(id: string): Promise<UserEntity | null> {
    const cacheKey = UserCacheKeys.byId(id);
    
    return this.cache.wrap(cacheKey, async () => {
      const user = await this.prisma.user.findUnique({ where: { id } });
      return user ? UserMapper.toEntity(user) : null;
    });
  }
  
  // ... implement all methods from interface
}
```

**⚠️ Critical Notes:**
- Caching stays in repository (infrastructure concern)
- All Prisma imports stay here
- Returns domain entities for business operations

---

#### Step 2.2: Create User Query Repository for Auth
**Location:** `src/modules/users/infrastructure/repositories/user-query.repository.ts`

**Purpose:** Lightweight queries for auth, returning DTOs

**Interface:**
```typescript
export interface IUserQueryRepository {
  findByIdForAuth(id: string): Promise<UserAuthDto | null>;
  findByEmailForAuth(email: string): Promise<UserAuthDto | null>;
  existsByEmail(email: string): Promise<boolean>;
}
```

**Implementation:**
```typescript
@Injectable()
export class UserQueryRepository implements IUserQueryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}
  
  async findByIdForAuth(id: string): Promise<UserAuthDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        // Only select what auth needs
      },
    });
    
    return user ? AuthMapper.toAuthDto(user) : null;
  }
}
```

**Why Separate?**
- Auth queries are different from domain queries
- Prevents domain entity contamination in auth layer
- Performance: select only needed fields

---

#### Step 2.3: Update UsersService (Gradual Migration)
**Location:** `src/modules/users/users.service.ts`

**Strategy:** Replace Prisma calls one method at a time

**Before:**
```typescript
@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}
  
  async findById(id: string): Promise<UserEntity> {
    const user = await this.prismaService.user.findUnique({ where: { id } });
    return UserMapper.toEntity(user);
  }
}
```

**After:**
```typescript
@Injectable()
export class UsersService {
  constructor(private readonly userRepo: IUserRepository) {}
  
  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new UserNotFoundError({ field: 'id', value: id });
    return user;
  }
}
```

**Migration Order:**
1. ✅ `findById` - simplest, no business logic
2. ✅ `findByEmail` - simple query
3. ✅ `existsByEmail` - simple check
4. ⚠️ `create` - handles transactions, migrate carefully
5. ⚠️ `update` - handles cache invalidation
6. ⚠️ `findAll` - pagination logic

---

### **Phase 3: Update Auth Service**

#### Step 3.1: Remove UserEntity from Auth
**Location:** `src/modules/auth/auth.service.ts`

**Current Issue:**
```typescript
// ❌ WRONG: Auth returns domain entity
async loginWithEmail(email: string, password: string): Promise<{
  accessToken: string;
  refreshToken: string;
  user: UserEntity; // ❌ Domain entity in auth response
}> { }
```

**Fix:**
```typescript
// ✅ CORRECT: Auth returns DTO
async loginWithEmail(email: string, password: string): Promise<{
  accessToken: string;
  refreshToken: string;
  user: UserAuthDto; // ✅ Read-only DTO
}> { }
```

**Inject Query Repository:**
```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly userQuery: IUserQueryRepository, // ✅ For auth checks
    private readonly userRepo: IUserRepository,        // ✅ For mutations (create user)
  ) {}
}
```

---

#### Step 3.2: Update JWT/Refresh Strategies
**Location:** 
- `src/modules/auth/strategies/jwt.strategy.ts`
- `src/modules/auth/strategies/refresh.strategy.ts`

**Before:**
```typescript
async validate(payload: any): Promise<UserEntity> { // ❌
  return await this.usersService.findById(payload.sub);
}
```

**After:**
```typescript
async validate(payload: any): Promise<UserAuthDto> { // ✅
  const user = await this.userQuery.findByIdForAuth(payload.sub);
  if (!user) throw new UnauthorizedException();
  return user;
}
```

---

### **Phase 4: Remove `findByIdSelective` Anti-Pattern**

**Current Issue:**
```typescript
async findByIdSelective<K extends keyof User>(
  id: string,
  fields: K[]
): Promise<Pick<UserEntity, K>> { } // ❌ Returns partial domain entity
```

**Why This Is Wrong:**
- Mixes persistence concerns (database fields) with domain (entity)
- `Pick<UserEntity, K>` creates weird partial domain objects
- Violates Single Responsibility Principle

**Decision:** **DELETE THIS METHOD**

**Replacement Strategy:**

1. **For Auth/JWT:** Use `UserQueryRepository.findByIdForAuth()`
2. **For Business Logic:** Use `UserRepository.findById()` (full entity)
3. **For Specific Projections:** Create dedicated query methods

**Example:**
```typescript
// Instead of: findByIdSelective(id, ['id', 'email', 'firstName'])
// Use:
interface IUserQueryRepository {
  findUserProfile(id: string): Promise<UserProfileDto>;
  findUserAvatar(id: string): Promise<UserAvatarDto>;
}
```

---

## 🗂️ Final Directory Structure

```
src/modules/users/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts              # ✅ Pure business logic
│   ├── mappers/
│   │   └── user.mapper.ts              # ✅ Bidirectional mapping
│   └── repositories/
│       ├── user.repository.interface.ts    # ✅ Write operations
│       └── user-query.interface.ts         # ✅ Read operations for auth
├── infrastructure/
│   └── repositories/
│       ├── user.repository.ts          # ✅ Prisma implementation
│       └── user-query.repository.ts    # ✅ Auth queries
├── dto/                                # API contracts
├── errors/                             # Domain errors
├── users.service.ts                    # ✅ Business logic, no Prisma
├── users.controller.ts
└── users.module.ts

src/modules/auth/
├── dto/
│   └── query/
│       └── user-auth.dto.ts            # ✅ Read-only auth snapshot
├── mappers/
│   └── auth.mapper.ts                  # ✅ Maps to UserAuthDto
├── strategies/
│   ├── jwt.strategy.ts                 # ✅ Uses UserAuthDto
│   └── refresh.strategy.ts             # ✅ Uses UserAuthDto
└── auth.service.ts                     # ✅ Uses IUserQueryRepository
```

---

## ⚠️ Critical Warnings

### 1. **DO NOT Refactor Everything at Once**
Migrate one method at a time. Keep both old and new code working during transition.

### 2. **DO NOT Make Repository Too Generic**
Bad:
```typescript
class GenericRepository<T> { } // ❌ Over-engineering
```

Good:
```typescript
class UserRepository implements IUserRepository { } // ✅ Specific to User
```

### 3. **DO NOT Put Business Logic in Repository**
Bad:
```typescript
class UserRepository {
  async canUserLogin(id: string): Promise<boolean> { // ❌ Business logic
    // ...
  }
}
```

Good:
```typescript
class UsersService {
  async canUserLogin(user: UserEntity): boolean { // ✅ In service
    return user.isActive && user.emailVerified;
  }
}
```

### 4. **DO NOT Create 100 DTOs**
Only create DTOs when there's a clear need:
- API requests/responses
- Auth payloads
- Specific projections

Don't create DTOs "just in case."

---

## 📊 Migration Checklist

### **Phase 1: Foundation** ⏱️ Est. 2-3 hours
- [ ] Create `IUserRepository` interface
- [ ] Complete `UserMapper.toPersistence()`
- [ ] Create `UserAuthDto` for auth
- [ ] Create `AuthMapper.toAuthDto()`
- [ ] Create `IUserQueryRepository` interface

### **Phase 2: Repository Implementation** ⏱️ Est. 4-6 hours
- [ ] Implement `UserRepository` with all methods
- [ ] Implement `UserQueryRepository` with auth queries
- [ ] Update `users.module.ts` to provide repositories
- [ ] Write unit tests for repositories

### **Phase 3: Migrate UsersService** ⏱️ Est. 3-4 hours
- [ ] Replace `findById` with `userRepo.findById()`
- [ ] Replace `findByEmail` with `userRepo.findByEmail()`
- [ ] Replace `create` with `userRepo.create()`
- [ ] Replace `update` with `userRepo.update()`
- [ ] Replace `existsByEmail` with `userRepo.existsByEmail()`
- [ ] **DELETE** `findByIdSelective`
- [ ] Remove `PrismaService` injection from `UsersService`

### **Phase 4: Migrate AuthService** ⏱️ Est. 2-3 hours
- [ ] Change `loginWithEmail` to return `UserAuthDto`
- [ ] Update JWT strategy to use `IUserQueryRepository`
- [ ] Update Refresh strategy to use `IUserQueryRepository`
- [ ] Update all auth methods to use `UserAuthDto`

### **Phase 5: Testing & Validation** ⏱️ Est. 2-3 hours
- [ ] Run all unit tests
- [ ] Run all e2e tests
- [ ] Manual testing: auth flow
- [ ] Manual testing: user CRUD
- [ ] Performance check: query times unchanged

### **Phase 6: Cleanup** ⏱️ Est. 1 hour
- [ ] Remove unused imports
- [ ] Update documentation
- [ ] Remove deprecated methods
- [ ] Final code review

**Total Estimated Time:** 14-20 hours

---

## 🎓 What This Achieves

### Before Refactor:
```
Controller → Service (with Prisma) → Database
                ↓
          (Tight Coupling)
```

- Schema change = update Service + Auth + DTOs
- Hard to test (mock Prisma everywhere)
- Domain logic mixed with persistence

### After Refactor:
```
Controller → Service (Domain Logic) → Repository → Database
             ↓                           ↑
        UserEntity              (Abstraction)
             ↓
    (Pure Business Logic)

Auth → UserQueryRepository → Database
          ↓
    (Read-only DTOs)
```

- Schema change = update Repository + Mapper only
- Easy to test (mock repository interfaces)
- Domain logic pure and isolated
- Auth decoupled from domain

---

## 🚀 Next Steps After This Refactor

**Do Later (Not Now):**
1. Add domain events for audit logging
2. Consider read/write splitting for heavy loads
3. Add Redis caching at repository level
4. Implement soft delete in repository

**Do NOT Do:**
- Full Event Sourcing
- CQRS with separate read/write databases
- Microservices split
- GraphQL federation

**Keep It Simple.**

---

## 📚 References

- [Martin Fowler: Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Clean Architecture (pragmatic approach)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Documentation: Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)

---

**Remember:** The goal is maintainability for a solo developer, NOT textbook perfection.

