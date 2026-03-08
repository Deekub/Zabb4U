const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

// POST /api/likes/:postId - Like หรือ Unlike โพสต์
router.post('/:postId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { postId } = req.params;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // ตรวจสอบว่า User ได้ Like โพสต์นี้ไปแล้วหรือยัง
    const [existingLike] = await db.execute(
      'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (existingLike.length > 0) {
      // ถ้า Like แล้ว ให้ Unlike
      await db.execute(
        'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
        [userId, postId]
      );
    } else {
      // ถ้ายังไม่ได้ Like ให้ Like
      await db.execute(
        'INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, NOW())',
        [userId, postId]
      );
    }

    // ดึงจำนวน Like ล่าสุดของโพสต์
    const [likeCountResult] = await db.execute(
      'SELECT COUNT(*) AS likeCount FROM likes WHERE post_id = ?',
      [postId]
    );
    const likeCount = likeCountResult[0].likeCount;

    // ส่งสถานะ Like ล่าสุดกลับไปด้วย (optional)
    const [currentLikeStatus] = await db.execute(
      'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    res.status(200).json({ liked: currentLikeStatus.length > 0, likeCount });

  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ error: 'Failed to like/unlike post' });
  }
});

module.exports = router;