#!/bin/bash

# Script to generate seed data scripts from current database
echo "Starting seed data generation..."
npx tsx scripts/generate-seed-data.ts
echo "Seed data generation completed!"
