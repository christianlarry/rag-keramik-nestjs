# Development Patterns & Guidelines

> **Reference Module**: Auth Module  
> **Architecture**: Clean Architecture / Hexagonal Architecture  
> **Pattern**: Domain-Driven Design (DDD)

Dokumentasi ini menjelaskan pattern dan best practices untuk implementasi fitur baru berdasarkan Auth Module yang telah selesai. Gunakan sebagai referensi untuk membuat module/context/bounded context baru.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Layer Structure](#layer-structure)
3. [Domain Layer](#domain-layer)
4. [Application Layer](#application-layer)
5. [Infrastructure Layer](#infrastructure-layer)
6. [Presentation Layer](#presentation-layer)
7. [Module Structure](#module-structure)
8. [Step-by-Step Guide](#step-by-step-guide)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)

---

## 🏗️ Architecture Overview

Aplikasi menggunakan **Clean Architecture** dengan 4 layer utama:

```
┌─────────────────────────────────────────────────┐
│          Presentation Layer (HTTP/CLI)           │
│  Controllers, DTOs, Guards, Decorators, etc.    │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│           Application Layer                      │
│  Use Cases, Application Services, Commands      │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│            Domain Layer                          │
│  Entities, Value Objects, Domain Services,      │
│  Repository Interfaces, Domain Events, Errors   │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│         Infrastructure Layer                     │
│  Repositories, Mappers, External Services,      │
│  Database, Cache, Configs, Strategies           │
└─────────────────────────────────────────────────┘
```

**Dependency Rule**: Dependency hanya boleh mengarah ke dalam (inward). Outer layers bergantung pada inner layers, tapi tidak sebaliknya.

---

## 📂 Layer Structure

### Module/Context Folder Structure

```
src/modules/{module-name}/
├── domain/                      # Domain Layer (Core Business Logic)
│   ├── entities/               # Aggregate Roots & Entities
│   ├── value-objects/          # Value Objects
│   ├── enums/                  # Domain Enums
│   ├── errors/                 # Domain Errors
│   │   └── enums/             # Error Code Enums
│   ├── events/                 # Domain Events
│   ├── repositories/           # Repository Interfaces
│   └── services/               # Domain Service Interfaces
│
├── application/                 # Application Layer (Use Cases)
│   ├── use-cases/              # Use Case Implementations
│   ├── commands/               # Command Objects (optional)
│   ├── queries/                # Query Objects (optional)
│   └── listeners/              # Event Listeners (optional)
│
├── infrastructure/              # Infrastructure Layer (Technical Details)
│   ├── repositories/           # Repository Implementations
│   ├── mappers/                # Domain ↔ Persistence Mappers
│   ├── cache/                  # Cache Utilities
│   ├── config/                 # Module Configurations
│   ├── strategies/             # Passport Strategies (if needed)
│   ├── hasher/                 # Hashers (if needed)
│   └── generator/              # Generators (if needed)
│
├── presentation/                # Presentation Layer (API)
│   └── http/                   # HTTP Presentation
│       ├── controllers/        # NestJS Controllers
│       ├── dtos/               # Request/Response DTOs
│       │   └── response/       # Response DTOs
│       ├── guards/             # Route Guards
│       ├── decorators/         # Custom Decorators
│       └── errors/             # HTTP Error Handlers
│
└── {module-name}.module.ts     # NestJS Module Definition
```

---

## 🎯 Domain Layer

**Purpose**: Berisi core business logic dan business rules. Layer ini **tidak bergantung** pada framework, database, atau teknologi apapun.

### 📦 Components

#### 1. **Entities** (Aggregate Roots)

Entity adalah objek dengan identitas unik yang memiliki lifecycle. Aggregate root adalah entry point untuk mengakses aggregate.

**Karakteristik**:
- Extends `AggregateRoot` untuk domain events
- Memiliki ID unik (`UserId`, `ProductId`, dll)
- Memiliki `private constructor` dan factory methods
- Business logic methods
- State transition methods
- Validation methods

**Example**: `auth-user.entity.ts`

```typescript
import { AggregateRoot } from "src/core/domain/aggregate-root.base";
import { UserId } from "./value-objects/user-id.vo";

interface AuthUserProps {
  name: Name;
  email: Email;
  password: Password | null;
  role: Role;
  status: Status;
  // ... other props
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class AuthUser extends AggregateRoot {
  private readonly _id: UserId;
  private props: AuthUserProps;

  // Private constructor - tidak bisa di-instantiate langsung
  private constructor(id: UserId, props: AuthUserProps) {
    super();
    this._id = id;
    this.props = props;
    this.validate();
  }

  // Factory method untuk create baru
  public static register(params: RegisterParams): AuthUser {
    const authUser = new AuthUser(UserId.generate(), {
      // ... initialize props
      status: Status.createInactive(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Domain event
    authUser.addDomainEvent(
      new UserRegisteredEvent({
        userId: authUser._id.getValue(),
        email: authUser.email.getValue()
      })
    );

    return authUser;
  }

  // Factory method untuk reconstruct dari DB
  public static reconstruct(id: string, props: AuthUserProps): AuthUser {
    return new AuthUser(UserId.fromString(id), props);
  }

  // Business logic methods
  public login(): void {
    this.ensureCanLogin();
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  public verifyEmail(): void {
    if (this.props.emailVerified) {
      throw new CannotVerifyEmailError('Email already verified');
    }
    this.props.emailVerified = true;
    this.props.emailVerifiedAt = new Date();
  }

  // State check methods
  public canLogin(): boolean {
    return this.props.status.isActive() && this.props.emailVerified;
  }

  // Ensure invariants
  private ensureCanLogin(): void {
    if (!this.props.status.isActive()) {
      throw new CannotLoginError('User is not active');
    }
    if (!this.props.emailVerified) {
      throw new CannotLoginError('Email not verified');
    }
  }

  // Validation
  private validate(): void {
    // Validate business invariants
  }

  // Getters only (no setters!)
  public get id(): UserId { return this._id; }
  public get email(): Email { return this.props.email; }
  // ... other getters
}
```

**Key Points**:
- ✅ Immutable ID (`readonly _id`)
- ✅ Private props, public getters
- ✅ Factory methods (`register`, `reconstruct`)
- ✅ Business logic encapsulation
- ✅ Domain events untuk side effects
- ✅ Validation dan invariants

---

#### 2. **Value Objects**

Value Objects adalah objek tanpa identitas, didefinisikan oleh value-nya.

**Karakteristik**:
- Immutable
- Validation di constructor
- Equals by value, bukan reference
- Factory methods untuk creation

**Example**: `password.vo.ts`

```typescript
export class Password {
  private readonly value: string;

  private constructor(hashed: string) {
    this.value = hashed;
  }

  // Static validation untuk raw password
  public static validateRaw(raw: string): void {
    if (raw.length < 8) throw new PasswordTooWeakError("TOO_SHORT");
    if (!/[a-z]/.test(raw)) throw new PasswordTooWeakError("NO_LOWERCASE");
    if (!/[A-Z]/.test(raw)) throw new PasswordTooWeakError("NO_UPPERCASE");
    if (!/[0-9]/.test(raw)) throw new PasswordTooWeakError("NO_NUMBER");
    if (!/[!@#$%^&*]/.test(raw)) throw new PasswordTooWeakError("NO_SPECIAL");
  }

  // Factory method
  public static fromHash(hashed: string): Password {
    return new Password(hashed);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Password): boolean {
    return this.value === other.value;
  }
}
```

**Example**: `email.vo.ts`

```typescript
export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
    this.validate();
  }

  private validate(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) {
      throw new InvalidEmailError('Invalid email format');
    }
  }

  public static create(email: string): Email {
    return new Email(email.toLowerCase().trim());
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

---

#### 3. **Domain Errors**

Custom errors untuk business rules violations.

**Structure**:
```
domain/errors/
├── enums/
│   └── {module}-error-code.enum.ts
├── {specific-error}.error.ts
└── index.ts
```

**Example**: `user-error-code.enum.ts`

```typescript
export const UserErrorCode = {
  INVALID_EMAIL: 'USER_INVALID_EMAIL',
  INVALID_PASSWORD: 'USER_INVALID_PASSWORD',
  EMAIL_ALREADY_IN_USE: 'USER_EMAIL_ALREADY_IN_USE',
  CANNOT_LOGIN: 'USER_CANNOT_LOGIN',
  CANNOT_VERIFY_EMAIL: 'USER_CANNOT_VERIFY_EMAIL',
  // ... more codes
} as const;

export type UserErrorCode = typeof UserErrorCode[keyof typeof UserErrorCode];
```

**Example**: `email-already-in-use.error.ts`

```typescript
import { DomainError } from "src/core/domain/domain-error.base";
import { UserErrorCode } from "./enums/user-error-code.enum";

export class EmailAlreadyInUseError extends DomainError {
  readonly code = UserErrorCode.EMAIL_ALREADY_IN_USE;

  constructor(email: string) {
    super(`Email ${email} is already in use.`);
  }
}
```

**Export all errors**: `index.ts`

```typescript
export * from './enums/user-error-code.enum';
export * from './email-already-in-use.error';
export * from './cannot-login.error';
// ... export all errors
```

---

#### 4. **Domain Events**

Events yang terjadi dalam domain, untuk decoupling side effects.

**Example**: `user-registered.event.ts`

```typescript
import { DomainEvent } from "src/core/domain/domain-event.base";

interface UserRegisteredPayload {
  userId: string;
  email: string;
}

export class UserRegisteredEvent extends DomainEvent {
  constructor(public readonly payload: UserRegisteredPayload) {
    super();
  }

  get name(): string {
    return 'user.registered';
  }
}
```

**Usage in Entity**:

```typescript
public static register(params: RegisterParams): AuthUser {
  const authUser = new AuthUser(/*...*/);
  
  // Add domain event
  authUser.addDomainEvent(
    new UserRegisteredEvent({
      userId: authUser._id.getValue(),
      email: authUser.email.getValue()
    })
  );

  return authUser;
}
```

---

#### 5. **Repository Interfaces**

Interfaces untuk persistence, implementasi ada di infrastructure.

**Example**: `auth-user-repository.interface.ts`

```typescript
import { AuthUser } from "../entities/auth-user.entity";

export interface AuthUserRepository {
  findById(userId: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  isEmailExisting(email: string): Promise<boolean>;
  save(user: AuthUser): Promise<void>;
}

export const AUTH_USER_REPOSITORY_TOKEN = "AUTH_USER_REPOSITORY";
```

**Key Points**:
- ✅ Interface, bukan concrete class
- ✅ Return domain entities, bukan DB models
- ✅ Export injection token

---

#### 6. **Domain Service Interfaces**

Services untuk business logic yang tidak fit di entity.

**Example**: `password-hasher.interface.ts`

```typescript
export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(plainPassword: string, hashedPassword: string): Promise<boolean>;
}

export const PASSWORD_HASHER_TOKEN = 'PASSWORD_HASHER';
```

---

## 🎬 Application Layer

**Purpose**: Orchestrate use cases, coordinate domain objects, call infrastructure services.

### 📦 Components

#### 1. **Use Cases**

Satu use case = satu fitur/action yang bisa dilakukan user.

**Karakteristik**:
- Satu class = satu use case
- Inject dependencies via constructor
- `execute()` method sebagai entry point
- Command interface untuk input
- Result interface untuk output
- Handle transactions
- Emit domain events

**Example**: `register.usecase.ts`

```typescript
import { Inject, Injectable } from "@nestjs/common";

interface RegisterCommand {
  fullName: string;
  email: string;
  password: string;
}

interface RegisterResult {
  userId: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_USER_REPOSITORY_TOKEN)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    @Inject(UNIT_OF_WORK_TOKEN)
    private readonly uow: UnitOfWork,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    // 1. Validate business rules
    const exists = await this.authUserRepository.isEmailExisting(command.email);
    if (exists) throw new EmailAlreadyInUseError(command.email);

    // 2. Create value objects
    Password.validateRaw(command.password);
    const hashedPassword = await this.passwordHasher.hash(command.password);
    const name = Name.create(command.fullName);
    const password = Password.fromHash(hashedPassword);
    const email = Email.create(command.email);

    // 3. Create entity
    const authUser = AuthUser.register({ name, email, password });

    // 4. Transaction
    await this.uow.withTransaction(async () => {
      await this.authUserRepository.save(authUser);
      
      await this.audit.logUserAction(
        authUser.id.getValue(),
        AuditAction.REGISTER,
        AuditTargetType.USER,
        authUser.id.getValue(),
      );
    });

    // 5. Side effects (outside transaction)
    await this.mail.sendVerificationEmail(email.getValue());

    return { userId: authUser.id.getValue() };
  }
}
```

**Pattern Flow**:
1. ✅ Validate input & business rules
2. ✅ Create/retrieve domain objects
3. ✅ Execute business logic (via entity methods)
4. ✅ Persist changes in transaction
5. ✅ Handle side effects (email, cache, etc.)
6. ✅ Return result

---

#### 2. **Event Listeners** (Optional)

Mendengarkan domain events untuk side effects.

**Example**: `send-verification-email.listener.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { MailService } from 'src/core/infrastructure/services/mail/mail.service';

@Injectable()
export class SendVerificationEmailListener {
  constructor(private readonly mail: MailService) {}

  @OnEvent('user.registered')
  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.mail.sendVerificationEmail(event.payload.email);
  }
}
```

---

## 🔧 Infrastructure Layer

**Purpose**: Technical implementations, database, external services, frameworks.

### 📦 Components

#### 1. **Repository Implementations**

Implementasi dari repository interfaces.

**Example**: `prisma-auth-user.repository.ts`

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { AuthUser } from "../../domain/entities/auth-user.entity";
import { AuthUserRepository } from "../../domain/repositories/auth-user-repository.interface";

@Injectable()
export class PrismaAuthUserRepository implements AuthUserRepository {
  private readonly logger = new Logger(PrismaAuthUserRepository.name);
  private readonly client: PrismaClient | TransactionClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.client = this.prisma.getClient();
  }

  async findById(userId: string): Promise<AuthUser | null> {
    // 1. Check cache
    const cachedUser = await this.cache.wrap(
      UserAuthCache.getUserByIdKey(userId),
      async () => {
        // 2. Query database
        const user = await this.client.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            fullName: true,
            email: true,
            // ... select fields
          }
        });
        return user;
      },
      UserAuthCache.USER_CACHE_TTL
    );

    // 3. Map to domain entity
    return cachedUser ? PrismaAuthUserMapper.toDomain(cachedUser) : null;
  }

  async save(authUser: AuthUser): Promise<void> {
    // 1. Map to persistence format
    const { authProviders, ...userData } = PrismaAuthUserMapper.toPersistence(authUser);

    // 2. Upsert
    await this.client.user.upsert({
      where: { id: userData.id },
      create: {
        ...userData,
        authProviders: { createMany: { data: authProviders } }
      },
      update: {
        ...userData,
        authProviders: {
          deleteMany: {},
          createMany: { data: authProviders }
        }
      }
    });

    // 3. Invalidate cache
    await Promise.all([
      this.cache.del(UserAuthCache.getUserByIdKey(userData.id)),
      this.cache.del(UserAuthCache.getUserByEmailKey(userData.email))
    ]);

    // 4. Emit domain events
    const events = authUser.pullDomainEvents();
    for (const event of events) {
      await this.eventEmitter.emitAsync(event.name, event);
    }
  }
}
```

**Key Points**:
- ✅ Implements repository interface
- ✅ Caching strategy
- ✅ Map domain ↔ persistence
- ✅ Emit domain events
- ✅ Transaction support

---

#### 2. **Mappers**

Convert antara domain entities dan persistence models.

**Example**: `prisma-auth-user.mapper.ts`

```typescript
import { AuthUser } from "../../domain/entities/auth-user.entity";

interface RawAuthUser {
  id: string;
  fullName: string;
  email: string;
  password: string | null;
  role: PrismaRole;
  status: PrismaUserStatus;
  // ... other fields
}

export class PrismaAuthUserMapper {
  // Database → Domain
  static toDomain(raw: RawAuthUser): AuthUser {
    const name = Name.create(raw.fullName);
    const email = Email.create(raw.email);
    const password = raw.password ? Password.fromHash(raw.password) : null;
    const role = Role.create(roleMapper.toEntity(raw.role));
    const status = Status.create(statusMapper.toEntity(raw.status));

    return AuthUser.reconstruct(raw.id, {
      name,
      email,
      password,
      role,
      status,
      // ... other props
    });
  }

  // Domain → Database
  static toPersistence(user: AuthUser): RawAuthUser {
    return {
      id: user.id.getValue(),
      fullName: user.name.getFullName(),
      email: user.email.getValue(),
      password: user.password ? user.password.getValue() : null,
      role: roleMapper.toPersistence(user.role.getValue()),
      status: statusMapper.toPersistence(user.status.getValue()),
      // ... other fields
    };
  }
}

// Enum mapper helper
const roleMapper = createEnumMapper<Role['value'], PrismaRole>({
  customer: 'CUSTOMER',
  admin: 'ADMIN',
  staff: 'STAFF'
});
```

---

#### 3. **Cache Utilities**

Helper untuk cache key generation dan TTL.

**Example**: `user-auth.cache.ts`

```typescript
export class UserAuthCache {
  // Prefixes
  static readonly USER_BY_ID_PREFIX = 'auth:user:id:';
  static readonly USER_BY_EMAIL_PREFIX = 'auth:user:email:';

  // TTL (in seconds)
  static readonly USER_CACHE_TTL = 3600; // 1 hour

  // Key generators
  static getUserByIdKey(userId: string): string {
    return `${this.USER_BY_ID_PREFIX}${userId}`;
  }

  static getUserByEmailKey(email: string): string {
    return `${this.USER_BY_EMAIL_PREFIX}${email.toLowerCase()}`;
  }
}
```

---

## 🌐 Presentation Layer

**Purpose**: Handle HTTP requests, validate input, format responses.

### 📦 Components

#### 1. **Controllers**

Handle HTTP requests, call use cases.

**Example**: `auth.controller.ts`

```typescript
import { Body, Controller, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginWithEmailUseCase,
    // ... other use cases
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, type: AuthRegisterResponseDto })
  async register(
    @Body() dto: AuthRegisterDto
  ): Promise<AuthRegisterResponseDto> {
    const result = await this.registerUseCase.execute({
      fullName: dto.fullName,
      email: dto.email,
      password: dto.password,
    });

    return {
      userId: result.userId,
      message: 'Registration successful'
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: AuthLoginDto): Promise<AuthLoginResponseDto> {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
```

**Key Points**:
- ✅ Thin controllers (business logic di use case)
- ✅ DTOs untuk validation
- ✅ Swagger decorators
- ✅ HTTP status codes yang tepat

---

#### 2. **DTOs (Data Transfer Objects)**

Validate dan shape HTTP request/response.

**Example**: `auth-register.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class AuthRegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
```

**Response DTO**: `auth-register-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class AuthRegisterResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  message: string;
}
```

---

## 📐 Module Structure

**Example**: `auth.module.ts`

```typescript
import { Module } from '@nestjs/common';

// Controllers
import { AuthController } from './presentation/http/auth.controller';

// Use Cases
import { RegisterUseCase } from './application/use-cases/register.usecase';
import { LoginWithEmailUseCase } from './application/use-cases/login-with-email.usecase';

// Repositories
import { 
  AUTH_USER_REPOSITORY_TOKEN 
} from './domain/repositories/auth-user-repository.interface';
import { PrismaAuthUserRepository } from './infrastructure/repositories/prisma-auth-user.repository';

// Services
import { 
  PASSWORD_HASHER_TOKEN 
} from './domain/services/password-hasher.interface';
import { BcryptPasswordHasher } from './infrastructure/hasher/bcrypt-password.hasher';

@Module({
  controllers: [
    AuthController,
  ],
  providers: [
    // Use Cases
    RegisterUseCase,
    LoginWithEmailUseCase,
    
    // Repositories
    {
      provide: AUTH_USER_REPOSITORY_TOKEN,
      useClass: PrismaAuthUserRepository,
    },
    
    // Services
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [
    // Export jika dibutuhkan module lain
  ],
})
export class AuthModule {}
```

---

## 🚀 Step-by-Step Guide

### Membuat Module/Context Baru

#### **Step 1: Define Domain Model**

1. **Create Entity**
   - Buat file di `domain/entities/`
   - Extends `AggregateRoot` jika butuh events
   - Private constructor
   - Factory methods
   - Business logic methods

2. **Create Value Objects**
   - Buat file di `domain/value-objects/`
   - Immutable
   - Validation di constructor
   - Factory methods

3. **Create Domain Errors**
   - Buat enum di `domain/errors/enums/`
   - Buat error classes extends `DomainError`
   - Export di `domain/errors/index.ts`

4. **Create Repository Interface**
   - Buat file di `domain/repositories/`
   - Define methods yang dibutuhkan
   - Export injection token

#### **Step 2: Implement Use Cases**

1. **Create Use Case**
   - Buat file di `application/use-cases/`
   - Injectable class
   - Command dan Result interfaces
   - `execute()` method
   - Inject repository interfaces

2. **Create Event Listeners** (optional)
   - Buat file di `application/listeners/`
   - `@OnEvent()` decorator
   - Handle side effects

#### **Step 3: Implement Infrastructure**

1. **Create Repository Implementation**
   - Buat file di `infrastructure/repositories/`
   - Implements repository interface
   - Handle caching
   - Map domain ↔ persistence

2. **Create Mapper**
   - Buat file di `infrastructure/mappers/`
   - `toDomain()` method
   - `toPersistence()` method
   - Enum mappers

3. **Create Cache Utilities**
   - Buat file di `infrastructure/cache/`
   - Key generators
   - TTL constants

#### **Step 4: Create Presentation**

1. **Create DTOs**
   - Buat file di `presentation/http/dtos/`
   - Request DTOs dengan validation
   - Response DTOs di subfolder `response/`

2. **Create Controller**
   - Buat file di `presentation/http/`
   - Inject use cases
   - Thin controllers
   - Map DTOs ↔ Commands

3. **Create Guards/Decorators** (if needed)
   - Buat di `presentation/http/guards/`
   - Buat di `presentation/http/decorators/`

#### **Step 5: Wire Everything Up**

1. **Create Module**
   - Buat `{module}.module.ts`
   - Register controllers
   - Register providers dengan DI
   - Export jika perlu

2. **Register in App Module**
   - Import module di `app.module.ts`

---

## ✅ Best Practices

### Domain Layer

- ✅ **Immutability**: Value objects harus immutable
- ✅ **Encapsulation**: Private props, public getters
- ✅ **Factory Methods**: Gunakan static factory methods untuk creation
- ✅ **Business Logic**: Business logic hanya di entities
- ✅ **Validation**: Validate di constructor atau method
- ✅ **No Framework Dependencies**: Jangan import NestJS/Prisma di domain

### Application Layer

- ✅ **Single Responsibility**: Satu use case = satu action
- ✅ **Thin Use Cases**: Orchestrate, jangan implement business logic
- ✅ **Transactions**: Gunakan UnitOfWork untuk transactions
- ✅ **Error Handling**: Let domain errors bubble up
- ✅ **Side Effects**: Handle di luar transaction (email, cache, etc)

### Infrastructure Layer

- ✅ **Repository Pattern**: Return domain entities, bukan DB models
- ✅ **Caching**: Implement caching di repository
- ✅ **Mapping**: Gunakan mapper untuk isolasi
- ✅ **Transaction Support**: Support transaction client
- ✅ **Event Emission**: Emit domain events setelah save

### Presentation Layer

- ✅ **Thin Controllers**: Controllers hanya route ke use cases
- ✅ **DTO Validation**: Gunakan class-validator
- ✅ **Error Mapping**: Map domain errors ke HTTP errors
- ✅ **API Documentation**: Gunakan Swagger decorators
- ✅ **Security**: Apply guards dan throttling

---

## 🔄 Common Patterns

### Pattern 1: Entity Creation

```typescript
// ❌ BAD
const user = new User({ email: 'test@example.com' });

// ✅ GOOD
const user = User.register({
  name: Name.create('John Doe'),
  email: Email.create('john@example.com'),
  password: Password.fromHash('hashed...'),
});
```

### Pattern 2: Entity Reconstruction

```typescript
// ✅ GOOD
const user = User.reconstruct(rawData.id, {
  name: Name.create(rawData.fullName),
  email: Email.create(rawData.email),
  // ... other props
});
```

### Pattern 3: Use Case Pattern

```typescript
async execute(command: Command): Promise<Result> {
  // 1. Validate
  // 2. Get/Create domain objects
  // 3. Execute business logic
  // 4. Persist in transaction
  // 5. Handle side effects
  // 6. Return result
}
```

### Pattern 4: Repository with Cache

```typescript
async findById(id: string): Promise<Entity | null> {
  const cached = await this.cache.wrap(
    CacheKeys.getByIdKey(id),
    async () => {
      return await this.client.entity.findUnique({
        where: { id }
      });
    },
    TTL
  );

  return cached ? Mapper.toDomain(cached) : null;
}
```

### Pattern 5: Transaction with UnitOfWork

```typescript
await this.uow.withTransaction(async () => {
  await this.repository.save(entity);
  await this.audit.log(/* ... */);
});
```

---

## 📝 Naming Conventions

### Files

- **Entities**: `{entity-name}.entity.ts`
- **Value Objects**: `{vo-name}.vo.ts`
- **Errors**: `{error-name}.error.ts`
- **Events**: `{event-name}.event.ts`
- **Repository Interface**: `{entity}-repository.interface.ts`
- **Repository Implementation**: `prisma-{entity}.repository.ts`
- **Use Cases**: `{action}.usecase.ts`
- **DTOs**: `{action}.dto.ts`
- **Controllers**: `{resource}.controller.ts`
- **Mappers**: `prisma-{entity}.mapper.ts`

### Classes

- **Entities**: `PascalCase` (e.g., `AuthUser`, `Product`)
- **Value Objects**: `PascalCase` (e.g., `Email`, `Money`)
- **Errors**: `PascalCase` + `Error` suffix (e.g., `EmailAlreadyInUseError`)
- **Events**: `PascalCase` + `Event` suffix (e.g., `UserRegisteredEvent`)
- **Use Cases**: `PascalCase` + `UseCase` suffix (e.g., `RegisterUseCase`)
- **DTOs**: `PascalCase` + `Dto` suffix (e.g., `AuthRegisterDto`)

### Interfaces

- **Repository**: `PascalCase` + `Repository` suffix (e.g., `AuthUserRepository`)
- **Service**: `PascalCase` (e.g., `PasswordHasher`)

---

## 🎓 Summary

### Dependency Flow

```
Presentation → Application → Domain ← Infrastructure
```

### Responsibility Summary

| Layer | Responsibility | Examples |
|-------|---------------|----------|
| **Domain** | Business logic & rules | Entities, VOs, Errors, Interfaces |
| **Application** | Orchestration & use cases | Use cases, Commands, Queries |
| **Infrastructure** | Technical implementation | Repositories, Mappers, Cache |
| **Presentation** | HTTP/CLI interface | Controllers, DTOs, Guards |

### Key Principles

1. **Dependency Inversion**: Depend on interfaces, not concrete classes
2. **Single Responsibility**: Satu class, satu tanggung jawab
3. **Encapsulation**: Hide internal state, expose behavior
4. **Immutability**: Prefer immutable objects
5. **Separation of Concerns**: Pisahkan business logic dari technical details

---

## 📚 References

- Auth Module: `src/modules/auth/`
- Users Module: `src/modules/users/`
- Core Domain: `src/core/domain/`
- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- DDD: https://martinfowler.com/bliki/DomainDrivenDesign.html

---

**Happy Coding! 🚀**
