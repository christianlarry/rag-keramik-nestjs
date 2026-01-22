# User Service Caching Implementation

## Overview
Implementasi caching layer menggunakan Redis untuk user service dengan cache-aside pattern.

## Cache Keys Structure

Semua cache keys dikelola melalui static class `UserCacheKeys`:

```typescript
// User by ID
user:id:{userId}

// User by email
user:email:{email}

// User by ID with selective fields
user:id:{userId}:fields:{field1,field2,field3}

// User list with pagination and filters
user:list:page:{page}:limit:{limit}
user:list:page:{page}:limit:{limit}:role:{role}
user:list:page:{page}:limit:{limit}:search:{searchTerm}

// Email existence check
user:email-exists:{email}
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

### On User Update (`update()`)
```typescript
// Invalidate:
- user:id:{userId}
- user:email:{email}
- user:email:{oldEmail} (if email changed)
- user:list:* (all list caches)
- user:email-exists:{oldEmail}
- user:email-exists:{newEmail}
```

### On User Create (`create()`)
```typescript
// Invalidate:
- user:list:* (all list caches)
- user:email-exists:{email}
```

### On User Delete
```typescript
// Invalidate:
- user:id:{userId}
- user:email:{email}
- user:list:* (all list caches)
- user:email-exists:{email}
```

### On Email Verification (`markEmailAsVerified()`)
```typescript
// Invalidate:
- user:id:{userId}
- user:email:{email}
```

### On Refresh Token Operations
```typescript
// Invalidate:
- user:id:{userId}
```

## Implementation Notes

1. **Cache-Aside Pattern**: All read operations use `cacheService.wrap()` which implements cache-aside pattern automatically
2. **Error Handling**: If cache operations fail, the application falls back to database queries
3. **Consistency**: Cache invalidation will be implemented in a separate phase
4. **Performance**: Cache keys are designed to be specific enough to avoid false cache hits

## Usage Example

```typescript
// Service automatically handles caching
const user = await this.usersService.findById(userId);
// First call: Cache miss → DB query → Store in cache
// Subsequent calls: Cache hit → Return from cache

// After 5 minutes, cache expires
// Next call: Cache miss → DB query → Store in cache again
```

## Future Improvements

1. Implement cache invalidation on write operations
2. Add cache warming strategy for frequently accessed users
3. Implement stale-while-revalidate pattern for better UX
4. Add cache metrics and monitoring
5. Consider implementing cache stampede protection for high-traffic scenarios
