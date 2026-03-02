require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');

const projectsRouter = require('./routes/projects');
const aiRouter = require('./routes/ai');
const exportRouter = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow all origins untuk mempermudah deploy lintas domain
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/projects', projectsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/export', exportRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    logger.info(`Mandala Chart backend running on http://localhost:${PORT}`);
});

module.exports = app;
