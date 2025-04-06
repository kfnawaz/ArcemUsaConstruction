#!/bin/bash

# This script executes the backup data restoration process for projects, services, and blog posts
echo "Starting backup data restoration..."

# Run the restore-all-data script 
npx tsx scripts/backup-seeds/restore-all-data.ts

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo "✅ Backup data restored successfully!"
else
    echo "❌ Error restoring backup data. Please check the error messages above."
fi
