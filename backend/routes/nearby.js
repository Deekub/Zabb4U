// backend/routes/nearby.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ปรับ path ตามโครงสร้าง project ของคุณ

router.get('/', async (req, res) => {
  const { lat, lng, distance = 10 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing latitude and longitude' });
  }

  try {
    const [rows] = await db.execute(`
      SELECT
        *,
        (6371 * acos(
          cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) +
          sin(radians(?)) * sin(radians(lat))
        )) AS distance
      FROM restaurant
      HAVING distance < ?
      ORDER BY distance;
    `, [parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(distance)]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching nearby restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch nearby restaurants' });
  }
});

module.exports = router;