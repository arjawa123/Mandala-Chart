/**
 * project.service.js - CRUD using lowdb
 */

const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const ProjectService = {
    getAll() {
        return db.get('projects')
            .map(p => ({ id: p.id, name: p.name, created_at: p.created_at, updated_at: p.updated_at }))
            .sortBy('updated_at')
            .reverse()
            .value();
    },

    getById(id) {
        return db.get('projects').find({ id }).value() || null;
    },

    create(name, data) {
        const id = uuidv4();
        const now = new Date().toISOString();
        const project = {
            id,
            name: name || 'Untitled',
            data: data || {},
            created_at: now,
            updated_at: now
        };
        db.get('projects').push(project).write();
        return project;
    },

    update(id, { name, data }) {
        const now = new Date().toISOString();
        const project = db.get('projects').find({ id });
        if (!project.value()) return null;

        const updates = { updated_at: now };
        if (name !== undefined) updates.name = name;
        if (data !== undefined) updates.data = data;

        project.assign(updates).write();
        return project.value();
    },

    delete(id) {
        db.get('projects').remove({ id }).write();
        return { success: true };
    }
};

module.exports = ProjectService;
