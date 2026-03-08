const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications
router.get('/notifications', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const selectNotificationsQuery = `
            SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;
        const [notifications] = await db.query(selectNotificationsQuery, [userId]);

        res.status(200).json(notifications);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล Notification:', error);
        res.status(500).json({ message: 'ไม่สามารถดึงข้อมูล Notification ได้' });
    }
});

// GET /api/notifications/status
router.get('/status', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const selectUnreadNotificationsQuery = `
            SELECT COUNT(*) AS unreadCount
            FROM notifications
            WHERE user_id = ? AND is_read = 0   
        `;
        const [unreadNotifications] = await db.query(selectUnreadNotificationsQuery, [userId]);
        const unreadCount = unreadNotifications[0].unreadCount;
        res.status(200).json({ hasUnread: unreadCount > 0, unreadCount });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะแจ้งเตือน:', error);
        res.status(500).json({ message: 'ไม่สามารถตรวจสอบสถานะแจ้งเตือนได้' });
    }
});

// GET /api/notifications/:notificationId
router.get('/:notificationId', authenticate, async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    try {
        const selectNotificationQuery = `
            SELECT * FROM notifications
            WHERE notification_id = ? AND user_id = ?
        `;
        const [notification] = await db.query(selectNotificationQuery, [notificationId, userId]);
        if (notification.length === 0) {
            return res.status(404).json({ message: 'ไม่พบการแจ้งเตือน' });
        }
        res.status(200).json(notification[0]);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงรายละเอียดการแจ้งเตือน:', error);
        res.status(500).json({ message: 'ไม่สามารถดึงรายละเอียดการแจ้งเตือนได้' });
    }
});

// PUT /api/notifications/:notificationId/read
router.put('/notifications/:notificationId/read', authenticate, async (req, res) => {
    console.log('PUT /api/notifications/:notificationId/read called', req.params.notificationId);
    const { notificationId } = req.params;
    const userId = req.user.userId;
    try {
        const updateNotificationQuery = `
            UPDATE notifications
            SET is_read = 1, updated_at = NOW()
            WHERE notification_id = ? AND user_id = ?
        `;
        const [result] = await db.query(updateNotificationQuery, [notificationId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบการแจ้งเตือน หรือไม่มีสิทธิ์แก้ไข' });
        }
        res.status(200).json({ message: 'Mark as read แล้ว' });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการ Mark ว่าอ่านแล้ว:', error);
        res.status(500).json({ message: 'ไม่สามารถ Mark as read ได้' });
    }
});

// DELETE /api/notifications/:notificationId
router.delete('/notifications/:notificationId', authenticate, async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    try {
        const deleteNotificationQuery = `
            DELETE FROM notifications
            WHERE notification_id = ? AND user_id = ?
        `;
        const [result] = await db.query(deleteNotificationQuery, [notificationId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบการแจ้งเตือน หรือไม่มีสิทธิ์ลบ' });
        }
        res.status(200).json({ message: 'ลบการแจ้งเตือนแล้ว' });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบการแจ้งเตือน:', error);
        res.status(500).json({ message: 'ไม่สามารถลบการแจ้งเตือนได้' });
    }
});

module.exports = router;