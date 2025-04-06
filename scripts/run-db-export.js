#!/usr/bin/env node

/**
 * Script to run the database export
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting database export...');

const exportProcess = spawn('npx', ['tsx', './scripts/export-database.ts'], {
  stdio: 'inherit',
  shell: true
});

exportProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\nDatabase export completed successfully!');
    console.log('The exported files are in the ./database-export directory.');
  } else {
    console.error(`\nDatabase export failed with code ${code}`);
  }
});