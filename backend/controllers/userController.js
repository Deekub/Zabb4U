const db = require('../config/db');  // ใช้การเชื่อมต่อฐานข้อมูลจาก config/db.js
const jwt = require('jsonwebtoken');

exports.getUserData = async (req, res) => {
    const { userId } = req.params; // รับ userId จาก URL parameters

    // ตรวจสอบว่า token ถูกส่งมาหรือไม่ใน headers
    const token = req.headers['authorization']?.split(' ')[1];  // Token จะต้องอยู่ใน headers และเป็นรูปแบบ "Bearer <token>"

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });  // ถ้าไม่มี token
    }

    try {
        // ถอดรหัส JWT token และตรวจสอบ
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');  // ถอดรหัส token ด้วย JWT Secret ที่ตั้งไว้
        
        // ตรวจสอบว่า userId ใน token ตรงกับ userId ที่ request มาหรือไม่
        if (decoded.userId !== parseInt(userId)) {
            return res.status(403).json({ message: 'Unauthorized' });  // ถ้า userId ไม่ตรงกัน
        }

        // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
        const [results] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });  // ถ้าไม่พบผู้ใช้
        }

        const user = results[0];  // แค่เอาผลลัพธ์ตัวแรก (เพราะ id น่าจะไม่ซ้ำ)
        res.status(200).json({
            userId: user.id,
            email: user.mail,
            name: user.name,
            pic: user.pic,
            permission: user.permission,
        });  // ส่งข้อมูลของผู้ใช้กลับไปที่ client
    } catch (err) {
        console.error('🔥 Error verifying token or fetching user data:', err.message);
        res.status(500).json({ message: 'Internal server error', error: err.message });  // ถ้าเกิดข้อผิดพลาดใดๆ
    }
};
