/**
 * database.js - PostgreSQL database connection via pg
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Initialize tables if they don't exist
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS ai_logs (
                id BIGSERIAL PRIMARY KEY,
                project_id VARCHAR(255),
                action VARCHAR(255),
                input TEXT,
                output TEXT,
                tokens_used INTEGER,
                duration_ms INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Database initialized successfully via Neon Postgres.');
    } catch (err) {
        console.error('Failed to initialize database:', err);
    }
};

initDb();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
