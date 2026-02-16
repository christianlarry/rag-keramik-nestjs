# User Service Caching Implementation

## Overview
Implementasi caching layer menggunakan Redis untuk user service dengan cache-aside pattern.

## Cache Keys Structure

Semua cache keys dikelola melalui static class `UserCache`:

```typescript
// User by ID
user:profile:id:{userId}

// User by email
user:profile:email:{email}

// User by phone
user:profile:phone:{phoneNumber}

// User detail by ID
user:profile:detail:id:{userId}

// User list with pagination and filters (versioned)
user:profile:list:v{version}:page:{page}:limit:{limit}
user:profile:list:v{version}:page:{page}:limit:{limit}:role:{role}
user:profile:list:v{version}:page:{page}:limit:{limit}:status:{status}

// User list version key (used for cache invalidation)
user:profile:list:version

// User statistics
user:profile:stats:all
```

## Cache TTL Configuration

Dikelola melalui static class `UserCacheTTL`:

| Cache Type | TTL | Reason |
|------------|-----|--------|
| User Detail (by ID/email) | 5 minutes (300s) | Frequently accessed, relatively stable |
| User List | 2 minutes (120s) | May change with new registrations |
| Email Exists | 10 minutes (600s) | Rarely changes once set |

## Cached Methods

### ✅ Implemented

1. **`findById(id: string)`**
   - Cache Key: `user:id:{userId}`
   - TTL: 5 minutes
   - Pattern: Cache-aside with `wrap()`

2. **`findByIdSelective(id: string, fields: K[])`**
   - Cache Key: `user:id:{userId}:fields:{sortedFields}`
   - TTL: 5 minutes
   - Pattern: Cache-aside with `wrap()`
   - Note: Fields are sorted to ensure consistent cache keys

3. **`findByEmail(email: string)`**
   - Cache Key: `user:email:{email}`
   - TTL: 5 minutes
   - Pattern: Cache-aside with `wrap()`

4. **`findAll(params)`**
   - Cache Key: `user:list:page:{page}:limit:{limit}:...filters`
   - TTL: 2 minutes
   - Pattern: Cache-aside with `wrap()`
   - Note: Each combination of pagination and filters gets unique cache

5. **`isEmailExists(email: string)`**
   - Cache Key: `user:email-exists:{email}`
   - TTL: 10 minutes
   - Pattern: Cache-aside with `wrap()`

### ⏳ Not Cached (Write Operations)

The following methods are NOT cached as they are write operations:
- `create()` - Creates new user
- `update()` - Updates user data
- `upsertOAuthUser()` - OAuth user creation/update
- `clearRefreshTokens()` - Clears refresh tokens
- `markEmailAsVerified()` - Email verification

## Cache Invalidation Patterns

Cache keys yang perlu di-invalidate saat data berubah:

### ✨ Cache Versioning for Lists

Instead of using wildcard deletion (`user:list:*`), we use a **version-based invalidation** approach:

1. **Version Key**: `user:profile:list:version` stores an integer counter
2. **Versioned List Keys**: All list cache keys include the current version (e.g., `user:profile:list:v0:page:1:limit:10`)
3. **Invalidation**: When a user changes, we increment the version counter using Redis `INCR` command
4. **Result**: All cached lists with old version become stale automatically without wildcard deletion

**Benefits:**
- ✅ No wildcard deletion (better Redis performance)
- ✅ O(1) invalidation complexity
- ✅ Atomic operation (INCR is atomic)
- ✅ Old cache entries expire naturally via TTL

### On User Update (`save()` method)

```typescript
// Delete specific keys:
- user:profile:id:{userId}
- user:profile:detail:id:{userId}
- user:profile:email:{email}
- user:profile:phone:{phoneNumber} (if exists)
- user:profile:stats:all

// Increment version (invalidates all lists):
- INCR user:profile:list:version
```

### On User Delete (`delete()` method)

```typescript
// Delete specific keys:
- user:profile:id:{userId}

// Increment version (invalidates all lists):
- INCR user:profile:list:version
```

### Cache Versioning Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Read Operation (findAllUsers)                        │
│    - GET user:profile:list:version → returns 0          │
│    - GET user:profile:list:v0:page:1:limit:10           │
│    - Cache miss → Query DB → Store with key v0          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Write Operation (save/delete user)                   │
│    - DEL user:profile:id:{userId}                       │
│    - DEL user:profile:detail:id:{userId}                │
│    - INCR user:profile:list:version → returns 1         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Subsequent Read Operation                            │
│    - GET user:profile:list:version → returns 1          │
│    - GET user:profile:list:v1:page:1:limit:10           │
│    - Cache miss → Query DB → Store with key v1          │
│    - Old key (v0) expires via TTL                       │
└─────────────────────────────────────────────────────────┘
```

## Implementation Notes

1. **Cache-Aside Pattern**: All read operations use `cacheService.wrap()` which implements cache-aside pattern automatically
2. **Error Handling**: If cache operations fail, the application falls back to database queries
3. **Cache Versioning**: List caches use version-based invalidation to avoid expensive wildcard deletions
4. **Version Storage**: The version counter is stored in Redis and incremented atomically using `INCR` command
5. **Performance**: Cache keys are designed to be specific enough to avoid false cache hits
6. **Scalability**: Version-based invalidation is O(1) and works efficiently even with thousands of cached list combinations

## Usage Example

```typescript
// Service automatically handles caching
const user = await this.usersService.findById(userId);
// First call: Cache miss → DB query → Store in cache
// Subsequent calls: Cache hit → Return from cache

// After 5 minutes, cache expires
// Next call: Cache miss → DB query → Store in cache again

// For list queries with versioning:
const users = await this.usersService.findAll({ page: 1, limit: 10 });
// 1. GET user:profile:list:version → 0
// 2. GET user:profile:list:v0:page:1:limit:10 → Cache miss
// 3. Query DB → Store in cache with v0 key

// After user update:
await this.usersService.update(userId, updateData);
// 1. DEL user:profile:id:{userId}
// 2. INCR user:profile:list:version → 1

// Next list query:
const users = await this.usersService.findAll({ page: 1, limit: 10 });
// 1. GET user:profile:list:version → 1
// 2. GET user:profile:list:v1:page:1:limit:10 → Cache miss
// 3. Query DB → Store in cache with v1 key
// Old v0 cache will expire via TTL
```

## Future Improvements

1. ✅ ~~Implement cache invalidation on write operations~~ (Completed with version-based invalidation)
2. Add cache warming strategy for frequently accessed users
3. Implement stale-while-revalidate pattern for better UX
4. Add cache metrics and monitoring
5. Consider implementing cache stampede protection for high-traffic scenarios
6. Implement cache for user statistics with smart invalidation
