'use strict';

const express = require('express');
const { query } = require('../db/db');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/sprintplan — save a new approved sprint plan
router.post('/', requireAuth, async (req, res) => {
  const { title, original_goal, plan_json } = req.body;
  const userId = req.user.userId;

  if (!plan_json) {
    return res.status(400).json({ message: 'plan_json is required.' });
  }

  try {
    const planStr = typeof plan_json === 'string' ? plan_json : JSON.stringify(plan_json);
    const result = await query(
      'INSERT INTO sprintplan (user_id, title, original_goal, plan_json) VALUES (?, ?, ?, ?)',
      [userId, title || 'Sprint Plan', original_goal || '', planStr]
    );
    return res.status(201).json({ id: result.insertId, message: 'Sprint plan saved.' });
  } catch (err) {
    console.error('Save sprint plan error:', err);
    return res.status(500).json({ message: 'Server error saving sprint plan.' });
  }
});

// GET /api/sprintplan — get all sprint plans for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.userId;
  try {
    const rows = await query(
      'SELECT id, title, original_goal, plan_json, completions, approved_at FROM sprintplan WHERE user_id = ? ORDER BY approved_at DESC',
      [userId]
    );
    const plans = rows.map(r => ({
      id: r.id,
      title: r.title,
      original_goal: r.original_goal,
      plan_json: JSON.parse(r.plan_json),
      completions: JSON.parse(r.completions || '{}'),
      approved_at: r.approved_at,
    }));
    return res.json({ plans });
  } catch (err) {
    console.error('Get sprint plans error:', err);
    return res.status(500).json({ message: 'Server error fetching sprint plans.' });
  }
});

// GET /api/sprintplan/:id — get one sprint plan
router.get('/:id', requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    const rows = await query(
      'SELECT id, title, original_goal, plan_json, completions, approved_at FROM sprintplan WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Plan not found.' });
    const r = rows[0];
    return res.json({
      id: r.id,
      title: r.title,
      original_goal: r.original_goal,
      plan_json: JSON.parse(r.plan_json),
      completions: JSON.parse(r.completions || '{}'),
      approved_at: r.approved_at,
    });
  } catch (err) {
    console.error('Get sprint plan error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/sprintplan/:id/completions — save task completions
router.patch('/:id/completions', requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { completions } = req.body;

  try {
    const rows = await query('SELECT id FROM sprintplan WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Plan not found.' });

    await query(
      'UPDATE sprintplan SET completions = ? WHERE id = ? AND user_id = ?',
      [JSON.stringify(completions), id, userId]
    );
    return res.json({ message: 'Completions saved.' });
  } catch (err) {
    console.error('Update completions error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/sprintplan/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  try {
    await query('DELETE FROM sprintplan WHERE id = ? AND user_id = ?', [id, userId]);
    return res.json({ message: 'Plan deleted.' });
  } catch (err) {
    console.error('Delete sprint plan error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;