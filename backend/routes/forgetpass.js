const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Assuming you have your database connection here

// เก็บ OTP ชั่วคราว (ควรใช้ฐานข้อมูลหรือ Redis ใน Production)
const otpStorage = {};
const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 นาที

// ฟังก์ชันสร้าง OTP แบบสุ่ม 6 หลัก
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ฟังก์ชันส่งอีเมล OTP
async function sendOTPByEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'zabb4uapp@gmail.com',
      pass: 'iqre ohvf elfe jucn',
    },
  });

  const mailOptions = {
    from: 'Zabb4UAPP Service',
    to: email,
    subject: 'รหัส OTP สำหรับการรีเซ็ตรหัสผ่าน',
    html: `<p>รหัส OTP ของคุณสำหรับการรีเซ็ตรหัสผ่านคือ: <strong>${otp}</strong></p><p>รหัสนี้จะหมดอายุใน 5 นาที</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}: ${otp}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

// API endpoint: /forgot-password/request-otp (POST)
router.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'กรุณาระบุอีเมล' });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE mail = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้อีเมลนี้' });
    }

    const otp = generateOTP();
    const now = Date.now();
    const expiresAt = now + OTP_EXPIRY_TIME;
    otpStorage[email] = { otp, expiresAt };

    const sendResult = await sendOTPByEmail(email, otp);
    if (sendResult) {
      return res.json({ message: 'รหัส OTP ถูกส่งไปยังอีเมลของคุณแล้ว' });
    } else {
      return res.status(500).json({ error: 'ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่อีกครั้ง' });
    }
  } catch (error) {
    console.error('Error requesting OTP:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผล' });
  }
});

// API endpoint: /forgot-password/verify-otp (POST)
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'กรุณาระบุอีเมลและ OTP' });
  }

  const storedOTPData = otpStorage[email];

  if (!storedOTPData || storedOTPData.otp !== otp) {
    return res.status(400).json({ error: 'OTP ไม่ถูกต้อง' });
  }

  if (storedOTPData.expiresAt < Date.now()) {
    delete otpStorage[email];
    return res.status(400).json({ error: 'OTP หมดอายุแล้ว กรุณาส่งคำขอรีเซ็ตใหม่' });
  }

  // OTP ถูกต้อง ให้ส่งคืนสถานะว่ายืนยันแล้ว เพื่อให้ Frontend ไปยังขั้นตอนตั้งรหัสผ่านใหม่
  return res.json({ message: 'OTP ถูกต้อง' });
});

// API endpoint: /forgot-password/reset-password (POST)
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'กรุณาระบุอีเมลและรหัสผ่านใหม่' });
  }

  const storedOTPData = otpStorage[email];
  if (!storedOTPData || storedOTPData.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'คำขอรีเซ็ตรหัสผ่านไม่ถูกต้อง หรือ OTP หมดอายุแล้ว' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await db.execute('UPDATE users SET password = ? WHERE mail = ?', [hashedPassword, email]);

    if (result.affectedRows > 0) {
      delete otpStorage[email]; // ลบ OTP หลังจากใช้แล้ว
      return res.json({ message: 'ตั้งรหัสผ่านใหม่สำเร็จ' });
    } else {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้อีเมลนี้' });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' });
  }
});

module.exports = router;