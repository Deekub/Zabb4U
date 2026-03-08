// backend/routes/user.js
const express = require('express');
const router = express.Router();
const { getUserData } = require('../controllers/userController');

// Route สำหรับดึงข้อมูลผู้ใช้ตาม userId
router.get('/:userId', getUserData);

module.exports = router;
