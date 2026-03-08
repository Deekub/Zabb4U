  const express = require('express');
  const router = express.Router();
  const db = require('../config/db');

  // GET all restaurants
  router.get('/get-restaurants', async (req, res) => {
    try {
      const [restaurants] = await db.execute('SELECT * FROM restaurant ORDER BY id DESC');
      res.status(200).json(restaurants);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
  });

  // ✅ GET restaurant by ID
  router.get('/get-restaurants/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [restaurant] = await db.execute('SELECT * FROM restaurant WHERE id = ?', [id]);

      if (restaurant.length === 0) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      // ถ้ามี table รูปภาพแยก
      const [images] = await db.execute(
        'SELECT image_url FROM restaurant_img WHERE restaurant_id = ?', [id]
      );

      res.status(200).json({ ...restaurant[0], images });
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      res.status(500).json({ error: 'Failed to fetch restaurant' });
    }
  });

  module.exports = router;
