import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async () => {
  let retries = 3;
  
  while (retries > 0) {
    try {
      console.log('🔄 Initializing database...');
      
      // Test connection first
      await pool.query('SELECT 1');
      console.log('✅ Database connection established');
      
      // Read and execute schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('✅ Database schema created');
      
      // Read and execute seed data
      const seedPath = path.join(__dirname, 'seed.sql');
      const seed = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seed);
      console.log('✅ Database seeded with default data');
      
      console.log('🎉 Database initialization complete!');
      return;
    } catch (error) {
      retries--;
      console.error(`❌ Database initialization failed (${3 - retries}/3):`, error.message);
      
      if (retries === 0) {
        console.error('❌ Failed to initialize database after 3 attempts');
        throw error;
      }
      
      console.log('🔄 Retrying in 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
};

export const closeDatabase = async () => {
  try {
    await pool.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error);
  }
};
