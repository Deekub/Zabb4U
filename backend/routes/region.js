const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/:region', async (req, res) => {
  const { region } = req.params;

  try {
    const [results] = await db.query('SELECT * FROM restaurant WHERE region = ?', [region]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

module.exports = router;
