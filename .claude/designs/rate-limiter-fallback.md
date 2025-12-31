# Technical Design: Rate Limiter Fallback Mechanism

## Overview
Add in-memory fallback rate limiting to prevent authentication endpoint abuse during Redis outages.

## Problem Statement
Current implementation fails open when Redis is unavailable, allowing unlimited requests during downtime. This creates a security vulnerability for authentication endpoints (login, register, password reset, 2FA).

## Design Goals
1. **Security**: Maintain rate limiting even when Redis fails
2. **Simplicity**: Minimal complexity, easy to understand
3. **Performance**: Low overhead, automatic cleanup
4. **Observability**: Clear logging when fallback is active

## Architecture

### In-Memory Fallback Strategy

```typescript
// Memory-based fallback using Map with automatic cleanup
class InMemoryRateLimiter {
  private cache = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  interface RateLimitEntry {
    requests: Array<{ timestamp: number; id: string }>;
    windowStart: number;
  }
  
  // Conservative limits (50% of Redis limits)
  private readonly FALLBACK_MULTIPLIER = 0.5;
  
  check(key: string, limit: number, window: number): RateLimitResult;
  cleanup(): void; // Remove expired entries
  clear(): void; // For testing
}
```

### Integration Points

1. **Redis client enhancement** (`src/lib/redis/client.ts`)
   - Add health check with circuit breaker pattern
   - Track consecutive failures
   - Expose `isHealthy()` method

2. **Rate limiter enhancement** (`src/lib/rate-limit/index.ts`)
   - Detect Redis failures
   - Fallback to in-memory limiter
   - Log fallback activation/deactivation
   - Use conservative limits (50% of configured)

3. **Logging** (`src/lib/logger/index.ts`)
   - WARN when fallback activates
   - INFO when Redis recovers
   - ERROR for consecutive Redis failures

## Implementation Details

### Conservative Limits
When using fallback, apply stricter limits to be extra cautious:

| Endpoint | Normal Limit | Fallback Limit |
|----------|--------------|----------------|
| Auth | 5/min | 2/min |
| Password Reset | 3/15min | 1/15min |
| 2FA | 5/5min | 2/5min |
| API | 100/min | 50/min |

### Memory Management
- Automatic cleanup every 60 seconds
- Remove entries older than 2x window
- Max 10,000 entries (prevent memory leak)
- Clear on server restart (acceptable for emergency fallback)

### Circuit Breaker
```typescript
interface CircuitBreaker {
  consecutiveFailures: number;
  lastFailureTime: number;
  isOpen: boolean; // true = use fallback, false = try Redis
  
  recordFailure(): void;
  recordSuccess(): void;
  shouldUseFallback(): boolean;
}
```

- After 3 consecutive Redis failures → open circuit (use fallback)
- After 30 seconds with circuit open → attempt Redis again
- On success → close circuit (use Redis)

## Data Flow

```
Request → rateLimit()
    |
    ├─> Check circuit breaker
    |   ├─> Circuit CLOSED → Try Redis
    |   |   ├─> Success → return result
    |   |   └─> Failure → record failure, use fallback
    |   └─> Circuit OPEN → Use fallback directly
    |
    └─> InMemoryRateLimiter.check()
        ├─> Get/create entry for key
        ├─> Remove expired timestamps
        ├─> Check count vs limit
        └─> Return result
```

## Error Handling

### Redis Connection Failures
- Log error with context
- Increment failure counter
- Return fallback result
- Don't throw exception

### Memory Overflow
- Limit to 10,000 keys max
- Use LRU eviction (remove oldest entries first)
- Log warning if approaching limit

## Testing Strategy

### Unit Tests
1. Fallback activates on Redis error
2. Rate limiting works in fallback mode
3. Conservative limits applied (50% reduction)
4. Cleanup removes expired entries
5. Circuit breaker opens/closes correctly
6. Memory limit enforced

### Integration Tests
1. Redis down → fallback active
2. Redis recovers → switch back to Redis
3. Multiple concurrent requests
4. Memory doesn't leak over time

## Monitoring & Observability

### Logs
```typescript
// When fallback activates
logger.warn({
  component: 'rate-limit',
  event: 'fallback_activated',
  reason: error.message,
  consecutiveFailures: 3
}, 'Rate limiter using in-memory fallback');

// When Redis recovers
logger.info({
  component: 'rate-limit',
  event: 'redis_recovered',
  downtimeDuration: '45s'
}, 'Rate limiter resumed using Redis');
```

### Metrics (Future Enhancement)
- `rate_limit.fallback.active` (gauge: 0 or 1)
- `rate_limit.fallback.requests` (counter)
- `rate_limit.redis.failures` (counter)

## Security Considerations

1. **Conservative Limits**: Fallback uses 50% of normal limits
2. **No Bypass**: Fallback still enforces rate limiting
3. **Fail Secure**: If fallback also fails, deny request
4. **Log All Failures**: Track when fallback is used for security audit

## Performance Impact

### Memory Usage
- Per entry: ~100 bytes (key + timestamps array)
- Max entries: 10,000
- Peak memory: ~1MB (negligible)

### CPU Impact
- Cleanup every 60s: O(n) where n = entries
- Per request: O(m) where m = requests in window
- Typical case: O(5) for auth endpoints
- Negligible overhead

## Rollout Plan

1. **Develop & Test** (this PR)
   - Implement in-memory fallback
   - Add comprehensive tests
   - Security audit

2. **Deploy to Preprod**
   - Monitor logs for fallback activation
   - Verify no performance impact
   - Test Redis restart scenario

3. **Deploy to Production**
   - Monitor closely for 24h
   - Check logs for unexpected fallback usage
   - Validate no auth failures

## Alternatives Considered

### 1. Fail Closed (Deny All)
❌ Rejected: Would lock out users during Redis outage

### 2. External Rate Limit Service
❌ Rejected: Adds complexity, same availability concern

### 3. Fail Open (Current)
❌ Rejected: Security vulnerability

### 4. In-Memory Fallback ✅
✅ Selected: Balances security, availability, simplicity

## Success Criteria

- [ ] Redis failure doesn't disable rate limiting
- [ ] Fallback uses conservative limits (50% reduction)
- [ ] Logging clearly indicates fallback status
- [ ] Tests cover all failure scenarios
- [ ] No memory leaks
- [ ] Auto-recovery when Redis returns

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
