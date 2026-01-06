#!/bin/bash

# Apply Supabase migration for Lexicon
# This script applies the universes table migration to your Supabase instance

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Lexicon - Supabase Migration Tool${NC}"
echo "======================================"
echo ""

# Check if SUPABASE_PROJECT_ID is set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo -e "${RED}Error: SUPABASE_PROJECT_ID environment variable not set${NC}"
    echo "Please set it to your Supabase project ID"
    echo ""
    echo "Example:"
    echo "  export SUPABASE_PROJECT_ID=your-project-id"
    echo "  ./apply-migration.sh"
    exit 1
fi

# Check if migration file exists
MIGRATION_FILE="migrations/20260106_create_universes_table.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}Project ID:${NC} $SUPABASE_PROJECT_ID"
echo -e "${BLUE}Migration:${NC} $MIGRATION_FILE"
echo ""

# Ask for confirmation
read -p "Apply this migration? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

# Apply migration using Supabase CLI
echo ""
echo -e "${BLUE}Applying migration...${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found${NC}"
    echo "Please install it: npm install -g supabase"
    exit 1
fi

# Apply the migration
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.$SUPABASE_PROJECT_ID.supabase.co:5432/postgres" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Migration applied successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify the table in Supabase Dashboard: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_ID/editor"
    echo "2. Test RLS policies by creating a test universe"
    echo "3. Update your .env.local with SUPABASE_URL and SUPABASE_ANON_KEY"
else
    echo ""
    echo -e "${RED}Migration failed!${NC}"
    echo "Please check the error above and try again."
    exit 1
fi
