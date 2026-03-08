const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

router.post('/images/delete', async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) return res.status(400).json({ error: 'Missing imageUrl' });

  try {
    // ลบใน Database
    await db.execute('DELETE FROM restaurant_img WHERE image_url = ?', [imageUrl]);

    // ลบไฟล์ใน public
    const imagePath = path.join(__dirname, '../public', imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    return res.status(200).json({ message: 'Image deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error while deleting image' });
  }
});

module.exports = router;