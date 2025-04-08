# Project Directory Structure

This document describes the organization of the project files and directories.

## Directory Structure

- `/db/` - Database-related files
  - `/db/migrations/` - Database migration files
  - `/db/scripts/` - Database-related scripts (setup, schema changes, etc.)
  - `/db/sql/` - SQL query files
    - `/db/sql/migrations/` - Schema updates and migrations
    - `/db/sql/fixes/` - SQL fixes for data issues
    - `/db/sql/functions/` - Database function declarations

- `/docs/` - Documentation
  - `/docs/migration/` - Migration-related documentation
  - `/docs/project/` - Project planning and management documents
  - `/docs/technical/` - Technical documentation and guides
    - `/docs/technical/database/` - Database-related documentation
    - `/docs/technical/deployment/` - Deployment guides
    - `/docs/technical/fixes/` - Issue fixes documentation

- `/scripts/` - Utility scripts
  - `/scripts/batch/` - Windows batch files for various operations
    - `/scripts/batch/startup/` - Application startup scripts
    - `/scripts/batch/deployment/` - Scripts for deployment tasks
    - `/scripts/batch/database/` - Database-related batch scripts
  - `/scripts/deployment/` - Deployment-related scripts
  - `/scripts/utilities/` - General utility scripts
    - `/scripts/utilities/tests/` - Testing and validation scripts
    - `/scripts/utilities/database/` - Database utility scripts
    - `/scripts/utilities/messaging/` - Messaging-related utilities

- `/src/` - Source code
  - `/src/assets/` - Static assets
  - `/src/components/` - React components
  - `/src/contexts/` - React context providers
  - `/src/hooks/` - Custom React hooks
  - `/src/pages/` - Page components
  - `/src/services/` - Service modules
  - `/src/sql/` - SQL queries used in the application
  - `/src/utils/` - Utility functions

- `/backup-files/` - Backup versions of important files
- `/temp-files/` - Temporary files and directories
- `/public/` - Public static files
- `/build/` - Build output
- `/supabase/` - Supabase configuration
- `/sql-chunks/` - Segmented SQL files

## Organization Notes

The project files have been organized by:

1. **Type and Purpose**: Files are grouped by their type (SQL, scripts, docs) and their purpose (database, deployment, utilities).
2. **Related Functionality**: Files that work together are placed in the same directory.
3. **Maintainability**: The structure makes it easier to find and update related files.
4. **Hierarchical Organization**: Files are organized in a hierarchical structure with subcategories for specific purposes.

## File Naming Conventions

- Batch files: `verb_noun[_qualifier].bat`
- SQL files: `[action]_[target]_[qualifier].sql`
- JavaScript utilities: `verb-noun.js` or `verb_noun.js`
- Documentation: `TOPIC_NAME.md` or `topic-description.md`

## Navigation Tips

- Scripts related to specific functionality are grouped together (e.g., all database-related scripts)
- Documentation follows a similar structure to the codebase organization
- Files are named consistently to make them easy to find and understand
- Batch files are organized by their primary purpose 