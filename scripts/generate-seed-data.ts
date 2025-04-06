import * as fs from 'fs';
import * as path from 'path';
import { db } from '../server/db';
import * as schema from '../shared/schema';

/**
 * This script generates seed data files for all tables in the database
 * It extracts actual data from the database and creates TypeScript seed files
 */
async function generateSeedData() {
  console.log('Starting seed data generation...');
  
  // Create scripts/seeds directory if it doesn't exist
  const seedDir = path.join(process.cwd(), 'scripts', 'seeds');
  if (!fs.existsSync(seedDir)) {
    fs.mkdirSync(seedDir, { recursive: true });
    console.log(`Created seeds directory at ${seedDir}`);
  }
  
  try {
    // Get all tables from the schema
    const tableNames = Object.keys(schema).filter(key => {
      const value = (schema as any)[key];
      // Filter out non-table exports (like relations, enums, etc.)
      return typeof value === 'object' && value !== null && 'name' in value;
    });
    
    console.log(`Found ${tableNames.length} tables to process`);
    
    // Create a mapping of table objects by their name
    const tableMap: Record<string, { schemaKey: string, table: any }> = {};
    
    console.log("Analyzing schema tables...");
    for (const name of tableNames) {
      const table = (schema as any)[name];
      if (table && 'name' in table) {
        // Convert the table name to a reliable string
        let tableNameStr: string;
        try {
          // Try various methods of getting a string representation
          if (typeof table.name === 'string') {
            tableNameStr = table.name;
          } else if (table.name && typeof table.name.toString === 'function') {
            tableNameStr = table.name.toString();
            // Check if toString returned [object Object]
            if (tableNameStr === '[object Object]') {
              // Try to access the literal value
              if ('_value' in table.name) {
                tableNameStr = String(table.name._value);
              } else {
                // Last resort - use the schema key
                tableNameStr = name.toLowerCase();
                console.log(`  Warning: Could not get table name string for ${name}, using schema key instead`);
              }
            }
          } else {
            // Fallback to using the schema key
            tableNameStr = name.toLowerCase();
            console.log(`  Warning: No valid name property for ${name}, using schema key instead`);
          }
          
          console.log(`  Table ${name} -> "${tableNameStr}"`);
          tableMap[tableNameStr] = { schemaKey: name, table };
        } catch (err) {
          console.error(`  Error getting name for table ${name}:`, err);
        }
      }
    }
    
    // Tables need to be processed in an order that respects foreign key constraints
    const processingOrder = [
      // Independent tables first
      'users',
      'blog_categories',
      'blog_tags',
      'team_members',
      
      // Tables with simple dependencies
      'services',
      'projects',
      'blog_posts',
      'job_postings',
      
      // Tables with more dependencies
      'testimonials',
      'messages',
      'newsletter_subscribers',
      
      // Join tables and heavily dependent tables
      'blog_post_categories',
      'blog_post_tags',
      'project_gallery',
      'blog_gallery',
      'service_gallery',
      'quote_requests',
      'quote_request_attachments',
      'subcontractors',
      'vendors'
    ];
    
    // Add any tables not explicitly in our order to the end
    Object.keys(tableMap).forEach(tableName => {
      if (!processingOrder.includes(tableName)) {
        processingOrder.push(tableName);
      }
    });
    
    console.log(`Will process tables in this order: ${processingOrder.join(', ')}`);
    
    // Process each table
    for (const tableKey of processingOrder) {
      // Skip if table info not found
      if (!tableMap[tableKey]) {
        console.log(`Skipping unknown table ${tableKey}`);
        continue;
      }
      
      const { schemaKey, table } = tableMap[tableKey];
      console.log(`Processing table ${tableKey} (schema: ${schemaKey})...`);
      
      // Check if table exists in the database
      let tableExists = false;
      let actualTableName = tableKey;
      
      try {
        const checkResult = await db.execute(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableKey}'
          );
        `);
        
        tableExists = checkResult[0]?.exists === true;
        
        if (!tableExists) {
          // Try schema case variations
          const checkResult2 = await db.execute(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = '${schemaKey.toLowerCase()}'
            );
          `);
          
          if (checkResult2[0]?.exists === true) {
            tableExists = true;
            actualTableName = schemaKey.toLowerCase();
            console.log(`  Found table using schema key: ${actualTableName}`);
          }
        }
        
        if (!tableExists) {
          console.log(`  Table ${tableKey} does not exist in the database. Generating empty seed file.`);
          
          // Generate an empty seed file
          const seedFileName = `seed-${toKebabCase(tableKey)}.ts`;
          const seedFilePath = path.join(seedDir, seedFileName);
          
          const seedFileContent = generateEmptySeedFile(schemaKey, tableKey);
          fs.writeFileSync(seedFilePath, seedFileContent);
          
          console.log(`  Created empty seed file for ${tableKey} at ${seedFilePath}`);
          continue;
        }
      } catch (checkError) {
        console.error(`  Error checking if table exists: ${checkError instanceof Error ? checkError.message : String(checkError)}`);
        continue;
      }
      
      // Table exists, retrieve the data
      try {
        // Try to get data using drizzle
        let data;
        try {
          data = await db.select().from(table);
        } catch (selectError) {
          console.log(`  Warning: Error during standard select, attempting with raw query: ${selectError instanceof Error ? selectError.message : String(selectError)}`);
          
          // If that fails, try a raw query
          try {
            data = await db.execute(`SELECT * FROM ${actualTableName}`);
            console.log(`  Successfully retrieved data using raw query.`);
          } catch (rawError) {
            console.error(`  Failed raw query as well: ${rawError instanceof Error ? rawError.message : String(rawError)}`);
            continue;
          }
        }
        
        console.log(`  Retrieved ${data.length} records from ${actualTableName}`);
        
        // Generate the seed file
        const seedFileName = `seed-${toKebabCase(tableKey)}.ts`;
        const seedFilePath = path.join(seedDir, seedFileName);
        
        const seedFileContent = generateSeedFile(schemaKey, tableKey, data);
        fs.writeFileSync(seedFilePath, seedFileContent);
        
        console.log(`  Created seed file for ${tableKey} at ${seedFilePath}`);
      } catch (error) {
        console.error(`  Error processing table ${tableKey}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Create the combined seed file that imports and runs all individual seed files
    generateCombinedSeedFile(seedDir, processingOrder);
    
    console.log('Seed data generation completed successfully!');
  } catch (error) {
    console.error('Error during seed data generation:', error);
  }
}

// Helper function to convert camelCase or snake_case to kebab-case for filenames
function toKebabCase(str: string): string {
  return str
    .replace(/_/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

// Generate seed file content for a table with data
function generateSeedFile(schemaKey: string, tableName: string, data: any[]): string {
  // Get a nice format of the table name for the function name
  const functionName = `seed${toPascalCase(tableName)}Data`;
  
  // Generate the seed content
  return `import { db } from '../../server/db';
import { ${schemaKey} } from '../../shared/schema';

/**
 * Seeds the ${tableName} table with data
 * Generated from actual database content
 */
export async function ${functionName}() {
  console.log('Seeding ${tableName} table...');
  
  const data = ${JSON.stringify(data, null, 2)};
  
  if (data.length === 0) {
    console.log('No data to seed for ${tableName}');
    return;
  }
  
  try {
    // Insert in chunks to avoid oversized queries
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await db.insert(${schemaKey}).values(chunk);
    }
    
    console.log(\`✅ Successfully seeded \${data.length} records into ${tableName}\`);
  } catch (error) {
    console.error(\`❌ Error seeding ${tableName}:\`, error);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  ${functionName}().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
`;
}

// Generate empty seed file for a table with no data
function generateEmptySeedFile(schemaKey: string, tableName: string): string {
  // Get a nice format of the table name for the function name
  const functionName = `seed${toPascalCase(tableName)}Data`;
  
  // Generate the seed content
  return `import { db } from '../../server/db';
import { ${schemaKey} } from '../../shared/schema';

/**
 * Seeds the ${tableName} table with data
 * This is an empty seed file as the table had no data
 */
export async function ${functionName}() {
  console.log('Seeding ${tableName} table...');
  
  const data: any[] = [];
  
  if (data.length === 0) {
    console.log('No data to seed for ${tableName}');
    return;
  }
  
  try {
    // Insert in chunks to avoid oversized queries
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await db.insert(${schemaKey}).values(chunk);
    }
    
    console.log(\`✅ Successfully seeded \${data.length} records into ${tableName}\`);
  } catch (error) {
    console.error(\`❌ Error seeding ${tableName}:\`, error);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  ${functionName}().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
`;
}

// Convert snake_case or kebab-case to PascalCase
function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// Generate the combined seed file that imports and runs all individual seed files
function generateCombinedSeedFile(seedDir: string, tableOrder: string[]) {
  const seedFiles = fs.readdirSync(seedDir)
    .filter(file => file.startsWith('seed-') && file.endsWith('.ts'));
  
  // Map table names to their corresponding seed files
  const tableToFileMap: Record<string, string> = {};
  
  seedFiles.forEach(file => {
    // Extract table name from file name (seed-table-name.ts -> table_name)
    const tableName = file
      .replace(/^seed-/, '')
      .replace(/\.ts$/, '')
      .replace(/-/g, '_');
    
    tableToFileMap[tableName] = file;
  });
  
  // Generate import statements and function calls in the correct order
  const imports: string[] = [];
  const functionCalls: string[] = [];
  
  tableOrder.forEach(table => {
    const kebabTable = toKebabCase(table);
    const seedFile = tableToFileMap[kebabTable];
    
    if (seedFile) {
      const functionName = `seed${toPascalCase(table)}Data`;
      const importPath = `./${seedFile.replace(/\.ts$/, '')}`;
      
      imports.push(`import { ${functionName} } from '${importPath}';`);
      functionCalls.push(`  await ${functionName}();`);
    }
  });
  
  // Add any remaining seed files not covered by the tableOrder
  seedFiles.forEach(file => {
    const tableName = file
      .replace(/^seed-/, '')
      .replace(/\.ts$/, '')
      .replace(/-/g, '_');
    
    // If table wasn't in our processing order, add it now
    if (!tableOrder.includes(tableName)) {
      const functionName = `seed${toPascalCase(tableName)}Data`;
      const importPath = `./${file.replace(/\.ts$/, '')}`;
      
      // Only add if not already added
      if (!imports.includes(`import { ${functionName} } from '${importPath}';`)) {
        imports.push(`import { ${functionName} } from '${importPath}';`);
        functionCalls.push(`  await ${functionName}();`);
      }
    }
  });
  
  // Create the combined seed file
  const combinedSeedContent = `/**
 * Combined seed file that runs all individual seed files in the correct order
 * This file was automatically generated
 */
${imports.join('\n')}

/**
 * Runs all seed functions in the appropriate order to respect foreign key constraints
 */
export async function seedAllData() {
  console.log('Starting complete database seeding...');

${functionCalls.join('\n')}
  
  console.log('✅ All database seeding completed successfully!');
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedAllData().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
`;

  const combinedFilePath = path.join(seedDir, 'seed-all.ts');
  fs.writeFileSync(combinedFilePath, combinedSeedContent);
  
  console.log(`Created combined seed file at ${combinedFilePath}`);
  
  // Create a root level seed.ts file that imports from the seeds directory
  const rootSeedContent = `/**
 * Main seed file that imports and runs the combined seed file from the seeds directory
 */
import { seedAllData } from './seeds/seed-all';

async function seedDatabase() {
  console.log('Starting database seeding...');
  
  try {
    await seedAllData();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  }
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { seedDatabase };
`;

  const rootSeedPath = path.join(process.cwd(), 'scripts', 'seed.ts');
  fs.writeFileSync(rootSeedPath, rootSeedContent);
  
  console.log(`Created root seed file at ${rootSeedPath}`);
}

// Execute only if this script is run directly
if (import.meta.url.endsWith(process.argv[1])) {
  generateSeedData().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { generateSeedData };