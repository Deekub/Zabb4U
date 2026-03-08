const db = require('../config/db');

exports.getFavorites = async (req, res) => {
  const userId = req.user.userId; // ✅ ใช้ key เดียวกับ JWT payload

  console.log("✅ User ID from token:", userId);

  try {
    const [rows] = await db.query(
      `SELECT 
         r.id, r.res_name, r.description, r.pic, r.score
       FROM favorites f
       JOIN restaurant r ON f.restaurant_id = r.id
       WHERE f.user_id = ?`,
      [userId]
    );

    console.log("✅ Favorites fetched:", rows);
    res.json({ favorites: rows });
  } catch (err) {
    console.error("❌ Error fetching favorites:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addFavorite = async (req, res) => {
  const userId = req.user.userId;
  const { restaurant_id } = req.body;
  await db.query(
    'INSERT INTO favorites (user_id, restaurant_id) VALUES (?, ?)',
    [userId, restaurant_id]
  );
  res.status(201).json({ message: 'Added to favorites' });
};

exports.removeFavorite = async (req, res) => {
  const userId = req.user.userId;
  const restaurantId = req.params.id;

  try {
    await db.query(
      'DELETE FROM favorites WHERE user_id = ? AND restaurant_id = ?',
      [userId, restaurantId]
    );

    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error("❌ Error removing favorite:", err);
    res.status(500).json({ message: "Server error" });
  }
};
