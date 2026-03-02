const express = require('express');
const router = express.Router();
const ProjectService = require('../services/project.service');

// GET /api/projects - List all
router.get('/', async (req, res) => {
    try {
        const projects = await ProjectService.getAll();
        res.json({ projects });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects - Create new
router.post('/', async (req, res) => {
    try {
        const { name, data } = req.body;
        const project = await ProjectService.create(name, data);
        res.status(201).json({ project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/projects/:id - Get by ID
router.get('/:id', async (req, res) => {
    try {
        const project = await ProjectService.getById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/projects/:id - Update
router.put('/:id', async (req, res) => {
    try {
        const project = await ProjectService.update(req.params.id, req.body);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/projects/:id - Delete
router.delete('/:id', async (req, res) => {
    try {
        await ProjectService.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
