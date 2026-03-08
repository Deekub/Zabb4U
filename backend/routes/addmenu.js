const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid'); // Import uuid

const router = express.Router();

// เพิ่ม CORS middleware เฉพาะสำหรับ route นี้
router.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ฟังก์ชันดึง src จาก iframe
function extractValidGoogleMapsEmbed(iframeString) {
  const match = iframeString.match(/src="([^"]+)"/);
  if (match && match[1].startsWith("https://www.google.com/maps/embed?")) {
    return match[1];
  }
  return null;
}

// ฟังก์ชันดึง lat/lng จาก embed link
function extractLatLngFromMapLink(iframeString) {
  try {
    const match = iframeString.match(/src="([^"]+)"/);
    if (!match || !match[1].startsWith("https://www.google.com/maps/embed?")) {
      throw new Error("Invalid Google Maps embed link.");
    }

    const embedUrl = match[1];

    const latMatch = embedUrl.match(/!3d([0-9.\-]+)/);
    const lngMatch = embedUrl.match(/!2d([0-9.\-]+)/);

    if (latMatch && lngMatch) {
      return {
        lat: parseFloat(latMatch[1]),
        lng: parseFloat(lngMatch[1]),
      };
    }
  } catch (e) {
    console.error('Invalid map link:', e);
  }

  return { lat: null, lng: null };
}

// ฟังก์ชันตรวจสอบและรับรองความถูกต้องของนามสกุลไฟล์
function getValidFileExtension(mimetype, originalname) {
  // ถ้ามีนามสกุลในชื่อไฟล์เดิม ให้ใช้นามสกุลนั้น
  const originalExt = path.extname(originalname);
  if (originalExt && originalExt.length <= 5) {
    return originalExt;
  }

  // ถ้าไม่มีนามสกุลหรือนามสกุลไม่ถูกต้อง ให้กำหนดตาม mimetype
  switch (mimetype) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg'; // ค่าเริ่มต้น
  }
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Request body:', req.body);

    const region = req.body && req.body.region ? req.body.region : 'default';
    const uploadFolder = path.join(process.cwd(), 'public', 'uploads', region);

    console.log(`Trying to create folder: ${uploadFolder}`);

    if (!fs.existsSync(uploadFolder)) {
      try {
        fs.mkdirSync(uploadFolder, { recursive: true });
        console.log(`Folder created successfully: ${uploadFolder}`);
      } catch (error) {
        console.error(`Error creating folder: ${error}`);
        return cb(error, null);
      }
    }

    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    // แสดงข้อมูลไฟล์ที่รับเข้ามา
    console.log('Original file details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });

    // ตรวจสอบและรับรองนามสกุลไฟล์
    const fileExtension = getValidFileExtension(file.mimetype, file.originalname);
    const fileName = `img_${Date.now()}_${uuidv4()}${fileExtension}`; // ใช้ uuidv4()
    console.log(`File name set: ${fileName}`);
    cb(null, fileName);
  }
});

// เพิ่ม fileFilter สำหรับตรวจสอบชนิดไฟล์
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('เฉพาะไฟล์รูปภาพเท่านั้น!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

// เพิ่ม middleware สำหรับจัดการกับ error จาก multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ error: `Error uploading file: ${err.message}` });
  } else if (err) {
    console.error('Other error:', err);
    return res.status(500).json({ error: err.message });
  }
  next();
};

// Route สำหรับเพิ่มร้านอาหาร
router.post('/', (req, res, next) => {
  console.log('Request received to /api/addmenu');
  console.log('Headers:', req.headers);
  next();
}, upload.array('images'), handleMulterError, async (req, res) => {
  console.log('Processing request after file upload');
  console.log('Request body:', req.body);

  try {
    const { res_name, description, region, emb_link, phone, facebook, line } = req.body;

    if (!res_name || !region || !emb_link) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // ตรวจสอบและแยก lat/lng จาก embed link
    let embedLink = emb_link;
    if (emb_link.includes('<iframe')) {
      embedLink = extractValidGoogleMapsEmbed(emb_link);
      if (!embedLink) {
        return res.status(400).json({ error: 'กรุณาใส่ลิงก์ฝัง Google Maps ที่ถูกต้อง (iframe)' });
      }
    }

    const { lat, lng } = extractLatLngFromMapLink(emb_link);

    console.log('Received files:', req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'กรุณาเลือกไฟล์ภาพ' });
    }

    // แสดงข้อมูลไฟล์ที่อัปโหลดแบบละเอียด
    console.log('File details:', req.files.map(f => ({
      originalname: f.originalname,
      filename: f.filename,
      mimetype: f.mimetype,
      path: f.path,
      destination: f.destination,
      size: f.size
    })));

    const imagePaths = req.files.map(file => `/uploads/${region}/${file.filename}`);
    const mainImage = imagePaths[0];

    console.log('Image paths to save in DB:', imagePaths);

    const [restaurantResult] = await db.execute(
      'INSERT INTO restaurant (res_name, description, region, pic, google_map_link, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [res_name, description, region, mainImage, embedLink, lat, lng]
    );

    const restaurantId = restaurantResult.insertId;

    const imagePromises = imagePaths.map((imagePath) =>
      db.execute(
        'INSERT INTO restaurant_img (restaurant_id, image_url) VALUES (?, ?)',
        [restaurantId, imagePath]
      )
    );

    await Promise.all(imagePromises);

    // บันทึกข้อมูลช่องทางการติดต่อลงในตาราง contact
    await db.execute(
      'INSERT INTO contact (restaurant_id, phone, facebook, line) VALUES (?, ?, ?, ?)',
      [restaurantId, phone || null, facebook || null, line || null]
    );

    res.status(200).json({
      message: 'Restaurant added successfully',
      restaurant_id: restaurantId,
      images: imagePaths
    });
  } catch (error) {
    console.error('Error adding restaurant:', error);
    res.status(500).json({ error: 'Failed to add restaurant: ' + error.message });
  }
});

module.exports = router;