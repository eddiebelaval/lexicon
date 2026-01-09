#!/bin/bash

# Apply Supabase migration for Lexicon
# This script applies migrations to your Supabase instance

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Lexicon - Supabase Migration Tool${NC}"
echo "======================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Check if DATABASE_URL is set (preferred method)
if [ -z "$DATABASE_URL" ]; then
    # Fall back to constructing from SUPABASE_PROJECT_ID
    if [ -z "$SUPABASE_PROJECT_ID" ]; then
        echo -e "${RED}Error: No database connection configured${NC}"
        echo ""
        echo "Option 1 (Recommended): Set DATABASE_URL"
        echo "  export DATABASE_URL='postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres'"
        echo ""
        echo "Option 2: Set SUPABASE_PROJECT_ID and SUPABASE_DB_PASSWORD"
        echo "  export SUPABASE_PROJECT_ID=your-project-id"
        echo "  export SUPABASE_DB_PASSWORD=your-db-password"
        echo ""
        echo "Find your connection string in:"
        echo "  Supabase Dashboard > Project Settings > Database > Connection String"
        exit 1
    fi

    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        echo -e "${RED}Error: SUPABASE_DB_PASSWORD not set${NC}"
        echo "Please set your database password:"
        echo "  export SUPABASE_DB_PASSWORD='your-password'"
        exit 1
    fi

    DATABASE_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"
fi

# List available migrations
echo -e "${BLUE}Available migrations:${NC}"
echo ""
ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | while read file; do
    basename "$file"
done
echo ""

# Check for specific migration file argument
if [ -n "$1" ]; then
    MIGRATION_FILE="$MIGRATIONS_DIR/$1"
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo -e "${RED}Error: Migration file not found: $1${NC}"
        exit 1
    fi
else
    # Default to latest migration or prompt
    echo -e "${YELLOW}Usage:${NC} ./apply-migration.sh <migration-file.sql>"
    echo ""
    echo "Examples:"
    echo "  ./apply-migration.sh 20260106_create_universes_table.sql"
    echo "  ./apply-migration.sh 20260108212010_chat_and_production_tracking.sql"
    echo ""
    echo "To apply ALL migrations in order:"
    echo "  ./apply-migration.sh --all"

    if [ "$1" = "--all" ]; then
        echo ""
        echo -e "${BLUE}Applying all migrations in order...${NC}"

        for migration in $(ls -1 "$MIGRATIONS_DIR"/*.sql | sort); do
            echo ""
            echo -e "${BLUE}Applying:${NC} $(basename $migration)"
            psql "$DATABASE_URL" -f "$migration"
            if [ $? -ne 0 ]; then
                echo -e "${RED}Failed on: $(basename $migration)${NC}"
                exit 1
            fi
            echo -e "${GREEN}Done${NC}"
        done

        echo ""
        echo -e "${GREEN}All migrations applied successfully!${NC}"
        exit 0
    fi

    exit 0
fi

echo -e "${BLUE}Migration:${NC} $(basename $MIGRATION_FILE)"
echo ""

# Ask for confirmation
read -p "Apply this migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Apply migration
echo ""
echo -e "${BLUE}Applying migration...${NC}"

# Check if psql is available
if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -f "$MIGRATION_FILE"
    RESULT=$?
elif command -v npx &> /dev/null; then
    # Fall back to supabase CLI
    npx supabase db push --db-url "$DATABASE_URL" < "$MIGRATION_FILE"
    RESULT=$?
else
    echo -e "${RED}Error: Neither psql nor supabase CLI found${NC}"
    echo "Please install one of:"
    echo "  - PostgreSQL client: brew install postgresql"
    echo "  - Supabase CLI: npm install -g supabase"
    exit 1
fi

if [ $RESULT -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Migration applied successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify in Supabase Dashboard: https://supabase.com/dashboard/project"
    echo "2. Test the new tables and RLS policies"
else
    echo ""
    echo -e "${RED}Migration failed!${NC}"
    echo "Please check the error above and try again."
    exit 1
fi
