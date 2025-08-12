# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a command-line time tracker application built with Node.js and SQLite. Users can log time entries with projects and time types, then generate reports and summaries. The main CLI command is `tt` with various subcommands.

## Development Commands

- `npm run lint` - Run ESLint on source files
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:verbose` - Run tests with verbose output
- `npm run test:coverage` - Run tests with coverage report
- `npm run compile` - Compile source with Babel to dist/
- `npm run watch` - Compile with watch mode
- `npm run tt` - Run the CLI tool directly from source
- `npm run tt-debug` - Run CLI with debug output enabled

## Testing

- Tests are located in the `test/` directory mirroring the `src/` structure
- Uses Jest with Babel for ES6+ support
- ESLint runs as part of the test suite via jest-runner-eslint
- Coverage threshold is configured but currently commented out

## Architecture

### Command Structure
- Main entry point: `src/commands/tt.js` - routes to subcommands
- Each subcommand has its own file (e.g., `tt-add.js`, `tt-list.js`, `tt-summary.js`)
- Commands use Commander.js for CLI parsing and Inquirer.js for interactive prompts

### Database Layer
- SQLite database connection managed in `src/db/index.js`
- Database modules for each table: `project.js`, `timetype.js`, `timeEntry.js`
- SQLite database stored at: `~/.tt/time-tracker.db`
- Database config in `src/db/config.js`

### Database Tables
- `projects` - Project names with auto-increment ID
- `timetype` - Types of time (meetings, development, etc.) with auto-increment ID  
- `timeEntry` - Main time logging data with minutes, descriptions, dates, and foreign keys

### Business Logic
- Core logic in `src/lib/` directory
- `timeEntry.js` - Time entry operations and calculations
- `project.js` - Project management utilities
- `summarize.js` - Report generation logic

### Utilities
- `src/utils/display-utils.js` - Console output formatting with Chalk
- `src/utils/date-utils.js` - Date manipulation helpers
- `src/utils/table/` - Table formatting for reports
- `src/utils/validations.js` - Input validation functions

## Key Dependencies

- **commander** - CLI argument parsing
- **inquirer** - Interactive command prompts with autocomplete
- **better-sqlite3** - SQLite database driver (synchronous, fast)
- **moment** + **date-fns** - Date handling (migration to date-fns in progress)
- **chalk** - Terminal colors
- **easy-table** - Formatted table output
- **debug** - Debug logging (use DEBUG=tt:* for verbose output)

## Build Process

The project uses Babel to compile ES6+ source code from `src/` to `dist/`. The compiled version in `dist/` is what gets installed as the CLI tool. Run `npm run compile` after making changes, or use `npm run watch` during development.

## Database

The application now uses SQLite instead of MongoDB:
- Database file is automatically created at `~/.tt/time-tracker.db`
- No server setup required - SQLite is embedded
- Tables are created automatically on first run
- Data is portable and stored locally
- All existing functionality is preserved from the MongoDB version