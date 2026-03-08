require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth'); // Routes สำหรับ Authentication
const userRoutes = require('./routes/user'); // Routes สำหรับ User
const addMenuRouter = require('./routes/addmenu'); // Routes สำหรับ Add Menu
const regionRoutes = require('./routes/region'); // Routes สำหรับ Region
const favoritesRoutes = require('./routes/favorites'); // Routes สำหรับ Favorites
const restaurantRoutes = require('./routes/restaurants');
const imageRoutes = require('./routes/images');
const getRestaurantsRoute = require('./routes/getRestaurants'); // Routes สำหรับดึงข้อมูลร้านทั้งหมด
const nearbyRoutes = require('./routes/nearby'); // Import route ที่เราสร้าง
const restaurantDetailRoutes = require('./routes/restaurantDetail'); // Import route ใหม่
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const signupRoutes = require('./routes/signup'); // Import signup routes
const userssetRoutes = require('./routes/users');
const updateProfileRoute = require('./routes/updateprofile');
const reportRoutes = require('./routes/report');
const notifications = require('./routes/notification');
const forgotPasswordRoutes = require('./routes/forgetpass');
const path = require('path'); // สำหรับเส้นทางไฟล์


// สร้าง Express app
const app = express();

// ตั้งค่า CORS
const corsOptions = {
  origin: ['http://localhost:8081', 'http://192.168.1.191:8081'],
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions)); // ใช้งาน CORS

// ใช้ body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ตั้งค่าการ route
app.use('/api', authRoutes); // Authentication Routes 
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/user', userRoutes); // User Routes
app.use('/api/addmenu', addMenuRouter); // Add Menu Routes
app.use('/api/region', regionRoutes); // Region Routes
app.use('/api/favorites', favoritesRoutes); // Favorites Routes
app.use('/api', getRestaurantsRoute); // ดึงข้อมูลร้านทั้งหมด
app.use('/api/restaurants', restaurantRoutes); // จัดการข้อมูลร้าน
app.use('/api', restaurantRoutes); // ใช้ path /api สำหรับ routes เกี่ยวกับร้านอาหาร
app.use('/api', imageRoutes);    // ใช้ path /api สำหรับ routes เกี่ยวกับการจัดการรูปภาพ
app.use('/api/nearby', nearbyRoutes);
app.use('/api/restaurant', restaurantDetailRoutes); // Mount route ที่ path /api/restaurant
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api', signupRoutes); // Use signup routes under /api path
app.use('/api', userssetRoutes); // หรือ path อื่นที่คุณต้องการ
app.use('/api', updateProfileRoute); // หรือ Path อื่นๆ ที่คุณต้องการ
app.use('/api', reportRoutes);
app.use('/api/noti', notifications);

// เส้นทางสำหรับ static file (ไฟล์ภาพ)
app.use('/public', express.static(path.join(__dirname, 'public')));

// กำหนดพอร์ต
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
