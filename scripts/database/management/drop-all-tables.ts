#!/usr/bin/env bun
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';

async function dropAllTables() {

  try {
    // Get all table names from the database
    const tables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    // Drop each table
    for (const table of tables.rows) {
      const tableName = (table as any).tablename;
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));

      } catch (error) {

      }
    }
    
    // Also drop any custom types

    const types = await db.execute(sql`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e';
    `);
    
    for (const type of types.rows) {
      const typeName = (type as any).typname;
      try {
        await db.execute(sql.raw(`DROP TYPE IF EXISTS "${typeName}" CASCADE`));

      } catch (error) {

      }
    }
    
    // Drop migration table
    try {
      await db.execute(sql`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE`);

    } catch (error) {

    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

dropAllTables();
