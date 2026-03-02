/**
 * project.service.js - CRUD using PostgreSQL
 */

const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const ProjectService = {
    async getAll() {
        const result = await db.query('SELECT id, name, created_at, updated_at FROM projects ORDER BY updated_at DESC');
        return result.rows;
    },

    async getById(id) {
        const result = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
        return result.rows.length ? result.rows[0] : null;
    },

    async create(name, data) {
        const id = uuidv4();
        const now = new Date().toISOString();
        const project = {
            id,
            name: name || 'Untitled',
            data: data || {},
            created_at: now,
            updated_at: now
        };

        await db.query(
            'INSERT INTO projects (id, name, data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
            [project.id, project.name, JSON.stringify(project.data), project.created_at, project.updated_at]
        );

        return project;
    },

    async update(id, { name, data }) {
        const now = new Date().toISOString();

        // Find existing project to do partial update
        const existingResult = await db.query('SELECT name, data FROM projects WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) return null;
        const existing = existingResult.rows[0];

        const updatedName = name !== undefined ? name : existing.name;
        const updatedData = data !== undefined ? data : existing.data;

        await db.query(
            'UPDATE projects SET name = $1, data = $2, updated_at = $3 WHERE id = $4',
            [updatedName, JSON.stringify(updatedData), now, id]
        );

        const result = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
        return result.rows[0];
    },

    async delete(id) {
        await db.query('DELETE FROM projects WHERE id = $1', [id]);
        return { success: true };
    }
};

module.exports = ProjectService;
