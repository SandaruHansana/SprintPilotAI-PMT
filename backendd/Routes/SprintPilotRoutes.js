'use strict';

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const sp = require('../sprintpilot');

// ── helpers ───────────────────────────────────────────────────────────────────

// Categorise errors coming back from the Python child process so the frontend
// gets an actionable message instead of a generic "try again".
function classifyError(err) {
  const msg = err.message || '';

  if (msg.includes('ENOENT') || msg.includes('python')) {
    return { status: 503, message: 'Python is not available on this server. Check the SPRINTPILOT_PYTHON env var.' };
  }
  if (msg.includes('spacy') || msg.includes("No module named")) {
    return { status: 503, message: `Missing Python dependency: ${msg}` };
  }
  if (msg.includes('Missing model file') || msg.includes('joblib')) {
    return { status: 503, message: 'FR05 model files not found. Place them in the /models folder.' };
  }
  if (msg.includes('timed out') || msg.includes('ETIMEDOUT')) {
    return { status: 504, message: 'Python process timed out. The model may still be loading — try again in a moment.' };
  }
  // Surface the real error in dev; mask in production
  const detail = process.env.NODE_ENV === 'production' ? null : msg;
  return { status: 500, message: 'Internal server error.', detail };
}

// POST /api/sprintpilot/pipeline
// Body: { goal_text, sprint_days?, velocity?, enrich? }
// Auth: required
router.post('/pipeline', requireAuth, async (req, res) => {
  const { goal_text, sprint_days, velocity, enrich } = req.body;

  if (!goal_text || typeof goal_text !== 'string' || goal_text.trim().length < 3) {
    return res.status(400).json({ message: 'goal_text is required (min 3 characters).' });
  }

  try {
    const result = await sp.pipeline(goal_text.trim(), {
      sprintDays: sprint_days,
      velocity,
      enrich,
    });
    return res.status(200).json({ result });
  } catch (err) {
    const { status, message, detail } = classifyError(err);
    console.error('[SprintPilot] pipeline error:', err.message);
    return res.status(status).json({ message, ...(detail && { detail }) });
  }
});

// POST /api/sprintpilot/predict
// Body: FR05 feature object
// Auth: required
router.post('/predict', requireAuth, async (req, res) => {
  const data = req.body;

const required = [
  'task_type', 'assignee_role', 'experience_years',
  'sprint_length_days', 'story_points',
  'dependencies_count', 'blockers_count', 'priority_moscow',
  'requirement_changes', 'communication_volume',
];

  const missing = required.filter((f) => data[f] === undefined || data[f] === null || data[f] === '');
  if (missing.length > 0) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}.` });
  }

  try {
    const result = await sp.predict(data);
    return res.status(200).json({ result });
  } catch (err) {
    const { status, message, detail } = classifyError(err);
    console.error('[SprintPilot] predict error:', err.message);
    return res.status(status).json({ message, ...(detail && { detail }) });
  }
});

// GET /api/sprintpilot/fr05/status
// Check model files exist — no auth needed (health check)
router.get('/fr05/status', async (req, res) => {
  try {
    const result = await sp.fr05Status();
    return res.status(200).json({ result });
  } catch (err) {
    const { status, message, detail } = classifyError(err);
    console.error('[SprintPilot] fr05 status error:', err.message);
    return res.status(status).json({ message, ...(detail && { detail }) });
  }
});

module.exports = router;