// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Import ฐานข้อมูลของคุณ

const authenticate = (req, res, next) => {
  const rawHeader = req.header('Authorization');
  const token = rawHeader?.replace('Bearer ', '');

  console.log('🔍 Raw Authorization Header:', rawHeader);
  console.log('🔐 Extracted Token:', token);

  if (!token) {
    console.warn('⚠️ ไม่มี token แนบมากับ header');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    console.log('🧪 Using JWT Secret:', secret);

    const decoded = jwt.verify(token, secret);

    console.log('✅ Token Verified. Decoded payload:', decoded);

    req.user = decoded;

    console.log('User in authenticate:', decoded); // เพิ่ม Log นี้

    if (!req.user.userId) {
      console.warn('⚠️ JWT decoded แล้วแต่ไม่มี req.user.id');
    }

    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const [rows] = await db.query('SELECT permission FROM users WHERE id = ?', [req.user.userId]);
        if (rows.length > 0 && rows[0].permission === 'admin') {
            next();
        } else {
            return res.status(403).json({ error: 'Forbidden - Admin access required' });
        }
    } catch (error) {
        console.error('⚠️ Error checking admin role:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { authenticate, isAdmin };