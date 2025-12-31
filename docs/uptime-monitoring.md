# Uptime Monitoring

Comprehensive guide for setting up uptime monitoring to detect outages and receive alerts for your SaaS application.

## Overview

This SaaS boilerplate includes a production-ready health check endpoint that monitors critical services. This guide covers:

1. **Health Check Endpoint** - Built-in API endpoint for monitoring
2. **External Monitoring Setup** - Free and paid service options
3. **Alert Configuration** - Best practices for notifications
4. **Incident Response** - What to do when alerts trigger

## Health Check Endpoint

### Endpoint Details

```
GET /api/health
```

**Response Format:**

```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "timestamp": "2024-01-31T14:30:22.123Z",
  "services": {
    "database": {
      "status": "connected" | "disconnected",
      "latency_ms": 12
    },
    "redis": {
      "status": "connected" | "disconnected",
      "latency_ms": 5
    }
  },
  "error": "Optional error message if degraded/unhealthy"
}
```

### Status Codes

| HTTP Status | Health Status | Meaning |
|-------------|---------------|---------|
| 200 | `healthy` | All services operational |
| 200 | `degraded` | One service down (Redis), app still functional |
| 503 | `unhealthy` | Critical services down (Database or all services) |

### What It Monitors

1. **PostgreSQL Database**
   - Executes `SELECT 1` query
   - Measures query latency
   - Critical for application functionality

2. **Redis Cache**
   - Checks connection status
   - Measures ping latency
   - Non-critical (app degrades gracefully)

### Testing Locally

```bash
# Test health endpoint
curl http://localhost:3000/api/health | jq

# Expected healthy response
{
  "status": "healthy",
  "timestamp": "2024-01-31T14:30:22.123Z",
  "services": {
    "database": {
      "status": "connected",
      "latency_ms": 12
    },
    "redis": {
      "status": "connected",
      "latency_ms": 5
    }
  }
}
```

### Testing on Production

```bash
# Replace with your production domain
curl https://your-domain.com/api/health | jq

# Test from multiple locations
curl https://your-domain.com/api/health -H "X-Real-IP: 1.2.3.4"
```

## External Monitoring Services

### Option 1: UptimeRobot (Recommended - Free)

**Why UptimeRobot:**
- Free tier: 50 monitors, 5-minute intervals
- Email, SMS, Slack, Discord alerts
- Public status pages
- Simple setup

**Setup Instructions:**

1. **Sign up:** https://uptimerobot.com

2. **Create HTTP(s) Monitor:**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Your SaaS - Production`
   - URL: `https://your-domain.com/api/health`
   - Monitoring Interval: `5 minutes` (free tier)

3. **Configure Alert Contacts:**
   - Add Email: Your admin email
   - Add Slack: (Optional) `#alerts` channel
   - Add PagerDuty: (Optional, for on-call rotations)

4. **Advanced Settings:**
   - Keyword Monitoring: `"status":"healthy"` (ensures valid response)
   - HTTP Status Codes: `200` (for healthy, degraded is still 200)
   - Timeout: `30 seconds`
   - Alert After: `1 failed check` (5 minutes downtime)

5. **Create Additional Monitors:**
   - Monitor 2: Homepage (`https://your-domain.com`)
   - Monitor 3: Login page (`https://your-domain.com/login`)
   - Monitor 4: API endpoint (`https://your-domain.com/api/session/validate`)

### Option 2: Better Uptime (Alternative - Free)

**Why Better Uptime:**
- Free tier: Unlimited monitors, 3-minute intervals
- Incident management
- On-call scheduling
- Modern UI

**Setup Instructions:**

1. **Sign up:** https://betteruptime.com

2. **Create Monitor:**
   - Click "Create Monitor"
   - URL: `https://your-domain.com/api/health`
   - Check frequency: `3 minutes`
   - Regions: Select 2-3 regions (e.g., US East, EU, Asia)

3. **Configure Expected Response:**
   - Status code: `200`
   - Response contains: `"status":"healthy"`

4. **Setup Alerts:**
   - Email: Your admin email
   - Slack: Connect workspace
   - SMS: (Paid tier)
   - Phone call: (Paid tier)

5. **Create Status Page:**
   - Public status page for customers
   - Custom domain: `status.your-domain.com`
   - Show uptime percentage

### Option 3: Pingdom (Paid - Enterprise)

**Why Pingdom:**
- More granular intervals (1-minute checks)
- Global monitoring locations
- Real user monitoring (RUM)
- Detailed performance analytics

**Pricing:** Starting at $10/month

**Setup:**
1. Sign up: https://www.pingdom.com
2. Add uptime check: `https://your-domain.com/api/health`
3. Configure 20+ global monitoring locations
4. Setup advanced alerts with escalation

### Option 4: Healthchecks.io (Simple - Free)

**Why Healthchecks.io:**
- Dead simple
- Free tier: 20 checks
- Open source (self-hostable)

**Setup:**
1. Sign up: https://healthchecks.io
2. Create check with URL: `https://your-domain.com/api/health`
3. Configure grace period: 5 minutes
4. Add email/Slack integration

## Alerting Configuration

### Alert Channels

#### 1. Email (Required)

**Setup:**
- Primary: Your admin email
- Secondary: Team distribution list
- Frequency: Immediate on downtime, summary for recoveries

**Email Filter Rules:**
- Label: `[CRITICAL] Downtime Alert`
- Forward to mobile device
- Star/flag for visibility

#### 2. Slack/Discord (Recommended)

**Slack Setup:**
1. Create dedicated channel: `#production-alerts`
2. Connect monitoring service via webhook
3. Configure @channel mentions for critical alerts
4. Set channel to high priority notifications

**Discord Setup:**
1. Create channel: `#alerts`
2. Create webhook in channel settings
3. Add webhook URL to monitoring service

#### 3. SMS (Critical Sites Only)

**When to use:**
- High-traffic production sites
- E-commerce/transactional apps
- After-hours critical alerts

**Services:**
- UptimeRobot: $5/month for SMS
- Better Uptime: Included in paid tier
- PagerDuty: Enterprise on-call management

#### 4. Phone Call (Enterprise)

**For mission-critical apps:**
- PagerDuty: On-call rotations
- Better Uptime: Incident escalation
- Twilio: Custom phone alerts

### Alert Escalation Policy

**Tier 1 - First 5 minutes:**
- Email to on-call engineer
- Slack notification in #alerts

**Tier 2 - 10 minutes downtime:**
- SMS to on-call engineer
- Slack @channel mention
- Page backup engineer

**Tier 3 - 30 minutes downtime:**
- Phone call to engineering lead
- Email to management
- Update status page

### Alert Fatigue Prevention

**Best Practices:**

1. **Consolidate Alerts:**
   - 1 alert after first failure
   - Summary email after recovery
   - No alerts for degraded state (unless prolonged)

2. **Quiet Hours (Optional):**
   - Delay non-critical alerts during off-hours
   - Batch alerts for morning review
   - Always alert for 503 errors immediately

3. **Alert Thresholds:**
   - Alert after 1 failed check (5 minutes)
   - Don't alert for single blips
   - Confirm downtime before escalating

4. **False Positive Reduction:**
   - Use keyword monitoring (`"status":"healthy"`)
   - Check from multiple regions
   - Increase timeout to 30 seconds

## Recommended Setup (Solo Founder)

**Pragmatic monitoring for early stage:**

1. **UptimeRobot Free Tier:**
   - 4 monitors (health, homepage, login, API)
   - 5-minute intervals
   - Email + Slack alerts

2. **Alert Channels:**
   - Email: Your primary email
   - Slack: #alerts channel (or personal DM)
   - No SMS initially (unless critical)

3. **Monitoring Checklist:**
   - [ ] Health endpoint: `/api/health`
   - [ ] Homepage: `/`
   - [ ] Login: `/login`
   - [ ] API: `/api/session/validate`

4. **Response Plan:**
   - Get alert → Check status page
   - SSH into server → Check logs
   - Restart services if needed
   - Update status page
   - Post-mortem after recovery

## Recommended Setup (Team)

**For teams with 3+ engineers:**

1. **Better Uptime Paid Tier:**
   - Unlimited monitors
   - 1-minute intervals
   - On-call schedules
   - Incident management

2. **Alert Channels:**
   - Email: team-alerts@your-domain.com
   - Slack: #production-alerts
   - PagerDuty: On-call rotation
   - SMS: On-call engineer

3. **Monitoring Checklist:**
   - [ ] Health endpoints (all environments)
   - [ ] Critical user flows (login, signup, checkout)
   - [ ] API endpoints
   - [ ] Database backups (success notifications)
   - [ ] SSL certificate expiration

4. **On-Call Rotation:**
   - Primary: Weekly rotation
   - Backup: Secondary engineer
   - Escalation: Engineering manager

## Multi-Region Monitoring

**For global apps:**

### Check from Multiple Locations

**UptimeRobot:**
- Free tier: US East only
- Paid tier: 10+ global locations

**Better Uptime:**
- Free tier: 2-3 regions
- Paid tier: 20+ regions

**Why multi-region:**
- Detect regional outages
- Confirm true downtime (not network issues)
- Monitor CDN performance

### Recommended Regions

| Region | Purpose |
|--------|---------|
| US East | Largest user base (usually) |
| US West | Secondary US region |
| EU West | European users |
| Asia Pacific | Asian users |
| South America | LATAM coverage |

## Status Page

### Why You Need One

- Transparency for customers
- Reduce support tickets during outages
- Build trust

### Setup with UptimeRobot

1. Go to "Public Status Pages"
2. Create new status page
3. Add monitors to display
4. Customize:
   - Logo
   - Brand colors
   - Custom domain (optional)
5. Share URL with customers

### Custom Domain (Optional)

**Setup `status.your-domain.com`:**

1. **DNS Configuration:**
   ```
   status.your-domain.com CNAME stats.uptimerobot.com
   ```

2. **UptimeRobot Settings:**
   - Go to status page settings
   - Add custom domain
   - Verify DNS

### What to Display

**Public Status Page:**
- Overall status (Operational / Degraded / Outage)
- Individual service status
- Uptime percentage (90 days)
- Incident history

**Don't display:**
- Internal service details
- Server metrics
- Database status (just say "API")

## Incident Response

### When Alert Triggers

**1. Acknowledge Alert (2 minutes)**
- Check monitoring dashboard
- Verify outage is real
- Update status page: "Investigating"

**2. Diagnose Issue (5 minutes)**
```bash
# SSH into production server
ssh deploy@your-production-server

# Check application logs
docker service logs saas_app --tail 100 --follow

# Check health endpoint directly
curl http://localhost:3000/api/health

# Check service status
docker service ps saas_app

# Check database
docker service ps saas_postgres

# Check Redis
docker service ps saas_redis
```

**3. Immediate Fix (10 minutes)**
```bash
# If services are down, restart
docker service update --force saas_app

# If database is down
docker service update --force saas_postgres

# If Redis is down (non-critical)
docker service update --force saas_redis
```

**4. Communicate (Throughout)**
- Status page: "Identified - Database connection issue"
- Status page: "Monitoring - Services restarted"
- Status page: "Resolved - All systems operational"

**5. Post-Mortem (24 hours later)**
- Document what happened
- Why it happened
- How it was fixed
- How to prevent it

### Common Issues & Fixes

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| App not responding | `docker service ps saas_app` shows crashed containers | `docker service update --force saas_app` |
| Database timeout | `docker service logs saas_postgres` shows errors | Restart: `docker service update --force saas_postgres` |
| Redis down | `/api/health` shows degraded | Restart: `docker service update --force saas_redis` (non-critical) |
| Out of memory | `docker stats` shows high memory | Scale down: `docker service scale saas_app=2` |
| SSL expired | Monitoring shows SSL error | Renew certificate (see SSL docs) |

## Advanced Monitoring

### Application Performance Monitoring (APM)

**Beyond uptime - monitor performance:**

1. **Sentry** (Error tracking)
   - Free tier: 5k errors/month
   - Tracks exceptions, errors
   - Performance monitoring

2. **LogRocket** (Session replay)
   - See what users see during errors
   - Paid: $99/month

3. **Datadog** (Full observability)
   - Infrastructure monitoring
   - APM
   - Log aggregation
   - Enterprise pricing

### Custom Metrics

**Monitor business metrics:**

```typescript
// Example: Track critical user actions
await trackMetric('user.signup', { success: true });
await trackMetric('payment.processed', { amount: 99 });
```

**Alert on business issues:**
- Signup conversion drops below 2%
- Payment success rate drops below 95%
- API error rate exceeds 1%

### Database Monitoring

**Monitor database performance:**

```bash
# Monitor slow queries
docker exec $(docker ps -q -f name=saas_postgres) \
  psql -U postgres -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Monitor connections
docker exec $(docker ps -q -f name=saas_postgres) \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

**Setup pgBadger for query analysis:**
- Analyzes PostgreSQL logs
- Identifies slow queries
- Generates HTML reports

## Monitoring Checklist

### Initial Setup

- [ ] Health endpoint is accessible: `/api/health`
- [ ] UptimeRobot account created
- [ ] 4 monitors configured (health, homepage, login, API)
- [ ] Email alerts configured
- [ ] Slack/Discord webhook added
- [ ] Public status page created
- [ ] Test alert by pausing monitor

### Weekly Maintenance

- [ ] Review uptime percentage (goal: 99.9%+)
- [ ] Check alert history for patterns
- [ ] Verify monitors are still accurate
- [ ] Update status page for planned maintenance

### Monthly Review

- [ ] Analyze downtime incidents
- [ ] Identify recurring issues
- [ ] Update monitoring based on new features
- [ ] Test alert escalation

### Quarterly Audit

- [ ] Review monitoring service costs
- [ ] Evaluate if paid tier is needed
- [ ] Add monitors for new critical paths
- [ ] Update incident response procedures

## Cost Breakdown

### Free Tier (Recommended for Starting)

| Service | Free Tier | Limit |
|---------|-----------|-------|
| UptimeRobot | $0/month | 50 monitors, 5-min intervals |
| Better Uptime | $0/month | Unlimited monitors, 3-min |
| Healthchecks.io | $0/month | 20 checks |
| Status page | $0/month | Included with UptimeRobot |

**Total: $0/month**

### Paid Tier (Recommended for Growth)

| Service | Cost | Features |
|---------|------|----------|
| Better Uptime Pro | $20/month | 1-min intervals, on-call, SMS |
| Sentry | $26/month | 50k errors, performance monitoring |
| Status page | $0 | Included |

**Total: $46/month**

### Enterprise Tier

| Service | Cost | Features |
|---------|------|----------|
| Pingdom | $100/month | 1-min intervals, 20+ locations |
| PagerDuty | $30/user | On-call rotations, escalations |
| Datadog | $300/month | Full observability, APM, logs |
| Status page | $29/month | Custom branding, SLA reporting |

**Total: $459/month**

## Troubleshooting

### Monitor Shows Down But Site Works

**Possible causes:**
1. Temporary network blip
2. Monitoring service issue
3. Rate limiting blocking health checks

**Solutions:**
- Check from multiple regions
- Verify health endpoint directly: `curl https://your-domain.com/api/health`
- Whitelist monitoring service IPs (if using rate limiting)

### False Positives

**Reduce false alerts:**
- Increase timeout to 30 seconds
- Alert after 2 consecutive failures
- Use keyword monitoring: `"status":"healthy"`
- Check from multiple regions

### Health Check Times Out

**Possible causes:**
- Database query is slow
- Server is overloaded
- Network latency

**Solutions:**
```bash
# Check database performance
docker exec $(docker ps -q -f name=saas_postgres) \
  psql -U postgres -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check server resources
docker stats

# Scale up if needed
docker service scale saas_app=3
```

### Degraded State Not Alerting

**Expected behavior:**
- Degraded (Redis down) returns 200 status
- Most monitors alert only on 5xx errors

**Solutions:**
- Use keyword monitoring: Alert if response doesn't contain `"status":"healthy"`
- Create separate monitor for Redis status
- Accept that Redis downtime is non-critical

## Support & Resources

### Documentation
- [Database Backup Guide](/docs/database-backup.md)
- [Deployment Guide](/CLAUDE.md#docker-swarm-deployment)

### Monitoring Services
- UptimeRobot: https://uptimerobot.com
- Better Uptime: https://betteruptime.com
- Pingdom: https://www.pingdom.com
- Healthchecks.io: https://healthchecks.io

### Community
- GitHub Issues: Report bugs or issues
- Discord: Join our community (if applicable)

## Quick Start

**Get monitoring running in 10 minutes:**

1. **Test health endpoint:**
   ```bash
   curl https://your-domain.com/api/health | jq
   ```

2. **Sign up for UptimeRobot:** https://uptimerobot.com

3. **Create monitor:**
   - URL: `https://your-domain.com/api/health`
   - Interval: 5 minutes
   - Alert: Your email

4. **Test alert:**
   - Pause monitor
   - Verify you receive email
   - Resume monitor

5. **Create status page:**
   - Go to "Public Status Pages"
   - Create new page
   - Share URL with team

**Done!** You now have basic uptime monitoring.
