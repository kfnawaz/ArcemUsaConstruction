#!/bin/bash

# Script to seed the database with data from seed scripts
# Usage: ./seed-database.sh [--clean]

CLEAN_DB=false

# Parse arguments
for arg in "$@"
do
    case $arg in
        --clean)
        CLEAN_DB=true
        shift
        ;;
        *)
        # Unknown option
        ;;
    esac
done

# If clean option is set, drop all data from tables first
if [ "$CLEAN_DB" = true ]; then
    echo "Cleaning database before seeding..."
    npx tsx scripts/clean-database.ts
fi

echo "Starting database seeding..."
npx tsx scripts/seed.ts
echo "Database seeding completed!"
