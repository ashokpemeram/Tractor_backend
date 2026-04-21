// src/routes/entry.routes.js
const express = require('express');
const router = express.Router();
const {
  getEntries,
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
  getStats,
} = require('../controllers/entry.controller');

// Stats (must come before /:id to avoid conflict)
router.get('/stats', getStats);

// CRUD
router.route('/').get(getEntries).post(createEntry);
router.route('/:id').get(getEntry).put(updateEntry).delete(deleteEntry);

module.exports = router;
