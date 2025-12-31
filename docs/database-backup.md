# Database Backup & Restore

Comprehensive guide for backing up and restoring PostgreSQL databases across all environments.

## Overview

This SaaS boilerplate includes multiple backup strategies:

1. **Automated Daily Backups** (Production/Preprod only)
2. **Manual On-Demand Backups** (All environments)
3. **Optional Remote Backups** (S3/DigitalOcean Spaces)

## Backup Strategy

### Retention Policy

| Type | Retention | Environment |
|------|-----------|-------------|
| Daily | Last 7 days | Production, Preprod |
| Weekly | Last 4 weeks | Production, Preprod |
| Monthly | Last 6 months | Production, Preprod |
| Manual | Last 30 backups | All |

### Storage Locations

| Environment | Path | Size Limit |
|-------------|------|------------|
| Local | `./backups/` | Unlimited |
| Production | `/opt/saas/data/backups/` | Monitor disk space |
| Preprod | `/opt/preprod/data/backups/` | Monitor disk space |

## Automated Backups (Production/Preprod)

### How It Works

Production and preprod environments use the `prodrigestivill/postgres-backup-local:16` Docker image that runs as a service in Docker Swarm.

**Configuration** (in `docker-compose.prod.yml` and `docker-compose.preprod.yml`):

```yaml
backup:
  image: prodrigestivill/postgres-backup-local:16
  environment:
    POSTGRES_HOST: postgres
    POSTGRES_DB: ${POSTGRES_DB:-saas}
    POSTGRES_USER: ${POSTGRES_USER:-postgres}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    SCHEDULE: "@daily"           # Runs at midnight UTC
    BACKUP_KEEP_DAYS: 7          # Keep last 7 daily backups
    BACKUP_KEEP_WEEKS: 4         # Keep last 4 weekly backups
    BACKUP_KEEP_MONTHS: 6        # Keep last 6 monthly backups
  volumes:
    - backup_data:/backups
```

### Backup Schedule

- **Daily**: Every day at 00:00 UTC
- **Weekly**: Every Sunday (automatically selected from daily backups)
- **Monthly**: First day of each month (automatically selected from daily backups)

### Viewing Automated Backups

**Production:**
```bash
ssh deploy@your-production-server
ls -lh /opt/saas/data/backups/
```

**Preprod:**
```bash
ssh deploy@your-preprod-server
ls -lh /opt/preprod/data/backups/
```

### Monitoring Backup Service

**Check service status:**
```bash
docker service ps saas_backup
```

**View backup logs:**
```bash
docker service logs saas_backup --follow
```

**Manually trigger backup:**
```bash
# Find the backup container
CONTAINER=$(docker ps -q -f "name=saas_backup")

# Trigger backup
docker exec $CONTAINER /backup.sh
```

## Manual Backups (All Environments)

### Local Development

**Create backup:**
```bash
./scripts/backup.sh
```

**List backups:**
```bash
ls -lh ./backups/
```

**Example output:**
```
saas_20240131_143022.sql.gz  (2.3M)
saas_20240131_120000.sql.gz  (2.1M)
```

### Production Server

**SSH into server:**
```bash
ssh deploy@your-production-server
cd /opt/saas
```

**Create manual backup:**
```bash
./scripts/backup.sh production
```

**Backups stored at:**
```
/opt/saas/data/backups/manual/
```

### Preprod Server

**SSH into server:**
```bash
ssh deploy@your-preprod-server
cd /opt/preprod
```

**Create manual backup:**
```bash
./scripts/backup.sh preprod
```

**Backups stored at:**
```
/opt/preprod/data/backups/manual/
```

## Restore From Backup

### Local Development

**1. Stop the application:**
```bash
# Stop Next.js dev server (Ctrl+C)
```

**2. Restore from backup:**
```bash
./scripts/restore.sh ./backups/saas_20240131_143022.sql.gz
```

**3. Restart application:**
```bash
pnpm dev
```

### Production Server

**IMPORTANT:** This is a destructive operation. Always:
1. Create a fresh backup first
2. Notify users of downtime
3. Stop the application during restore

**1. SSH into server:**
```bash
ssh deploy@your-production-server
cd /opt/saas
```

**2. Create pre-restore backup:**
```bash
./scripts/backup.sh production
```

**3. Scale down app (stop accepting traffic):**
```bash
docker service scale saas_app=0
```

**4. Restore from backup:**
```bash
./scripts/restore.sh /opt/saas/data/backups/saas_20240131_143022.sql.gz production
```

**5. Scale app back up:**
```bash
docker service scale saas_app=3  # or your configured replica count
```

**6. Verify application:**
```bash
curl -f http://localhost:3000/api/health
```

### Preprod Server

Same process as production, but use:
- Stack name: `preprod_app`
- Backup path: `/opt/preprod/data/backups/`
- Environment: `preprod`

```bash
docker service scale preprod_app=0
./scripts/restore.sh /opt/preprod/data/backups/saas_20240131_143022.sql.gz preprod
docker service scale preprod_app=2
```

## Download Backups (Production → Local)

### Via SCP

**Download single backup:**
```bash
scp deploy@your-production-server:/opt/saas/data/backups/saas_20240131_143022.sql.gz ./backups/
```

**Download all backups:**
```bash
scp -r deploy@your-production-server:/opt/saas/data/backups/*.sql.gz ./backups/
```

### Via rsync (Better for Multiple Files)

```bash
rsync -avz --progress \
  deploy@your-production-server:/opt/saas/data/backups/ \
  ./backups/production/
```

## Remote Backups (S3/DigitalOcean Spaces)

### Why Remote Backups?

**Disaster Recovery:** Protects against:
- Server hardware failure
- Datacenter issues
- Accidental data deletion
- Ransomware attacks

### Setup DigitalOcean Spaces (Recommended)

**1. Create a Space:**
- Log into DigitalOcean
- Create a Space (e.g., `your-saas-backups`)
- Region: Same as your droplet
- Enable CDN: No (not needed for backups)

**2. Generate API keys:**
- Settings → API → Spaces access keys
- Save Access Key and Secret Key

**3. Install s3cmd on server:**
```bash
ssh deploy@your-production-server
sudo apt-get update
sudo apt-get install -y s3cmd
```

**4. Configure s3cmd:**
```bash
s3cmd --configure
```

Enter:
- Access Key: (from step 2)
- Secret Key: (from step 2)
- Region: (your region, e.g., `nyc3`)
- S3 Endpoint: `nyc3.digitaloceanspaces.com` (adjust for your region)
- DNS-style bucket: `%(bucket)s.nyc3.digitaloceanspaces.com`

**5. Create backup sync script:**
```bash
# On production server
cat > /opt/saas/scripts/sync-backups-to-spaces.sh << 'SCRIPT'
#!/bin/bash
# Sync local backups to DigitalOcean Spaces

BACKUP_DIR="/opt/saas/data/backups"
SPACE_NAME="your-saas-backups"
SPACE_PATH="production"

# Sync backups to Spaces
s3cmd sync --delete-removed \
  ${BACKUP_DIR}/ \
  s3://${SPACE_NAME}/${SPACE_PATH}/

echo "Backup sync complete: $(date)"
SCRIPT

chmod +x /opt/saas/scripts/sync-backups-to-spaces.sh
```

**6. Setup cron job:**
```bash
crontab -e
```

Add:
```cron
# Sync backups to DigitalOcean Spaces daily at 2 AM
0 2 * * * /opt/saas/scripts/sync-backups-to-spaces.sh >> /var/log/backup-sync.log 2>&1
```

### Setup AWS S3 (Alternative)

**1. Create S3 bucket:**
```bash
aws s3 mb s3://your-saas-backups --region us-east-1
```

**2. Configure lifecycle policy** (optional - auto-delete old backups):
```json
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Prefix": "production/",
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
```

**3. Install AWS CLI on server:**
```bash
ssh deploy@your-production-server
sudo apt-get update
sudo apt-get install -y awscli
aws configure
```

**4. Create sync script:**
```bash
cat > /opt/saas/scripts/sync-backups-to-s3.sh << 'SCRIPT'
#!/bin/bash
# Sync local backups to AWS S3

BACKUP_DIR="/opt/saas/data/backups"
S3_BUCKET="your-saas-backups"
S3_PATH="production"

# Sync backups to S3
aws s3 sync ${BACKUP_DIR}/ s3://${S3_BUCKET}/${S3_PATH}/ \
  --delete \
  --storage-class STANDARD_IA

echo "Backup sync complete: $(date)"
SCRIPT

chmod +x /opt/saas/scripts/sync-backups-to-s3.sh
```

**5. Setup cron:**
```cron
0 2 * * * /opt/saas/scripts/sync-backups-to-s3.sh >> /var/log/backup-sync.log 2>&1
```

### Restore From Remote Backup

**Download from DigitalOcean Spaces:**
```bash
s3cmd get s3://your-saas-backups/production/saas_20240131_143022.sql.gz ./
```

**Download from AWS S3:**
```bash
aws s3 cp s3://your-saas-backups/production/saas_20240131_143022.sql.gz ./
```

**Then restore normally:**
```bash
./scripts/restore.sh ./saas_20240131_143022.sql.gz production
```

## Backup Testing

**CRITICAL:** Regularly test your backups to ensure they work!

### Monthly Backup Test Procedure

**1. Download a recent production backup:**
```bash
scp deploy@production:/opt/saas/data/backups/latest.sql.gz ./backups/test/
```

**2. Restore to local development:**
```bash
./scripts/restore.sh ./backups/test/latest.sql.gz
```

**3. Verify data integrity:**
```bash
pnpm dev
# Login and check:
# - User accounts work
# - Subscriptions are visible
# - Data looks correct
```

**4. Document results:**
```
✓ Backup date: 2024-01-31
✓ Backup size: 2.3M
✓ Restore time: 12 seconds
✓ Data integrity: Passed
✓ Tested by: [Your name]
```

## Monitoring & Alerts

### Disk Space Monitoring

**Check backup disk usage:**
```bash
# Production
ssh deploy@production
du -sh /opt/saas/data/backups/

# Preprod
ssh deploy@preprod
du -sh /opt/preprod/data/backups/
```

### Setup Disk Alerts (Optional)

Add to server cron:
```bash
cat > /opt/saas/scripts/check-disk-space.sh << 'SCRIPT'
#!/bin/bash
# Alert if backup disk usage exceeds 80%

THRESHOLD=80
CURRENT=$(df /opt/saas/data/backups | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$CURRENT" -gt "$THRESHOLD" ]; then
  echo "WARNING: Backup disk usage at ${CURRENT}%"
  # Send alert (email, Slack, PagerDuty, etc.)
fi
SCRIPT

chmod +x /opt/saas/scripts/check-disk-space.sh

# Run daily
crontab -e
```

Add:
```cron
0 6 * * * /opt/saas/scripts/check-disk-space.sh
```

## Troubleshooting

### Backup Failed: "Connection refused"

**Problem:** Backup service can't connect to PostgreSQL.

**Solution:**
```bash
# Check if PostgreSQL is running
docker service ps saas_postgres

# Check network connectivity
docker exec $(docker ps -q -f name=saas_backup) ping postgres
```

### Restore Failed: "Database is being accessed by other users"

**Problem:** Active connections to database.

**Solution:** The restore script automatically terminates connections, but if it fails:
```bash
# Manually terminate connections
docker exec $(docker ps -q -f name=saas_postgres) psql -U postgres -d postgres -c "
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = 'saas'
    AND pid <> pg_backend_pid();
"
```

### Backup File Corrupted

**Problem:** `gzip: invalid compressed data`

**Solution:**
```bash
# Test backup file
gzip -t backup.sql.gz

# If corrupted, use previous backup
ls -lt /opt/saas/data/backups/ | head -5
```

### Out of Disk Space

**Problem:** `/opt/saas/data/backups/` is full.

**Solution:**
```bash
# Check disk usage
df -h /opt/saas/data/

# Manually clean old backups
find /opt/saas/data/backups/ -name "*.sql.gz" -mtime +30 -delete

# Or increase retention settings in docker-compose.prod.yml
# BACKUP_KEEP_DAYS: 3  # (reduce from 7)
```

## Security Best Practices

### Encryption at Rest

**Encrypt backups before uploading to remote storage:**
```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Upload encrypted backup
s3cmd put backup.sql.gz.gpg s3://your-saas-backups/production/

# Decrypt when needed
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

### Access Control

**Restrict backup directory permissions:**
```bash
# On production server
chmod 700 /opt/saas/data/backups
chown deploy:deploy /opt/saas/data/backups
```

**Restrict S3/Spaces access:**
- Use separate IAM user/API key for backups only
- Grant minimum required permissions (read/write to backup bucket only)
- Enable MFA for production backup access

### Backup Verification

**Always verify backups:**
```bash
# Check file is not empty
if [ -s backup.sql.gz ]; then
  echo "Backup file has content"
fi

# Check file is valid gzip
gzip -t backup.sql.gz && echo "Valid backup"

# Check backup contains data (look for tables)
gunzip -c backup.sql.gz | head -100 | grep "CREATE TABLE"
```

## Emergency Recovery Procedures

### Complete Server Failure

**1. Provision new server:**
```bash
# Use setup script
scp scripts/setup-server.sh root@new-server:/tmp/
ssh root@new-server "ENVIRONMENT=production bash /tmp/setup-server.sh"
```

**2. Deploy application:**
```bash
# Copy docker-compose files and .env
scp docker-compose.yml docker-compose.prod.yml .env deploy@new-server:/opt/saas/

# Deploy stack
ssh deploy@new-server "cd /opt/saas && docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml saas"
```

**3. Restore latest backup:**
```bash
# Download from remote storage
ssh deploy@new-server
s3cmd get s3://your-saas-backups/production/latest.sql.gz /opt/saas/backups/

# Restore
./scripts/restore.sh /opt/saas/backups/latest.sql.gz production
```

**4. Update DNS:**
- Point your domain to new server IP
- Wait for DNS propagation (5-60 minutes)

### Accidental Data Deletion

**Restore to point-in-time before deletion:**
```bash
# Find backup from before deletion
ls -lt /opt/saas/data/backups/ | grep "2024013"

# Restore specific backup
./scripts/restore.sh /opt/saas/data/backups/saas_20240131_120000.sql.gz production
```

### Corrupted Database

**If database is corrupted but backups are healthy:**
```bash
# Immediately create backup of corrupted state (for forensics)
./scripts/backup.sh production

# Restore from latest known good backup
./scripts/restore.sh /opt/saas/data/backups/saas_20240131_143022.sql.gz production
```

## Quick Reference

### Common Commands

```bash
# Local backup
./scripts/backup.sh

# Local restore
./scripts/restore.sh ./backups/saas_20240131_143022.sql.gz

# Production backup
ssh deploy@production "cd /opt/saas && ./scripts/backup.sh production"

# Production restore
ssh deploy@production "cd /opt/saas && ./scripts/restore.sh /path/to/backup.sql.gz production"

# Download production backup
scp deploy@production:/opt/saas/data/backups/latest.sql.gz ./backups/

# Check backup service logs
docker service logs saas_backup --follow

# List all backups
ls -lht /opt/saas/data/backups/ | head -20
```

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review backup service logs
3. Test backup file integrity
4. Verify disk space availability
