// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

router.get('/users/me', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    const userId = decoded.userId;

    const [rows] = await db.query('SELECT name, mail, pic FROM users WHERE id = ?', [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    res.status(200).json({
      name: user.name || null,
      email: user.mail || null,
      profilePictureUrl: user.pic || '/default-profile.png',
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;