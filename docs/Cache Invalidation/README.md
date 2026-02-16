# Cache Invalidator Module

## 📋 Overview

This module provides **centralized cache invalidation** for user-related data across the application. It solves the problem of cache consistency when Auth and Users modules share the same database table.

## 🎯 Problem Statement

**Before (Problem):**
- Auth and Users modules have separate cache invalidation listeners
- Both modules work with the same `users` database table
- When Auth module changes user data (e.g., password change), Users cache becomes stale
- When Users module changes profile data, Auth cache becomes stale
- Result: **Cache inconsistency** and potential bugs

**After (Solution):**
- Single unified listener handles events from BOTH modules
- Centralized service knows about all user cache keys
- All user-related caches are invalidated together
- Result: **Consistent cache** across modules

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Domain Events                            │
│  (Auth Events: 14)  +  (Users Events: 13)  =  27 Events    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│       UnifiedUserCacheInvalidationListener                   │
│  • Listens to ALL user-related events                       │
│  • Single entry point for cache invalidation                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          UserCacheInvalidationService                        │
│  • Knows ALL user cache keys (Auth + Users)                 │
│  • Invalidates both modules' caches                         │
│  • Increments list cache versions                           │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Redis Cache                               │
│  Keys Invalidated:                                           │
│  • auth:user:id:{userId}                                     │
│  • auth:user:email:{email}                                   │
│  • user:profile:id:{userId}                                  │
│  • user:profile:detail:id:{userId}                           │
│  • user:profile:list:version (incremented)                   │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Components

### 1. UserCacheInvalidationService

Centralized service that handles cache invalidation logic.

**Responsibilities:**
- Knows about ALL user cache keys (Auth + Users modules)
- Provides methods for invalidating user caches
- Handles list cache version incrementing

**Methods:**
```typescript
// Invalidate all caches for a specific user
await userCacheInvalidation.invalidateUserCache(userId, email);

// Invalidate cache by email only
await userCacheInvalidation.invalidateUserCacheByEmail(email);

// Invalidate all list caches
await userCacheInvalidation.invalidateAllListCaches();
```

### 2. UnifiedUserCacheInvalidationListener

Single listener that handles events from both Auth and Users modules.

**Events Handled:**

#### Auth Module Events (14):
- `user.registered` - User registration
- `user.email_verified` - Email verification
- `user.email_unverified` - Email unverification
- `user.password_changed` - Password change
- `user.password_reset` - Password reset
- `user.logged_in` - Local login
- `user.logged_in_with_oauth` - OAuth login
- `user.activated` - User activation
- `user.deactivated` - User deactivation
- `user.suspended` - User suspension
- `user.deleted` - User deletion
- `user.oauth_provider_linked` - OAuth provider linked
- `user.oauth_provider_unlinked` - OAuth provider unlinked
- `user.created_from_oauth` - User created via OAuth

#### Users Module Events (13):
- `user.updated_profile` - Profile update
- `user.phone_number_updated` - Phone number change
- `user.phone_number_verified` - Phone verification
- `user.phone_number_unverified` - Phone unverification
- `user.address_added` - Address added
- `user.address_updated` - Address updated
- `user.address_removed` - Address removed
- `user.profile_activated` - User activation
- `user.profile_deactivated` - User deactivation
- `user.profile_suspended` - User suspension
- `user.profile_unsuspended` - User unsuspension
- `user.profile_deleted` - User deletion
- `user.profile_restored` - User restoration

## 🚀 Usage

### Automatic (Event-Driven)

Cache is **automatically invalidated** when domain events are emitted. No additional code needed!

```typescript
// In your domain entity or use case
class AuthUser extends AggregateRoot {
  public verifyEmail(): void {
    // ... business logic ...
    
    // Emit event
    this.addDomainEvent(new EmailVerifiedEvent({
      userId: this.id,
      email: this.email
    }));
    
    // Cache will be AUTOMATICALLY invalidated by UnifiedUserCacheInvalidationListener
  }
}
```

### Manual (Programmatic)

If you need to manually invalidate cache:

```typescript
import { UserCacheInvalidationService } from './core/infrastructure/services/cache-invalidator';

@Injectable()
export class SomeService {
  constructor(
    private readonly userCacheInvalidation: UserCacheInvalidationService
  ) {}

  async someMethod(userId: string, email: string) {
    // ... do something ...
    
    // Manually invalidate all user caches
    await this.userCacheInvalidation.invalidateUserCache(userId, email);
  }
}
```

## 🔄 Migration from Legacy

If you're using the old separate listeners:

### Before (Legacy):
```typescript
@Module({
  providers: [
    InvalidateAuthUserCacheListener,  // ❌ Deprecated
    InvalidateUserCacheListener,      // ❌ Deprecated
  ],
})
```

### After (New):
```typescript
@Module({
  providers: [
    UserCacheInvalidationService,            // ✅ Service
    UnifiedUserCacheInvalidationListener,    // ✅ Listener
  ],
})
```

**What changes?**
- **Before**: 2 separate listeners, each only knows about their module's cache
- **After**: 1 listener + 1 service, knows about ALL caches
- **Benefit**: Cache consistency, no more stale data!

## 📊 Cache Keys Managed

### Auth Module Keys:
- `auth:user:id:{userId}` - User by ID
- `auth:user:email:{email}` - User by email
- `auth:user:requested:id:{userId}` - Requested user data

### Users Module Keys:
- `user:profile:id:{userId}` - User profile by ID
- `user:profile:detail:id:{userId}` - User detail by ID
- `user:profile:list:version` - List cache version (incremented)

## 🧪 Testing

```typescript
describe('UnifiedUserCacheInvalidationListener', () => {
  it('should invalidate both Auth and Users caches when Auth event occurs', async () => {
    // Emit Auth event
    await eventEmitter.emit(EmailVerifiedEvent.EventName, event);
    
    // Both Auth and Users caches should be invalidated
    expect(authCache.getUserByIdKey).toHaveBeenCalledWith(userId);
    expect(userCache.getUserByIdKey).toHaveBeenCalledWith(userId);
  });
  
  it('should invalidate both Auth and Users caches when Users event occurs', async () => {
    // Emit Users event
    await eventEmitter.emit(UserProfileUpdatedEvent.EventName, event);
    
    // Both Auth and Users caches should be invalidated
    expect(authCache.getUserByIdKey).toHaveBeenCalledWith(userId);
    expect(userCache.getUserByIdKey).toHaveBeenCalledWith(userId);
  });
});
```

## ⚠️ Important Notes

1. **Shared Database Table**: Auth and Users modules use the same `users` table
2. **Cache Consistency**: Changes in one module affect the other's cache
3. **List Cache Strategy**: We increment version numbers instead of wildcard deletion (more efficient)
4. **Async Events**: All events are processed asynchronously ({ async: true })

## 🔮 Future Improvements

- [ ] Add metrics/monitoring for cache invalidation
- [ ] Add conditional invalidation (skip if not needed)
- [ ] Add batch invalidation for bulk operations
- [ ] Add cache warming after invalidation
- [ ] Consider moving to separate tables (Auth vs Users) for better separation

## 📝 References

- See: `unified-user-cache-invalidation.listener.ts` for implementation
- See: `user-cache-invalidation.service.ts` for service logic
- Legacy: `invalidate-auth-user-cache.listener.ts` (deprecated)
- Legacy: `invalidate-user-cache.listener.ts` (deprecated)
