const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const region = req.body.region || 'default';
    const uploadFolder = path.join(__dirname, '../../public/uploads', region);
    if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, `img_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'galleryImages' },
]);

// ดึงข้อมูลการติดต่อของร้านอาหาร
router.get('/contacts/:restaurant_id', async (req, res) => {
  const { restaurant_id } = req.params;
  try {
    const [contacts] = await db.execute('SELECT phone, facebook, line FROM contact WHERE restaurant_id = ?', [restaurant_id]);
    if (contacts.length > 0) {
      res.status(200).json(contacts[0]);
    } else {
      res.status(200).json({ phone: null, facebook: null, line: null }); // ส่ง object เปล่ากลับถ้าไม่พบ
    }
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Error fetching contact information' });
  }
});

// ดึงรายละเอียดร้านอาหาร (รวมรูปภาพแกลเลอรี่และข้อมูลติดต่อ) สำหรับหน้า Detail
router.get('/restaurant/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [restaurant] = await db.execute('SELECT * FROM restaurant WHERE id = ?', [id]);
    const [galleryImages] = await db.execute('SELECT image_url FROM restaurant_img WHERE restaurant_id = ?', [id]);
    const [contacts] = await db.execute('SELECT phone, facebook, line FROM contact WHERE restaurant_id = ?', [id]);

    if (restaurant.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.status(200).json({
      ...restaurant[0],
      gallery: galleryImages.map(img => img.image_url),
      contact: contacts[0] || {},
    });
  } catch (error) {
    console.error('Error fetching restaurant details for detail screen:', error);
    res.status(500).json({ error: 'Error fetching restaurant details' });
  }
});

// ดึงรายละเอียดร้านอาหาร (ไม่รวมรูปภาพแกลเลอรี่โดยตรง) สำหรับหน้า Edit
router.get('/restaurants/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [restaurant] = await db.execute('SELECT * FROM restaurant WHERE id = ?', [id]);
    const [images] = await db.execute('SELECT id, image_url FROM restaurant_img WHERE restaurant_id = ?', [id]);
    const [contacts] = await db.execute('SELECT phone, facebook, line FROM contact WHERE restaurant_id = ?', [id]);

    if (restaurant.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.status(200).json({
      ...restaurant[0],
      images,
      ...contacts[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching restaurant detail for edit' });
  }
});

// อัปเดตร้านอาหาร
router.post('/restaurants/:id', uploadFields, async (req, res) => {
  const { id } = req.params;
  const { res_name, description, region, phone, facebook, line } = req.body;

  if (!res_name || !description || !region) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      'UPDATE restaurant SET res_name = ?, description = ?, region = ? WHERE id = ?',
      [res_name, description, region, id]
    );

    // จัดการรูปภาพปก (ถ้ามีการอัปโหลด)
    if (req.files && req.files['coverImage'] && req.files['coverImage'].length > 0) {
      const coverImagePath = `/uploads/${region}/${req.files['coverImage'][0].filename}`;
      await connection.execute('UPDATE restaurant SET pic = ? WHERE id = ?', [coverImagePath, id]);
    }

    // จัดการรูปภาพแกลเลอรี่ (ถ้ามีการอัปโหลด)
    if (req.files && req.files['galleryImages']) {
      const newPaths = req.files['galleryImages'].map(file => `/uploads/${region}/${file.filename}`);
      for (const img of newPaths) {
        await connection.execute('INSERT INTO restaurant_img (restaurant_id, image_url) VALUES (?, ?)', [id, `/uploads/${region}/${img.split('/').pop()}`]);
      }
    }

    // อัปเดตข้อมูลการติดต่อ
    const [existingContact] = await connection.execute('SELECT restaurant_id FROM contact WHERE restaurant_id = ?', [id]);
    if (existingContact.length > 0) {
      await connection.execute(
        'UPDATE contact SET phone = ?, facebook = ?, line = ? WHERE restaurant_id = ?',
        [phone || null, facebook || null, line || null, id]
      );
    } else {
      await connection.execute(
        'INSERT INTO contact (restaurant_id, phone, facebook, line) VALUES (?, ?, ?, ?)',
        [id, phone || null, facebook || null, line || null]
      );
    }

    await connection.commit();
    return res.status(200).json({ message: 'Updated successfully' });
  } catch (e) {
    await connection.rollback();
    console.error(e);
    return res.status(500).json({ error: 'Update failed' });
  } finally {
    connection.release();
  }
});

// เพิ่ม Route สำหรับลบร้านอาหาร
router.delete('/restaurants/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // ลบข้อมูลการติดต่อที่เกี่ยวข้อง
    await db.execute('DELETE FROM contact WHERE restaurant_id = ?', [id]);
    // ลบรูปภาพแกลเลอรี่ที่เกี่ยวข้องกับร้านอาหารก่อน
    await db.execute('DELETE FROM restaurant_img WHERE restaurant_id = ?', [id]);
    // จากนั้นลบข้อมูลร้านอาหาร
    const [result] = await db.execute('DELETE FROM restaurant WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    return res.status(200).json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error deleting restaurant' });
  }
});

// GET /api/restaurants/:restaurantId/reviews - ดึงรีวิวของร้าน
router.get('/restaurants/:restaurantId/reviews', async (req, res) => {
    const { restaurantId } = req.params;
    try {
        const [reviews] = await db.execute(
            `SELECT r.review_id, r.user_id, u.name AS user_name, r.rating, r.comment, r.created_at
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.restaurant_id = ?
             ORDER BY r.created_at DESC`,
            [restaurantId]
        );
        res.status(200).json(reviews);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงรีวิว:', error);
        res.status(500).json({ message: 'ไม่สามารถดึงรีวิวได้' });
    }
});

// POST /api/restaurants/:restaurantId/reviews - ส่งรีวิวใหม่
router.post('/restaurants/:restaurantId/reviews', authenticate, async (req, res) => {
    const { restaurantId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'กรุณาระบุคะแนนรีวิว (1-5)' });
    }

    try {
        // ตรวจสอบว่าผู้ใช้เคยรีวิวร้านนี้แล้วหรือไม่
        const [existingReview] = await db.execute(
            'SELECT review_id FROM reviews WHERE restaurant_id = ? AND user_id = ?',
            [restaurantId, userId]
        );

        if (existingReview.length > 0) {
            const reviewIdToUpdate = existingReview[0].review_id;
            // อัปเดตรีวิวเดิม
            await db.execute(
                'UPDATE reviews SET rating = ?, comment = ?, created_at = NOW() WHERE review_id = ?',
                [rating, comment, reviewIdToUpdate]
            );
            await updateRestaurantScore(restaurantId, db);
            return res.status(200).json({ message: 'รีวิวของคุณถูกแก้ไขแล้ว', reviewId: reviewIdToUpdate });
        } else {
            // สร้างรีวิวใหม่
            const [result] = await db.execute(
                'INSERT INTO reviews (restaurant_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
                [restaurantId, userId, rating, comment]
            );
            const newReviewId = result.insertId;
            await updateRestaurantScore(restaurantId, db);
            return res.status(201).json({ message: 'รีวิวของคุณถูกบันทึกแล้ว', reviewId: newReviewId });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึก/แก้ไขรีวิว:', error);
        res.status(500).json({ message: 'ไม่สามารถบันทึกหรือแก้ไขรีวิวได้' });
    }
});

// GET /api/restaurants/:restaurantId/reviews/mine - ดึงรีวิวของผู้ใช้ปัจจุบันสำหรับร้านนี้
router.get('/restaurants/:restaurantId/reviews/mine', authenticate, async (req, res) => {
    const { restaurantId } = req.params;
    const userId = req.user.userId;
    try {
        const [review] = await db.execute(
            'SELECT review_id, rating, comment FROM reviews WHERE restaurant_id = ? AND user_id = ?',
            [restaurantId, userId]
        );
        if (review.length > 0) {
            res.status(200).json(review[0]);
        } else {
            res.status(204).send(); // No Content - ผู้ใช้ยังไม่เคยรีวิว
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงรีวิวของคุณ:', error);
        res.status(500).json({ message: 'ไม่สามารถดึงรีวิวของคุณได้' });
    }
});

// DELETE /api/reviews/:reviewId - ลบรีวิว
router.delete('/reviews/:reviewId', authenticate, async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    try {
        const [review] = await db.execute(
            'SELECT restaurant_id FROM reviews WHERE review_id = ? AND user_id = ?',
            [reviewId, userId]
        );

        if (review.length === 0) {
            return res.status(404).json({ message: 'ไม่พบรีวิวของคุณ' });
        }

        const restaurantIdToDelete = review[0].restaurant_id;

        await db.execute('DELETE FROM reviews WHERE review_id = ? AND user_id = ?', [reviewId, userId]);

        await updateRestaurantScore(restaurantIdToDelete, db); // อัปเดตคะแนนหลังลบรีวิว

        res.status(200).json({ message: 'รีวิวถูกลบเรียบร้อยแล้ว' });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบรีวิว:', error);
        res.status(500).json({ message: 'ไม่สามารถลบรีวิวได้' });
    }
});

async function updateRestaurantScore(restaurantId, db) {
    try {
        const [rows] = await db.execute(
            'SELECT AVG(rating) AS average_rating FROM reviews WHERE restaurant_id = ?',
            [restaurantId]
        );
        const averageScore = rows[0].average_rating || 0;

        await db.execute(
            'UPDATE restaurant SET score = ? WHERE id = ?',
            [averageScore, restaurantId]
        );
        console.log(`อัปเดตคะแนนเฉลี่ยของร้าน ID ${restaurantId} เป็น ${averageScore}`);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตคะแนนเฉลี่ยของร้าน:', error);
    }
}

module.exports = router;