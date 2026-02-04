#!/bin/bash

# MongoDB to SQLite Migration Script
# 
# This script migrates your existing time tracker data from MongoDB to SQLite.
# Run this ONCE after upgrading to the SQLite version.

set -e

echo "📋 Time Tracker: MongoDB to SQLite Migration"
echo "============================================="
echo

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "migrate-mongodb-to-sqlite.js" ]; then
    echo "❌ Error: Please run this script from the time tracker project directory"
    echo "   Expected files: package.json, migrate-mongodb-to-sqlite.js"
    exit 1
fi

# Check if MongoDB dependency still exists (for the migration)
if ! npm list mongodb &>/dev/null; then
    echo "⚠️  Warning: MongoDB dependency not found."
    echo "   Installing temporarily for migration..."
    npm install mongodb --no-save
fi

# Check if babel-register is available
if ! npm list babel-register &>/dev/null; then
    echo "❌ Error: babel-register dependency not found."
    echo "   Please run 'npm install' first."
    exit 1
fi

echo "🚀 Starting migration..."
echo

# Run the migration
if node -r babel-register migrate-mongodb-to-sqlite.js; then
    echo
    echo "✅ Migration completed!"
    echo
    echo "📝 Next steps:"
    echo "   1. Test the SQLite version: npm run tt list"
    echo "   2. If everything works, you can remove MongoDB"
    echo "   3. The SQLite database is at: ~/.tt/time-tracker.db"
    echo
    echo "🗑️  To clean up (after confirming migration worked):"
    echo "   - Stop your MongoDB service"
    echo "   - Optionally remove MongoDB data directory"
    echo
else
    echo
    echo "❌ Migration failed!"
    echo "   Check the error messages above and try again."
    echo "   Your original MongoDB data is unchanged."
    exit 1
fi