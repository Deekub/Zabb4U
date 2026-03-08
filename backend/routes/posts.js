const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for image upload to 'post' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadFolder = path.join(__dirname, '../../public/uploads/post');
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, `post_img_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// GET all posts
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let currentUserId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (error) {
        console.log('Invalid token:', error.message);
      }
    }

    const [postRows] = await db.execute(`
      SELECT
        p.id,
        p.title AS postTitle,
        p.content,
        p.created_at,
        p.user_id,
        u.name,
        u.pic AS userAvatar,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likeCount,
        (SELECT GROUP_CONCAT(DISTINCT pi.image_url) FROM post_images pi WHERE pi.post_id = p.id) AS postImages,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS isLiked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC;
    `, [currentUserId]);

    const posts = postRows.map(post => ({
      ...post,
      comments: [],
      postImages: post.postImages ? post.postImages.split(',') : [],
    }));

    if (posts.length > 0) {
      const postIds = posts.map(post => post.id);
      const [commentRows] = await db.execute(`
        SELECT
          c.id,
          c.content,
          uc.name AS username,
          c.post_id,
          c.user_id
        FROM comments c
        JOIN users uc ON c.user_id = uc.id
        WHERE c.post_id IN (${db.escape(postIds)})
        ORDER BY c.created_at ASC;
      `);

      const commentsByPostId = commentRows.reduce((acc, comment) => {
        if (!acc[comment.post_id]) {
          acc[comment.post_id] = [];
        }
        acc[comment.post_id].push({
          id: comment.id,
          content: comment.content,
          username: comment.username,
          user_id: comment.user_id
        });
        return acc;
      }, {});

      const postsWithComments = posts.map(post => ({
        ...post,
        comments: commentsByPostId[post.id] || [],
      }));

      res.status(200).json(postsWithComments);
    } else {
      res.status(200).json([]);
    }

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST a new post with optional image uploads
router.post('/', (req, res, next) => {
  upload.array('image', 10)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          console.error('Multer Error:', err);
          return res.status(400).json({ error: 'Error uploading file.', details: err.message });
      } else if (err) {
          // An unknown error occurred when uploading.
          console.error('Unknown Upload Error:', err);
          return res.status(500).json({ error: 'Internal server error during file upload.', details: err.message });
      }
      // Everything went fine, proceed to the next handler
      next();
  });
}, async (req, res) => {
  console.log('--- Start POST /api/posts (after upload) ---');
  console.log('Content-Type received:', req.headers['content-type']);
  console.log('req.body:', req.body);
  console.log('req.files:', req.files); // Log ข้อมูล Files ที่ Multer จัดการ
  const { content, title } = req.body; // รับ title เพิ่มเติม
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Token:', token ? 'Present' : 'Missing');
  console.log('Received title:', title); // Log title ที่ได้รับ

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  if (!content && !title && !req.files) {
      return res.status(400).json({ error: 'Content, title or at least one image is required' });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      const imageURLs = [];
      if (req.files && Array.isArray(req.files)) { // ตรวจสอบว่า req.files เป็น Array และมีข้อมูล
          req.files.forEach(file => {
              imageURLs.push(`/uploads/post/${file.filename}`);
          });
          console.log('imageURLs:', imageURLs);
      } else {
          console.log('No images uploaded or req.files is not an array.');
      }

      const [result] = await db.execute(
          'INSERT INTO posts (user_id, content, title, created_at) VALUES (?, ?, ?, NOW())', // เพิ่ม title ใน INSERT
          [userId, content, title]
      );
      const postId = result.insertId;
      console.log('Post created with ID:', postId);

      for (const url of imageURLs) {
          await db.execute('INSERT INTO post_images (post_id, image_url) VALUES (?, ?)', [postId, url]);
          console.log('Image URL saved:', url, 'for Post ID:', postId);
      }

      // Fetch the newly created post with user info and images, including title
      const [newPostResult] = await db.execute(`SELECT
              p.id,
              p.content,
              p.title AS postTitle,
              p.created_at,
              u.name,
              u.pic AS userAvatar,
              (SELECT GROUP_CONCAT(pi.image_url) FROM post_images pi WHERE pi.post_id = p.id) AS postImages
          FROM posts p
          JOIN users u ON p.user_id = u.id
          WHERE p.id = ?
      `, [postId]);

      console.log('New post result:', newPostResult[0]);
      res.status(201).json(newPostResult[0]);

  } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
  }
  console.log('--- End POST /api/posts ---');
});


// PUT update a post by ID
router.put('/:id', async (req, res) => {
  const { content } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  const { id } = req.params;

  if (!content || !token) {
    return res.status(400).json({ error: 'Missing content or token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const [updateResult] = await db.execute(
      'UPDATE posts SET content = ? WHERE id = ? AND user_id = ?',
      [content, id, userId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Post not found or user not authorized.' });
    }

    const [updatedPost] = await db.execute('SELECT * FROM posts WHERE id = ?', [id]);
    res.status(200).json(updatedPost[0]);

  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE a post by ID
router.delete('/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { id } = req.params;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Delete related data first
    await db.execute('DELETE FROM likes WHERE post_id = ?', [id]);
    await db.execute('DELETE FROM comments WHERE post_id = ?', [id]);

    // Fetch image URLs to delete files
    const [imagesToDelete] = await db.execute('SELECT image_url FROM post_images WHERE post_id = ?', [id]);
    for (const img of imagesToDelete) {
      const filePath = path.join(__dirname, '../../public', img.image_url);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting image file:', err);
        }
      });
    }
    await db.execute('DELETE FROM post_images WHERE post_id = ?', [id]);

    // Finally, delete the post
    const [deleteResult] = await db.execute(
      'DELETE FROM posts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Post not found or user not authorized.' });
    }

    res.status(200).json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;