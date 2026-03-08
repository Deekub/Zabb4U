const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// POST a new comment
router.post('/', async (req, res) => {
  const { token, postId, content } = req.body;
  if (!token || !postId || !content) {
    return res.status(400).json({ error: 'Missing token, postId, or content.' });
  }

  try {
    console.log("JWT Secret:", process.env.JWT_SECRET); // เพิ่ม Log ตรงนี้
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const [result] = await db.execute(
      'INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
      [postId, userId, content]
    );

    const commentId = result.insertId;
    const [newCommentResult] = await db.execute(`
      SELECT c.id, c.content, u.name AS username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [commentId]);

    res.status(201).json({ comment: newCommentResult[0] });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment.' });
  }
});

// DELETE a comment by ID
router.delete('/:commentId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { commentId } = req.params;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!commentId) {
    return res.status(400).json({ error: 'Missing commentId.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const [deleteResult] = await db.execute(
      'DELETE FROM comments WHERE id = ? AND user_id = ?',
      [commentId, userId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Comment not found or user not authorized.' });
    }

    res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

module.exports = router;