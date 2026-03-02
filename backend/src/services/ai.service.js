/**
 * ai.service.js - Groq AI service with PostgreSQL logging
 */

const Groq = require('groq-sdk');
const db = require('../db/database');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a professional strategic planning assistant specializing in goal decomposition and structured thinking. You help users create clear, actionable, and measurable goals using frameworks like SMART goals and Mandala Charts. Always respond in the same language the user uses. Return responses as clean JSON only, without any explanation or markdown code blocks.`;

async function logUsage(projectId, action, input, output, tokensUsed, durationMs) {
    try {
        await db.query(
            'INSERT INTO ai_logs (project_id, action, input, output, tokens_used, duration_ms) VALUES ($1, $2, $3, $4, $5, $6)',
            [projectId || null, action, (input || '').substring(0, 500), (output || '').substring(0, 1000), tokensUsed || 0, durationMs || 0]
        );
    } catch (e) {
        console.error('Failed to log AI usage:', e.message);
    }
}

async function callGroq(userPrompt, projectId, action) {
    const start = Date.now();
    try {
        const completion = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1024
        });

        const content = completion.choices[0]?.message?.content || '{}';
        const tokens = completion.usage?.total_tokens || 0;
        const duration = Date.now() - start;

        // Fire and forget logging
        logUsage(projectId, action, userPrompt, content, tokens, duration);
        return { content, tokens };
    } catch (err) {
        const duration = Date.now() - start;
        logUsage(projectId, action, userPrompt, `ERROR: ${err.message}`, 0, duration);
        throw err;
    }
}

function parseJSON(text) {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

const AIService = {
    async generatePillars(goal, projectId) {
        const prompt = `Given the main goal: "${goal}", generate exactly 8 key pillars or sub-goals that comprehensively cover all aspects needed to achieve this goal. Return as JSON object with key "pillars" containing an array of exactly 8 strings. Example: {"pillars": ["pillar1", "pillar2", "pillar3", "pillar4", "pillar5", "pillar6", "pillar7", "pillar8"]}`;
        const { content } = await callGroq(prompt, projectId, 'generate_pillars');
        const parsed = parseJSON(content);
        return parsed.pillars || parsed;
    },

    async breakdown(subgoal, mainGoal, projectId) {
        const prompt = `Given the sub-goal: "${subgoal}" (part of main goal: "${mainGoal}"), generate exactly 8 specific, actionable steps or tasks to achieve this sub-goal. Return as JSON object with key "actions" containing an array of exactly 8 strings. Example: {"actions": ["action1", "action2", "action3", "action4", "action5", "action6", "action7", "action8"]}`;
        const { content } = await callGroq(prompt, projectId, 'breakdown');
        const parsed = parseJSON(content);
        return parsed.actions || parsed;
    },

    async improve(text, projectId) {
        const prompt = `Rephrase the following goal to be more specific, actionable, and motivating: "${text}". Return as JSON object with key "improved" containing the improved string. Example: {"improved": "..."}`;
        const { content } = await callGroq(prompt, projectId, 'improve');
        const parsed = parseJSON(content);
        return parsed.improved || text;
    },

    async makeSmart(text, projectId) {
        const prompt = `Convert the following goal into a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound): "${text}". Return as JSON object with key "smart" containing the SMART goal string, and key "breakdown" as an object with keys S, M, A, R, T each containing a short explanation. Example: {"smart": "...", "breakdown": {"S": "...", "M": "...", "A": "...", "R": "...", "T": "..."}}`;
        const { content } = await callGroq(prompt, projectId, 'make_smart');
        return parseJSON(content);
    },

    async getHistory(limit = 50) {
        const result = await db.query('SELECT * FROM ai_logs ORDER BY created_at DESC LIMIT $1', [limit]);
        return result.rows;
    }
};

module.exports = AIService;
