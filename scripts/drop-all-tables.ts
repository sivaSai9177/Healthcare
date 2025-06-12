#!/usr/bin/env bun
import { sql } from 'drizzle-orm';
import { db } from '../src/db';

async function dropAllTables() {
// TODO: Replace with structured logging - console.log('🗑️  Dropping ALL tables from database...');
  
  try {
    // Get all table names from the database
    const tablesResult = await db.execute(sql`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const tables = tablesResult.rows as { tablename: string }[];
    
    if (tables.length === 0) {
// TODO: Replace with structured logging - console.log('✅ No tables found in database');
      return;
    }
    
// TODO: Replace with structured logging - console.log(`Found ${tables.length} tables to drop...`);
    
    // Drop each table
    for (const { tablename } of tables) {
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tablename}" CASCADE`));
// TODO: Replace with structured logging - console.log(`✅ Dropped table: ${tablename}`);
      } catch (error) {
// TODO: Replace with structured logging - console.log(`⚠️  Error dropping ${tablename}: ${error.message}`);
      }
    }
    
// TODO: Replace with structured logging - console.log('\n✅ All tables dropped successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the drop
dropAllTables().then(() => {
// TODO: Replace with structured logging - console.log('\n🎉 Database cleaned!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});