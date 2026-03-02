const express = require('express');
const router = express.Router();
const AIService = require('../services/ai.service');
const { aiRateLimiter } = require('../middleware/rateLimit');
const logger = require('../middleware/logger');

// POST /api/ai/generate-pillars
router.post('/generate-pillars', aiRateLimiter, async (req, res) => {
    try {
        const { goal, projectId } = req.body;
        if (!goal) return res.status(400).json({ error: 'goal is required' });
        logger.info(`AI generate-pillars: "${goal.substring(0, 60)}"`);
        const pillars = await AIService.generatePillars(goal, projectId);
        res.json({ pillars });
    } catch (err) {
        logger.error(`AI generate-pillars error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ai/breakdown
router.post('/breakdown', aiRateLimiter, async (req, res) => {
    try {
        const { subgoal, mainGoal, projectId } = req.body;
        if (!subgoal) return res.status(400).json({ error: 'subgoal is required' });
        logger.info(`AI breakdown: "${subgoal.substring(0, 60)}"`);
        const actions = await AIService.breakdown(subgoal, mainGoal || '', projectId);
        res.json({ actions });
    } catch (err) {
        logger.error(`AI breakdown error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ai/improve
router.post('/improve', aiRateLimiter, async (req, res) => {
    try {
        const { text, projectId } = req.body;
        if (!text) return res.status(400).json({ error: 'text is required' });
        logger.info(`AI improve: "${text.substring(0, 60)}"`);
        const improved = await AIService.improve(text, projectId);
        res.json({ improved });
    } catch (err) {
        logger.error(`AI improve error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ai/make-smart
router.post('/make-smart', aiRateLimiter, async (req, res) => {
    try {
        const { text, projectId } = req.body;
        if (!text) return res.status(400).json({ error: 'text is required' });
        logger.info(`AI make-smart: "${text.substring(0, 60)}"`);
        const result = await AIService.makeSmart(text, projectId);
        res.json(result);
    } catch (err) {
        logger.error(`AI make-smart error: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ai/history
router.get('/history', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = AIService.getHistory(limit);
        res.json({ history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
