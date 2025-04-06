#!/usr/bin/env node

/**
 * Script to generate the complete SQL schema
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting SQL schema generation...');

const schemaProcess = spawn('npx', ['tsx', './scripts/generate-schema-sql.ts'], {
  stdio: 'inherit',
  shell: true
});

schemaProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\nSQL schema generated successfully!');
    console.log('The schema file is at ./complete-schema.sql');
  } else {
    console.error(`\nSQL schema generation failed with code ${code}`);
  }
});