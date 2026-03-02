const express = require('express');
const router = express.Router();
const ExportService = require('../services/export.service');

// POST /api/export/markdown
router.post('/markdown', (req, res) => {
    try {
        const { projectData } = req.body;
        const md = ExportService.toMarkdown(projectData);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="mandala-${Date.now()}.md"`);
        res.send(md);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/export/json
router.post('/json', (req, res) => {
    try {
        const { projectData } = req.body;
        const json = ExportService.toJSON(projectData);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="mandala-${Date.now()}.json"`);
        res.send(json);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PNG and PDF are handled client-side, but provide a note endpoint
router.post('/png', (req, res) => {
    res.status(400).json({ error: 'PNG export is handled client-side. Use the frontend export button directly.' });
});

router.post('/pdf', (req, res) => {
    res.status(400).json({ error: 'PDF export is handled client-side. Use the frontend export button directly.' });
});

module.exports = router;
