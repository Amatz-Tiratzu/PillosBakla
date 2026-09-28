import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';

type Database = {
  query(queryText: string, parameters?: any[]): Promise<{ rows: any[] }>;
};

let pgDbInstance: Database | null = null;
let pgDbInitPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (pgDbInstance) {
    return pgDbInstance;
  }

  if (pgDbInitPromise) {
    return pgDbInitPromise;
  }

  pgDbInitPromise = (async () => {
    if (process.env.DATABASE_URL || process.env.PGHOST) {
      const pool = new Pool(
        process.env.DATABASE_URL
          ? { connectionString: process.env.DATABASE_URL }
          : {
              host: process.env.PGHOST,
              port: Number(process.env.PGPORT || 5432),
              database: process.env.PGDATABASE || 'postgres',
              user: process.env.PGUSER || 'postgres',
              password: process.env.PGPASSWORD,
            },
      );
      const schema = fs.readFileSync(path.resolve(process.cwd(), 'database/schema.sql'), 'utf8');
      await pool.query(schema);
      if (process.env.ADMIN_EMAIL?.trim()) {
        await pool.query(
          `UPDATE users
           SET role = CASE WHEN LOWER(email) = LOWER($1) THEN 'admin' ELSE 'user' END`,
          [process.env.ADMIN_EMAIL.trim()],
        );
      }
      pgDbInstance = pool;
      return pool;
    }

    // Ensure data folder exists for persistence
    const dbDir = path.resolve(process.cwd(), '.pgdata');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new PGlite(dbDir);
    await db.waitReady;

    // Initialize PostgreSQL schema
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS items (
      id VARCHAR(50) PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      item_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL, -- 'Lost' or 'Found'
      location VARCHAR(255) NOT NULL,
      date_reported TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      status VARCHAR(50) DEFAULT 'Open',
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES users(id),
      admin_name VARCHAR(255),
      user_id INTEGER REFERENCES users(id),
      item_id VARCHAR(50) REFERENCES items(id),
      recipient_email VARCHAR(255) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(50) NOT NULL, -- 'Sent' or 'Failed'
      error_message TEXT,
      sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE items ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
    ALTER TABLE items ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
    `);

    // Check if initial data exists
    const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
    const userCount = Number((existingUsers.rows[0] as any)?.count || 0);

    if (userCount === 0) {
      // Seed Users (including the logged in SKSU user and Admin)
      await db.exec(`
      INSERT INTO users (id, name, email, role) VALUES
      (1, 'System Administrator', 'admin@ifound.org', 'admin'),
      (2, 'Daniel Perez', 'danielperez@sksu.edu.ph', 'user'),
      (3, 'Sarah Jenkins', 'sarah.jenkins@university.edu', 'user'),
      (4, 'Marcus Vance', 'marcus.vance@techcorp.io', 'user'),
      (5, 'Elena Rostova', 'elena.rostova@designstudio.net', 'user');

      INSERT INTO items (id, user_id, item_name, category, type, location, date_reported, description, status, image_url) VALUES
      ('RPT-1042', 2, 'iPhone 15 Pro (Natural Titanium)', 'Electronics', 'Lost', 'SKSU Main Library, 2nd Floor Study Cubicle', '2026-09-08 14:30:00+00', 'Space gray/natural titanium with clear MagSafe case. Has a student ID card slotted in the back.', 'Open', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80'),
      ('RPT-1043', 3, 'Tan Leather Travel Wallet with SKSU ID', 'Personal Accessories', 'Lost', 'University Cafeteria, North Wing', '2026-09-09 11:15:00+00', 'Brown leather bifold wallet with brass zipper. Contains driver license and campus cards.', 'Open', 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80'),
      ('RPT-1044', 4, 'MacBook Air M2 13-inch', 'Electronics', 'Found', 'Engineering Building Room 304', '2026-09-10 09:00:00+00', 'Silver MacBook Air in a charcoal felt sleeve. Left near front desk after morning lecture.', 'In Progress', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80'),
      ('RPT-1045', 5, 'Car Keys with Blue Subaru Lanyard', 'Keys', 'Found', 'West Student Parking Lot B, Near Lamp Post 4', '2026-09-10 16:45:00+00', 'Set of 3 keys with key fob and metallic blue carabiner clip.', 'Open', 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80');

      INSERT INTO email_logs (admin_id, admin_name, user_id, item_id, recipient_email, subject, message, status, error_message, sent_at) VALUES
      (1, 'System Administrator', 4, 'RPT-1044', 'marcus.vance@techcorp.io', 'Regarding Your Found Item Report: MacBook Air M2', 'Hello Marcus Vance,\n\nWe are reviewing the MacBook Air M2 report you filed. Security has safely taken custody of the device in the Admin Office. Thank you for reporting this item.\n\nBest regards,\nI FOUND Admin Team', 'Sent', NULL, '2026-09-10 10:30:00+00');
      `);
    }

    if (process.env.ADMIN_EMAIL?.trim()) {
      await db.query(
        `UPDATE users
         SET role = CASE WHEN LOWER(email) = LOWER($1) THEN 'admin' ELSE 'user' END`,
        [process.env.ADMIN_EMAIL.trim()],
      );
    }

    await db.query(`
      SELECT setval(
        pg_get_serial_sequence('users', 'id'),
        COALESCE((SELECT MAX(id) FROM users), 1),
        true
      )
    `);

    pgDbInstance = db;
    return db;
  })();

  try {
    return await pgDbInitPromise;
  } catch (error) {
    pgDbInitPromise = null;
    throw error;
  }
}
