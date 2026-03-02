/**
 * api.js - Backend API client
 */

const BASE_URL = 'http://localhost:3001/api';

async function request(method, path, body = null) {
    const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

export const api = {
    // Projects
    getProjects: () => request('GET', '/projects'),
    getProject: (id) => request('GET', `/projects/${id}`),
    createProject: (name, data) => request('POST', '/projects', { name, data }),
    updateProject: (id, payload) => request('PUT', `/projects/${id}`, payload),
    deleteProject: (id) => request('DELETE', `/projects/${id}`),

    // AI
    generatePillars: (goal, projectId) => request('POST', '/ai/generate-pillars', { goal, projectId }),
    breakdown: (subgoal, mainGoal, projectId) => request('POST', '/ai/breakdown', { subgoal, mainGoal, projectId }),
    improve: (text, projectId) => request('POST', '/ai/improve', { text, projectId }),
    makeSmart: (text, projectId) => request('POST', '/ai/make-smart', { text, projectId }),
    getAiHistory: () => request('GET', '/ai/history'),

    // Export - returns raw blob
    async exportAs(format, projectData) {
        const res = await fetch(`${BASE_URL}/export/${format}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectData })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.blob();
    }
};
