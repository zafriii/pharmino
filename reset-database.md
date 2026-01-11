# Database Reset Instructions

If you want to completely reset your database and start fresh:

## Steps:

1. **Backup important data** (if any):
   ```bash
   # Export any critical data you want to keep
   ```

2. **Reset the database**:
   ```bash
   npx prisma migrate reset
   ```
   This will:
   - Drop the database
   - Recreate it
   - Run all migrations
   - Run seed scripts (if any)

3. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

4. **Restart your application**

## What this does:
- Completely wipes all data
- Recreates all tables with proper structure
- Ensures all relationships are correct
- Gives you a clean slate

## Warning:
- **ALL DATA WILL BE LOST**
- Make sure you backup anything important
- You'll need to re-add all products, batches, sales, etc.

## Alternative (Recommended):
Instead of resetting, use the inventory sync API to fix existing data without losing anything:
```
POST /api/admin/inventory/sync
```