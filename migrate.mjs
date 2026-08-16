import pg from 'pg';
import fs from 'fs';

const { Client } = pg;
const client = new Client({
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
  user: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME || 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    
    console.log('Running 0001_initial_schema.sql...');
    const schemaSql = fs.readFileSync('supabase/migrations/0001_initial_schema.sql', 'utf8');
    await client.query(schemaSql);
    console.log('Schema migration complete.');

    console.log('Running 0002_seed_data.sql...');
    const seedSql = fs.readFileSync('supabase/migrations/0002_seed_data.sql', 'utf8');
    await client.query(seedSql);
    console.log('Seed migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}
main();
