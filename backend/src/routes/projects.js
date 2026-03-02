const express = require('express');
const router = express.Router();
const ProjectService = require('../services/project.service');

// GET /api/projects - List all
router.get('/', (req, res) => {
    try {
        const projects = ProjectService.getAll();
        res.json({ projects });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects - Create new
router.post('/', (req, res) => {
    try {
        const { name, data } = req.body;
        const project = ProjectService.create(name, data);
        res.status(201).json({ project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/projects/:id - Get by ID
router.get('/:id', (req, res) => {
    try {
        const project = ProjectService.getById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/projects/:id - Update
router.put('/:id', (req, res) => {
    try {
        const project = ProjectService.update(req.params.id, req.body);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/projects/:id - Delete
router.delete('/:id', (req, res) => {
    try {
        ProjectService.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
