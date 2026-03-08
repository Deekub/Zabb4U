const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  console.log('🟡 Login request body:', req.body);

  if (!email || !password) {
    console.log('❌ Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // ใช้ db.query ซึ่งตอนนี้รองรับ Promise แล้ว
    const [results] = await db.query('SELECT * FROM users WHERE mail = ?', [email]);

    console.log('🟢 DB results:', results);

    if (results.length === 0) {
      console.log('❌ No user found with email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    console.log('🔍 User found:', user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔐 Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    );

    console.log('✅ JWT created:', token);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.mail,
        display_name: user.display_name,
        avatar: user.avatar
      }
    });

  } catch (err) {
    console.error('🔥 Login error details:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};
