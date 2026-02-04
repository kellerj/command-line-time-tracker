# MongoDB to SQLite Migration Guide

This guide helps you migrate your existing time tracker data from MongoDB to the new SQLite database.

## Overview

The time tracker has been updated to use SQLite instead of MongoDB, eliminating the need for a database server. This migration tool transfers all your existing projects, time types, and time entries from MongoDB to SQLite.

## Prerequisites

Before running the migration:

1. **Backup your MongoDB data** (optional but recommended):
   ```bash
   mongodump --db tt --out ./mongodb-backup
   ```

2. **Ensure MongoDB is running** with your existing data accessible at `mongodb://localhost:27017/tt`

3. **Update your time tracker** to the SQLite version (this should already be done)

4. **Install dependencies**:
   ```bash
   npm install
   ```

## Quick Migration

Run the migration script:

```bash
./migrate.sh
```

This script will:
- Check prerequisites
- Temporarily install MongoDB driver if needed
- Run the migration
- Show detailed progress and results

## Manual Migration

If you prefer to run the migration directly:

```bash
node -r babel-register migrate-mongodb-to-sqlite.js
```

## What Gets Migrated

The migration transfers:

- ✅ **Projects**: All project names from the `projects` collection
- ✅ **Time Types**: All time types from the `timetype` collection  
- ✅ **Time Entries**: All logged time from the `timeEntry` collection
  - Entry descriptions
  - Project associations
  - Time type associations
  - Minutes logged
  - Entry dates
  - Insert timestamps
  - Waste of time flags

## Migration Output

The migration provides detailed feedback:

```
🚀 Starting MongoDB to SQLite migration...
🔌 Connecting to MongoDB...
✅ Connected to MongoDB
🔌 Connecting to SQLite...
📁 Created directory: /Users/username/.tt
✅ Connected to SQLite
📦 Migrating projects...
✅ Projects: 5/5 migrated
⏰ Migrating time types...
✅ Time types: 8/8 migrated
📝 Migrating time entries...
✅ Time entries: 342/342 migrated

📊 Migration Summary:
Projects:       5/5   (0 errors)
Time Types:     8/8   (0 errors)
Time Entries: 342/342 (0 errors)
Total:        355/355 (0 errors)

🎉 Migration completed successfully!
```

## After Migration

1. **Test the SQLite version**:
   ```bash
   npm run tt list
   npm run tt summary
   ```

2. **Verify your data** appears correctly

3. **SQLite database location**: `~/.tt/time-tracker.db`

## Cleanup (Optional)

After confirming the migration worked:

1. **Stop MongoDB service**:
   ```bash
   # On macOS with Homebrew:
   brew services stop mongodb-community
   
   # On Linux with systemd:
   sudo systemctl stop mongod
   ```

2. **Remove MongoDB data** (if you no longer need it):
   - MongoDB data directory is typically at `/usr/local/var/mongodb` (macOS) or `/var/lib/mongodb` (Linux)
   - Only delete if you're sure the migration worked!

3. **Uninstall MongoDB** (optional):
   ```bash
   # On macOS with Homebrew:
   brew uninstall mongodb-community
   ```

## Troubleshooting

### "Failed to connect to MongoDB"
- Ensure MongoDB is running: `mongo --eval "db.runCommand('ping')"`
- Check if the `tt` database exists: `mongo tt --eval "show collections"`
- Verify connection details in the migration script match your setup

### "No data found in MongoDB"
- Confirm you have data: `mongo tt --eval "db.projects.count(); db.timetype.count(); db.timeEntry.count()"`
- Check collection names match exactly

### Migration fails partway through
- The migration stops on first database connection failure
- Individual record failures are logged but don't stop the migration
- Failed records are counted and reported in the summary

### "babel-register not found"
- Run `npm install` to ensure all dependencies are installed

## Rollback

If you need to rollback to MongoDB:

1. **Restore from backup** (if you created one):
   ```bash
   mongorestore --db tt ./mongodb-backup/tt
   ```

2. **Revert code changes** to use MongoDB instead of SQLite

3. **Remove SQLite database**:
   ```bash
   rm ~/.tt/time-tracker.db
   ```

## Support

If you encounter issues:

1. Run with debug output:
   ```bash
   DEBUG=migrate node -r babel-register migrate-mongodb-to-sqlite.js
   ```

2. Check the detailed error messages in the output

3. Verify your MongoDB data structure matches the expected format

## File Locations

- **Migration script**: `migrate-mongodb-to-sqlite.js`
- **Shell wrapper**: `migrate.sh`
- **SQLite database**: `~/.tt/time-tracker.db`
- **MongoDB backup**: `./mongodb-backup/` (if you created one)