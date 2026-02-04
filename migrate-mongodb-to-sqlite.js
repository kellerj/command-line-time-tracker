#!/usr/bin/env node
/* eslint-disable no-restricted-syntax */

/**
 * MongoDB to SQLite Migration Script
 *
 * This script migrates data from the original MongoDB database to the new SQLite database.
 * It should be run once after upgrading to the SQLite version of the time tracker.
 *
 * Usage: node -r babel-register migrate-mongodb-to-sqlite.js
 *
 * Prerequisites:
 * - MongoDB server must be running with the original 'tt' database
 * - The application must be updated to the SQLite version
 * - No existing data should be in the SQLite database (will be overwritten)
 */

import { MongoClient } from 'mongodb';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import chalk from 'chalk';
import debug from 'debug';

const LOG = debug('migrate');

// MongoDB configuration (original setup)
const MONGO_CONFIG = {
  host: 'localhost',
  port: 27017,
  database: 'tt',
  get url() {
    return `mongodb://${this.host}:${this.port}/${this.database}`;
  },
};

// SQLite configuration (new setup)
const SQLITE_CONFIG = {
  path: path.join(os.homedir(), '.tt', 'time-tracker.db'),
};

class MigrationTool {
  constructor() {
    this.mongoDb = null;
    this.sqlite = null;
    this.stats = {
      projects: { source: 0, migrated: 0, errors: 0 },
      timetypes: { source: 0, migrated: 0, errors: 0 },
      timeentries: { source: 0, migrated: 0, errors: 0 },
    };
  }

  async connectMongoDB() {
    console.log(chalk.blue('🔌 Connecting to MongoDB...'));
    try {
      this.mongoDb = await MongoClient.connect(MONGO_CONFIG.url, {
        useUnifiedTopology: true,
      });
      console.log(chalk.green('✅ Connected to MongoDB'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to connect to MongoDB:'), error.message);
      console.error(chalk.yellow('💡 Make sure MongoDB is running and accessible at:'), MONGO_CONFIG.url);
      return false;
    }
  }

  async connectSQLite() {
    console.log(chalk.blue('🔌 Connecting to SQLite...'));
    try {
      // Ensure directory exists
      const dbDir = path.dirname(SQLITE_CONFIG.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(chalk.green(`📁 Created directory: ${dbDir}`));
      }

      this.sqlite = new Database(SQLITE_CONFIG.path);
      this.initializeSQLiteTables();
      console.log(chalk.green('✅ Connected to SQLite'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to connect to SQLite:'), error.message);
      return false;
    }
  }

  initializeSQLiteTables() {
    // Create tables (same as in src/db/index.js)
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL COLLATE NOCASE
      );

      CREATE TABLE IF NOT EXISTS timetype (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL COLLATE NOCASE
      );

      CREATE TABLE IF NOT EXISTS timeEntry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entryDescription TEXT,
        project TEXT NOT NULL,
        timeType TEXT NOT NULL,
        minutes INTEGER NOT NULL,
        entryDate TEXT NOT NULL,
        insertTime TEXT NOT NULL,
        wasteOfTime INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_timeEntry_entryDate ON timeEntry(entryDate);
      CREATE INDEX IF NOT EXISTS idx_timeEntry_insertTime ON timeEntry(insertTime);
      CREATE INDEX IF NOT EXISTS idx_timeEntry_project ON timeEntry(project);
      CREATE INDEX IF NOT EXISTS idx_timeEntry_timeType ON timeEntry(timeType);
    `);

    // Clear existing data to ensure clean migration
    this.sqlite.exec(`
      DELETE FROM timeEntry;
      DELETE FROM projects;
      DELETE FROM timetype;
    `);
  }

  async migrateProjects() {
    console.log(chalk.blue('📦 Migrating projects...'));

    try {
      const collection = this.mongoDb.db(MONGO_CONFIG.database).collection('projects');
      const projects = await collection.find({}).toArray();
      this.stats.projects.source = projects.length;

      if (projects.length === 0) {
        console.log(chalk.yellow('⚠️  No projects found in MongoDB'));
        return true;
      }

      const stmt = this.sqlite.prepare('INSERT INTO projects (name) VALUES (?)');

      for (const project of projects) {
        try {
          stmt.run(project.name);
          this.stats.projects.migrated++;
          LOG(`Migrated project: ${project.name}`);
        } catch (error) {
          this.stats.projects.errors++;
          console.error(chalk.red(`❌ Failed to migrate project "${project.name}":`, error.message));
        }
      }

      console.log(chalk.green(`✅ Projects: ${this.stats.projects.migrated}/${this.stats.projects.source} migrated`));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Error migrating projects:'), error.message);
      return false;
    }
  }

  async migrateTimeTypes() {
    console.log(chalk.blue('⏰ Migrating time types...'));

    try {
      const collection = this.mongoDb.db(MONGO_CONFIG.database).collection('timetype');
      const timetypes = await collection.find({}).toArray();
      this.stats.timetypes.source = timetypes.length;

      if (timetypes.length === 0) {
        console.log(chalk.yellow('⚠️  No time types found in MongoDB'));
        return true;
      }

      const stmt = this.sqlite.prepare('INSERT INTO timetype (name) VALUES (?)');

      for (const timetype of timetypes) {
        try {
          stmt.run(timetype.name);
          this.stats.timetypes.migrated++;
          LOG(`Migrated time type: ${timetype.name}`);
        } catch (error) {
          this.stats.timetypes.errors++;
          console.error(chalk.red(`❌ Failed to migrate time type "${timetype.name}":`, error.message));
        }
      }

      console.log(chalk.green(`✅ Time types: ${this.stats.timetypes.migrated}/${this.stats.timetypes.source} migrated`));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Error migrating time types:'), error.message);
      return false;
    }
  }

  async migrateTimeEntries() {
    console.log(chalk.blue('📝 Migrating time entries...'));

    try {
      const collection = this.mongoDb.db(MONGO_CONFIG.database).collection('timeEntry');
      const entries = await collection.find({}).toArray();
      this.stats.timeentries.source = entries.length;

      if (entries.length === 0) {
        console.log(chalk.yellow('⚠️  No time entries found in MongoDB'));
        return true;
      }

      const stmt = this.sqlite.prepare(`
        INSERT INTO timeEntry (entryDescription, project, timeType, minutes, entryDate, insertTime, wasteOfTime)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const entry of entries) {
        try {
          // Convert MongoDB date objects to ISO strings for SQLite
          const insertTime = entry.insertTime instanceof Date
            ? entry.insertTime.toISOString()
            : entry.insertTime;

          // Ensure wasteOfTime is converted to integer (0 or 1)
          const wasteOfTime = entry.wasteOfTime ? 1 : 0;

          stmt.run(
            entry.entryDescription || '',
            entry.project,
            entry.timeType,
            entry.minutes,
            entry.entryDate,
            insertTime,
            wasteOfTime,
          );

          this.stats.timeentries.migrated++;
          LOG(`Migrated entry: ${entry.entryDate} - ${entry.entryDescription}`);
        } catch (error) {
          this.stats.timeentries.errors++;
          console.error(chalk.red(`❌ Failed to migrate entry "${entry.entryDescription}":`, error.message));
          LOG('Failed entry data:', entry);
        }
      }

      console.log(chalk.green(`✅ Time entries: ${this.stats.timeentries.migrated}/${this.stats.timeentries.source} migrated`));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Error migrating time entries:'), error.message);
      return false;
    }
  }

  async close() {
    if (this.mongoDb) {
      await this.mongoDb.close();
      console.log(chalk.blue('🔌 MongoDB connection closed'));
    }

    if (this.sqlite) {
      this.sqlite.close();
      console.log(chalk.blue('🔌 SQLite connection closed'));
    }
  }

  printSummary() {
    console.log(chalk.cyan('\n📊 Migration Summary:'));
    console.log(chalk.cyan('=================='));

    const total = {
      source: this.stats.projects.source + this.stats.timetypes.source + this.stats.timeentries.source,
      migrated: this.stats.projects.migrated + this.stats.timetypes.migrated + this.stats.timeentries.migrated,
      errors: this.stats.projects.errors + this.stats.timetypes.errors + this.stats.timeentries.errors,
    };

    console.log(`Projects:     ${this.stats.projects.migrated.toString().padStart(3)}/${this.stats.projects.source.toString().padEnd(3)} (${this.stats.projects.errors} errors)`);
    console.log(`Time Types:   ${this.stats.timetypes.migrated.toString().padStart(3)}/${this.stats.timetypes.source.toString().padEnd(3)} (${this.stats.timetypes.errors} errors)`);
    console.log(`Time Entries: ${this.stats.timeentries.migrated.toString().padStart(3)}/${this.stats.timeentries.source.toString().padEnd(3)} (${this.stats.timeentries.errors} errors)`);
    console.log(chalk.cyan('------------------'));
    console.log(`Total:        ${total.migrated.toString().padStart(3)}/${total.source.toString().padEnd(3)} (${total.errors} errors)`);

    if (total.errors === 0 && total.migrated > 0) {
      console.log(chalk.green('\n🎉 Migration completed successfully!'));
      console.log(chalk.green(`📁 SQLite database created at: ${SQLITE_CONFIG.path}`));
      console.log(chalk.yellow('💡 You can now use the time tracker with SQLite. MongoDB is no longer needed.'));
    } else if (total.migrated === 0) {
      console.log(chalk.yellow('\n⚠️  No data was migrated. Check if MongoDB contains data.'));
    } else {
      console.log(chalk.orange(`\n⚠️  Migration completed with ${total.errors} errors.`));
      console.log(chalk.yellow('💡 Check the error messages above for details.'));
    }
  }

  async run() {
    console.log(chalk.cyan('🚀 Starting MongoDB to SQLite migration...'));
    console.log(chalk.cyan('============================================\n'));

    try {
      // Connect to databases
      const mongoConnected = await this.connectMongoDB();
      if (!mongoConnected) {
        return false;
      }

      const sqliteConnected = await this.connectSQLite();
      if (!sqliteConnected) {
        return false;
      }

      // Perform migrations
      console.log();
      const projectsOk = await this.migrateProjects();
      const timetypesOk = await this.migrateTimeTypes();
      const entriesOk = await this.migrateTimeEntries();

      this.printSummary();

      return projectsOk && timetypesOk && entriesOk;
    } catch (error) {
      console.error(chalk.red('❌ Unexpected error during migration:'), error.message);
      LOG('Full error:', error);
      return false;
    } finally {
      await this.close();
    }
  }
}

// Main execution
async function main() {
  const migration = new MigrationTool();

  try {
    const success = await migration.run();
    process.exitCode = success ? 0 : 1;
  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error.message);
    process.exitCode = 1;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default MigrationTool;
