#!/usr/bin/env node

/**
 * Script to run the database import
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting database import...');
console.log('WARNING: This will clear all existing data in the database and replace it with the imported data.');
console.log('The import process will confirm before proceeding.');

const importProcess = spawn('npx', ['tsx', './scripts/import-database.ts'], {
  stdio: 'inherit',
  shell: true
});

importProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\nDatabase import completed!');
  } else {
    console.error(`\nDatabase import failed with code ${code}`);
  }
});