# Web Vitals Tracking

Automatic tracking of Core Web Vitals metrics using PostHog analytics.

## Overview

This feature automatically captures and reports Core Web Vitals metrics to PostHog for performance monitoring and analysis. Web Vitals are initialized when the PostHog provider mounts.

## Metrics Tracked

| Metric | Name | Description | Good Threshold |
|--------|------|-------------|---------------|
| **CLS** | Cumulative Layout Shift | Visual stability measure | < 0.1 |
| **LCP** | Largest Contentful Paint | Loading performance | < 2.5s |
| **INP** | Interaction to Next Paint | Responsiveness (replaces FID) | < 200ms |
| **TTFB** | Time to First Byte | Server response time | < 800ms |

## Implementation

### Automatic Initialization

Web Vitals tracking is automatically initialized in the `PostHogProvider`:

```typescript
// src/components/providers/posthog-provider.tsx
import { reportWebVitals } from "@/lib/analytics/web-vitals";

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    initPostHog();
    reportWebVitals(); // Automatically starts tracking
  }, []);
  
  // ...
}
```

### Manual Usage

You can also manually initialize web vitals tracking:

```typescript
import { reportWebVitals } from "@/lib/analytics";

// Call once on app initialization (client-side only)
reportWebVitals();
```

## Data Structure

Each web vital metric is sent to PostHog with the following properties:

```typescript
{
  name: "CLS" | "LCP" | "INP" | "TTFB",
  value: number,           // Metric value
  rating: "good" | "needs-improvement" | "poor",
  id: string,              // Unique metric ID
  navigationType: "navigate" | "reload" | "back-forward"
}
```

## Viewing Data in PostHog

### Event Name
- Event: `web_vital`

### Filter Examples

**By metric name:**
```
web_vital where name = "LCP"
```

**By performance rating:**
```
web_vital where rating = "poor"
```

**By navigation type:**
```
web_vital where navigationType = "navigate"
```

### Insights to Create

1. **Average LCP by Page**
   - Event: `web_vital`
   - Filter: `name = "LCP"`
   - Aggregate: Average value
   - Breakdown: Current URL

2. **Poor CLS Occurrences**
   - Event: `web_vital`
   - Filter: `name = "CLS" AND rating = "poor"`
   - Aggregate: Total count
   - Chart: Time series

3. **Performance by User Plan**
   - Event: `web_vital`
   - Aggregate: Average value
   - Breakdown: User plan
   - Filter: Last 30 days

## Performance Thresholds

### Good
- **CLS**: < 0.1
- **LCP**: < 2.5s (2500ms)
- **INP**: < 200ms
- **TTFB**: < 800ms

### Needs Improvement
- **CLS**: 0.1 - 0.25
- **LCP**: 2.5s - 4.0s
- **INP**: 200ms - 500ms
- **TTFB**: 800ms - 1800ms

### Poor
- **CLS**: > 0.25
- **LCP**: > 4.0s (4000ms)
- **INP**: > 500ms
- **TTFB**: > 1800ms

## Technical Details

### Dependencies
- `web-vitals@5.1.0` - Google's Web Vitals library
- `posthog-js` - Analytics client

### Browser Support
Web Vitals are supported in all modern browsers. The library gracefully handles unsupported browsers.

### Performance Impact
The web-vitals library is lightweight (~3KB gzipped) and uses the Performance Observer API, which has minimal performance overhead.

### Privacy
Web Vitals metrics contain no PII (Personally Identifiable Information) and are safe to track for all users.

## Testing

Run tests:
```bash
STRIPE_SECRET_KEY="sk_test_mock" npx vitest run tests/unit/lib/analytics/web-vitals.test.ts
```

## References

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Core Web Vitals Guide](https://web.dev/articles/vitals)
- [web-vitals npm package](https://www.npmjs.com/package/web-vitals)
- [PostHog Documentation](https://posthog.com/docs)

## Troubleshooting

### Metrics not appearing in PostHog

1. Verify PostHog is initialized:
   ```typescript
   import { getPostHog } from "@/lib/analytics";
   console.log(getPostHog().__loaded); // Should be true
   ```

2. Check browser console for errors

3. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set in `.env`

### Metrics showing as "poor"

1. Check actual metric values in PostHog
2. Test on real devices (not just dev server)
3. Consider:
   - Image optimization
   - Code splitting
   - Server response time
   - Layout shift causes

## Future Enhancements

Potential improvements:
- Sentry integration for performance monitoring alerts
- Automatic performance regression detection
- Custom performance budgets
- Integration with Lighthouse CI
