const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ปรับ path ตามโครงสร้าง project ของคุณ

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [restaurantData] = await db.execute(
      'SELECT * FROM restaurant WHERE id = ?',
      [id]
    );

    const [contactData] = await db.execute(
      'SELECT * FROM contact WHERE restaurant_id = ?',
      [id]
    );

    if (restaurantData.length === 0) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json({
      ...restaurantData[0],
      contact: contactData[0] || {},
    });
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    res.status(500).json({ message: 'Failed to fetch restaurant details' });
  }
});

module.exports = router;