const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration(filePath) {
  const client = new Client({
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'cli_login_postgres.rlzacttzdhmzypgjccri',
    password: 'MtVSItikPnoBWuixvjzFvPptKrQrSUTD',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`Connecting to database...`);
    await client.connect();
    console.log('Connected!');

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing migration: ${path.basename(filePath)}`);
    console.log(`SQL length: ${sql.length} characters`);

    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.position) {
      const sql = fs.readFileSync(filePath, 'utf8');
      const lines = sql.slice(0, parseInt(error.position)).split('\n');
      console.error(`Error near line ${lines.length}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node apply-migration.js <migration-file>');
  process.exit(1);
}

applyMigration(migrationFile);
