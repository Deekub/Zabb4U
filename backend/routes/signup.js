const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const router = express.Router();

router.post('/signup', async (req, res) => {
    const { username, email, password, avatar } = req.body;

    // ตรวจสอบว่าไม่มีช่องว่าง
    if (!username || !email || !password || !avatar) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // ตรวจสอบรูปแบบของอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // ตรวจสอบว่ามี email นี้อยู่ในระบบแล้วหรือยัง
    const checkEmailQuery = 'SELECT * FROM users WHERE mail = ?';
    try {
        const [rows] = await db.query(checkEmailQuery, [email]);

        if (rows.length > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // แฮชรหัสผ่านที่กรอก
        const hashedPassword = await bcrypt.hash(password, 10);

        // ถ้าไม่มี email นี้ในระบบ ให้ทำการเพิ่มผู้ใช้ใหม่
        const insertQuery = 'INSERT INTO users (user, name, mail, password, pic) VALUES (?, ?, ?, ?, ?)';
        await db.query(insertQuery, [username, username, email, hashedPassword, avatar]);

        return res.status(200).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
    }
});

module.exports = router;