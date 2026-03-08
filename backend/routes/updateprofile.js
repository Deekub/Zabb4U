const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

router.post('/updateprofile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { name, password, profilePictureUrl } = req.body;

    let updateFields = [];
    let params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (profilePictureUrl) {
      updateFields.push('pic = ?');
      params.push(profilePictureUrl);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      params.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(200).json({ message: 'No fields to update' });
    }

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(userId);

    console.log('SQL:', sql);
    console.log('Params:', params);

    await db.execute(sql, params);

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;