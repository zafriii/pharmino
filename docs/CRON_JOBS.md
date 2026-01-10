# Cron Jobs Documentation

## Overview

RestroFly uses **node-cron** for automated background tasks. This is a self-contained solution that runs entirely within the Node.js application, making it suitable for deployment on any platform (Railway, Render, DigitalOcean, VPS, etc.).

## Why node-cron?

- **Self-contained**: No external services required
- **Platform-agnostic**: Works anywhere Node.js runs
- **Zero configuration**: No need for external cron setup
- **Development-friendly**: Easy to test and debug locally
- **CodeCanyon-ready**: Perfect for products that need to work out-of-the-box

## Implemented Jobs

### 1. Reservation Status Update
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Purpose**: Automatically updates reservation statuses based on time
- **Actions**:
  - `PENDING` → `ACTIVE`: When reservation time arrives
  - `ACTIVE` → `COMPLETED`: When reservation end time passes

### 2. Discount Expiry
- **Schedule**: Every day at midnight (`0 0 * * *`)
- **Purpose**: Automatically expires discounts that have passed their validity date
- **Actions**:
  - `ACTIVE` → `EXPIRED`: When `validTo` date has passed
- **Logging**: Outputs list of expired discounts for audit trail

## File Structure

```
src/
  lib/
    cron-service.ts          # Main cron service (initialize, start, stop)
    reservation-utils.ts     # Status update logic
  app/
    layout.tsx               # Initializes cron on server startup
    api/
      health/
        route.ts             # Health check endpoint (includes cron status)
      test/
        trigger-cron/
          route.ts           # Manual trigger for testing (dev only)
```

## Configuration

### Cron Service (`src/lib/cron-service.ts`)

```typescript
import cron from 'node-cron';
import { updateReservationStatuses } from './reservation-utils';

// Automatic initialization
export function startCronJobs() {
  // Schedule: Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await updateReservationStatuses();
  }, {
    scheduled: true,
    timezone: 'UTC' // Change if needed
  });
}
```

### Change Schedule

Edit the cron pattern in `src/lib/cron-service.ts`:

```typescript
// Current: Every 5 minutes
'*/5 * * * *'

// Every minute
'* * * * *'

// Every 10 minutes
'*/10 * * * *'

// Every hour
'0 * * * *'

// Every day at midnight
'0 0 * * *'
```

### Change Timezone

Update the timezone option:

```typescript
cron.schedule('*/5 * * * *', async () => {
  // ...
}, {
  scheduled: true,
  timezone: 'America/New_York' // Your timezone
});
```

Common timezones:
- `UTC` - Universal Coordinated Time
- `America/New_York` - Eastern Time (US)
- `America/Los_Angeles` - Pacific Time (US)
- `Europe/London` - GMT/BST
- `Asia/Kolkata` - Indian Standard Time
- `Asia/Tokyo` - Japan Standard Time

## Testing

### 1. Manual Trigger (Development Only)

Visit or curl the test endpoint:

```bash
# Test reservation update
curl http://localhost:3000/api/test/trigger-cron

# Test discount expiry
curl http://localhost:3000/api/test/trigger-cron?type=discount

# Browser (reservation)
http://localhost:3000/api/test/trigger-cron

# Browser (discount)
http://localhost:3000/api/test/trigger-cron?type=discount
```

**Note**: This endpoint is automatically disabled in production for security.

### 2. Check Cron Status

```bash
# Health check includes cron status
curl http://localhost:3000/api/health
```

Response example:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "cron": {
    "initialized": true,
    "reservationUpdateJob": {
      "active": true,
      "running": true
    },
    "discountExpiryJob": {
      "active": true,
      "running": true
    }
  }
}
```

### 3. Check Server Logs

Look for these log messages:

```
✅ Cron jobs initialized successfully
⏰ Reservation status update: Every 5 minutes
⏰ Discount expiry: Every day at midnight (00:00 UTC)

[2024-01-15T10:30:00.000Z] 🔄 Running scheduled reservation status update...
[2024-01-15T10:30:00.123Z] ✅ Reservation update completed: { ... }

[2024-01-15T00:00:00.000Z] 🏷️ Running scheduled discount expiry...
[2024-01-15T00:00:00.123Z] ✅ Discount expiry completed: 3 discounts expired
[2024-01-15T00:00:00.124Z] 📋 Expired discounts: [...]
```

## Production Deployment

### Automatic Startup

Cron jobs start automatically when the server starts (initialized in `src/app/layout.tsx`).

No additional configuration needed!

### Platform-Specific Notes

#### Railway / Render / Heroku
- ✅ Works out of the box
- Cron jobs run in the same process as your web server

#### VPS / DigitalOcean Droplet
- ✅ Works out of the box
- Use PM2 or systemd to ensure your app stays running

#### Serverless (Vercel, Netlify)
- ❌ **Not recommended** for serverless environments
- Serverless functions are stateless and shut down after requests
- For serverless, use platform-specific cron features instead

### Ensuring High Availability

#### Option 1: Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start your app with PM2
pm2 start npm --name "restrofly" -- start

# Save PM2 config
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

#### Option 2: Systemd (Linux)

Create `/etc/systemd/system/restrofly.service`:

```ini
[Unit]
Description=RestroFly Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/restrofly
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable restrofly
sudo systemctl start restrofly
```

## Monitoring

### Check if Cron is Running

1. **Health Endpoint**: `GET /api/health`
2. **Server Logs**: Look for periodic update messages
3. **Database**: Check `updatedAt` timestamps on reservations

### Common Issues

#### Cron not running
- Check server logs for initialization errors
- Verify server is not in serverless environment
- Ensure app is not restarting frequently

#### Wrong timezone
- Update `timezone` option in `cron-service.ts`
- Restart the application

#### Updates not happening
- Check database connection
- Verify reservation times are correct
- Review server logs for errors

## Adding New Cron Jobs

1. **Add job in `src/lib/cron-service.ts`**:

```typescript
let myNewJob: cron.ScheduledTask | null = null;

export function startCronJobs() {
  // ... existing jobs ...

  // New job: Run every hour
  myNewJob = cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running my new job...');
    try {
      // Your logic here
      await myCustomFunction();
      console.log('✅ My new job completed');
    } catch (error) {
      console.error('❌ My new job failed:', error);
    }
  }, {
    scheduled: true,
    timezone: 'UTC'
  });
}
```

2. **Update `stopCronJobs()` function**:

```typescript
export function stopCronJobs() {
  // ... existing stops ...
  
  if (myNewJob) {
    myNewJob.stop();
    myNewJob = null;
  }
}
```

3. **Update `getCronStatus()` function**:

```typescript
export function getCronStatus() {
  return {
    initialized: isInitialized,
    reservationUpdateJob: { ... },
    myNewJob: {
      active: myNewJob !== null,
      running: myNewJob ? (myNewJob as any).running : false
    }
  };
}
```

## Cron Pattern Reference

```
┌────────────── second (optional, 0-59)
│ ┌──────────── minute (0-59)
│ │ ┌────────── hour (0-23)
│ │ │ ┌──────── day of month (1-31)
│ │ │ │ ┌────── month (1-12)
│ │ │ │ │ ┌──── day of week (0-7, 0 and 7 are Sunday)
│ │ │ │ │ │
* * * * * *
```

Examples:
- `* * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight
- `0 9 * * 1` - Every Monday at 9:00 AM
- `0 0 1 * *` - First day of every month at midnight

## Security Notes

- ✅ No external endpoints needed (unlike Vercel cron)
- ✅ No API secrets required
- ✅ Runs internally within your application
- ✅ Test endpoint is disabled in production
- ✅ Health endpoint is read-only

## Performance Considerations

- Cron jobs run in the same process as your web server
- Long-running jobs can block other operations
- Consider moving heavy tasks to worker processes if needed
- Monitor memory usage if adding many jobs

## Migration from Vercel Cron

If you previously used Vercel cron:

1. ✅ Removed `vercel.json` cron configuration
2. ✅ Removed `/api/cron/update-reservations` endpoint
3. ✅ Removed `CRON_SECRET` environment variable
4. ✅ Implemented node-cron in `cron-service.ts`
5. ✅ Updated test endpoint to use internal trigger

The new system is more portable and doesn't require platform-specific configuration!
