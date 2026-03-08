const express = require('express');
const router = express.Router();
const db = require('../config/db');
// const authenticate = require('../middleware/auth'); // ใช้ authenticate แทน authenticateToken
const { authenticate, isAdmin } = require('../middleware/auth');

// POST /api/reports
router.post('/reports', authenticate, async (req, res) => {
    try {
        console.log('req.user:', req.user); // เพิ่มบรรทัดนี้
        const { postId, reportReason, reportDetails } = req.body;
        const reportingUserId = req.user.userId;

        const insertReportQuery = `
            INSERT INTO reports (post_id, user_id, report_reason, report_details, report_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
        const [reportResult] = await db.query(insertReportQuery, [postId, reportingUserId, reportReason, reportDetails, 'pending']);
        const reportId = reportResult.insertId;

        const selectAdminsQuery = 'SELECT id FROM users WHERE permission = ?';
        const [adminRows] = await db.query(selectAdminsQuery, ['admin']);
        const admins = adminRows.map(row => row.id);

        const insertNotificationQuery = `
            INSERT INTO notifications (user_id, type, related_id, message, is_read, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
        for (const adminId of admins) {
            await db.query(insertNotificationQuery, [adminId, 'new_report', reportId, 'มีรายงานใหม่เข้ามา', 0]);
        }

        res.status(201).json({ message: 'รายงานถูกส่งแล้ว', reportId });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการสร้างรายงาน:', error);
        res.status(500).json({ message: 'ไม่สามารถส่งรายงานได้' });
    }
});

// GET /api/admin/reports
router.get('/admin/reports', authenticate, isAdmin, async (req, res) => {
    // ตอนนี้ใช้ authenticate อย่างเดียว คุณอาจต้องเพิ่ม Logic ตรวจสอบ isAdmin ที่นี่
    try {
        // ตรวจสอบว่าเป็น Admin หรือไม่ (สมมติว่ามี property 'permission' ใน req.user)
        if (req.user && req.user.permission !== 'admin') {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้' });
        }

        const selectPendingReportsQuery = `
            SELECT
                r.report_id,
                r.post_id,
                r.user_id AS reporter_id,
                u.name AS reporter_username,
                p.content AS reported_post_content,
                p.postTitle AS reported_post_title,
                r.report_reason,
                r.report_details,
                r.report_status,
                r.created_at
            FROM reports r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN posts p ON r.post_id = p.id
            WHERE r.report_status = ?
            ORDER BY r.created_at DESC
        `;
        const [pendingReports] = await db.query(selectPendingReportsQuery, ['pending']);

        res.status(200).json(pendingReports);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน:', error);
        res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลรายงานได้' });
    }
});


// // GET /api/notifications
// router.get('/notifications', authenticate, async (req, res) => {
//     try {
//         const userId = req.user.userId;
//         const selectNotificationsQuery = `
//             SELECT * FROM notifications
//             WHERE user_id = ?
//             ORDER BY created_at DESC
//         `;
//         const [notifications] = await db.query(selectNotificationsQuery, [userId]);

//         res.status(200).json(notifications);
//     } catch (error) {
//         console.error('เกิดข้อผิดพลาดในการดึงข้อมูล Notification:', error);
//         res.status(500).json({ message: 'ไม่สามารถดึงข้อมูล Notification ได้' });
//     }
// });

// /api/notifications/status
router.get('/notifications/status', authenticate, async (req, res) => {
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

// router.get('/:notificationId', authenticate, async (req, res) => {
//     const { notificationId } = req.params;
//     const userId = req.user.userId; // Ensure user can only access their own notifications

//     try {
//         const selectNotificationQuery = `
//             SELECT * FROM notifications
//             WHERE notification_id = ? AND user_id = ?
//         `;
//         const [notification] = await db.query(selectNotificationQuery, [notificationId, userId]);

//         if (notification.length === 0) {
//             return res.status(404).json({ message: 'ไม่พบการแจ้งเตือน' });
//         }

//         res.status(200).json(notification[0]);
//     } catch (error) {
//         console.error('เกิดข้อผิดพลาดในการดึงรายละเอียดการแจ้งเตือน:', error);
//         res.status(500).json({ message: 'ไม่สามารถดึงรายละเอียดการแจ้งเตือนได้' });
//     }
// });

// router.put('/:notificationId/read', authenticate, async (req, res) => {
//     const { notificationId } = req.params;
//     const userId = req.user.userId; // Ensure user can only mark their own notifications as read

//     try {
//         const updateNotificationQuery = `
//             UPDATE notifications
//             SET is_read = 1, updated_at = NOW()
//             WHERE notification_id = ? AND user_id = ?
//         `;
//         const [result] = await db.query(updateNotificationQuery, [notificationId, userId]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: 'ไม่พบการแจ้งเตือน หรือไม่มีสิทธิ์แก้ไข' });
//         }

//         res.status(200).json({ message: 'Mark as read แล้ว' });
//     } catch (error) {
//         console.error('เกิดข้อผิดพลาดในการ Mark ว่าอ่านแล้ว:', error);
//         res.status(500).json({ message: 'ไม่สามารถ Mark as read ได้' });
//     }
// });

// GET /api/reports
router.get('/reports', authenticate, isAdmin, async (req, res) => {
    try {
        const selectReportsQuery = `
            SELECT
                r.report_id,
                r.post_id,
                r.user_id AS reporter_id,
                u.name AS reporter_username,
                p.content AS reported_post_content,
                p.title AS reported_post_title,
                r.report_reason,
                r.report_details,
                r.report_status,
                r.created_at
            FROM reports r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN posts p ON r.post_id = p.id
            ORDER BY r.created_at DESC
        `;
        const [reports] = await db.query(selectReportsQuery);
        res.status(200).json(reports);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน:', error);
        res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลรายงานได้' });
    }
});

// GET /api/admin/reports/:reportId
router.get('/admin/reports/:reportId', authenticate, isAdmin, async (req, res) => {
    const { reportId } = req.params;
    try {
        const selectReportDetailQuery = `
            SELECT
                r.report_id,
                r.post_id,
                r.user_id AS reporter_id,
                u.name AS reporter_username,
                p.content AS reported_post_content,
                p.title AS reported_post_title,
                r.report_reason,
                r.report_details,
                r.report_status,
                r.created_at
            FROM reports r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN posts p ON r.post_id = p.id
            WHERE r.report_id = ?
        `;
        const [report] = await db.query(selectReportDetailQuery, [reportId]);

        if (report.length === 0) {
            return res.status(404).json({ message: `ไม่พบรายงาน ID ${reportId}` });
        }

        res.status(200).json(report[0]);
    } catch (error) {
        console.error(`เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน ID ${reportId}:`, error);
        res.status(500).json({ message: `ไม่สามารถดึงข้อมูลรายงาน ID ${reportId} ได้` });
    }
});

// PUT /api/admin/reports/:reportId/resolve
router.put('/admin/reports/:reportId/resolve', authenticate, isAdmin, async (req, res) => {
    console.log('req.user in resolve API:', req.user);
    const { reportId } = req.params;
    const { action, reason } = req.body; 
    console.log('req.body:', req.body); // <--- เพิ่ม Log นี้

    try {
        const selectReportQuery = `
            SELECT r.post_id, r.user_id AS reporter_id
            FROM reports r
            WHERE r.report_id = ?
        `;
        const [reportRows] = await db.query(selectReportQuery, [reportId]);

        if (reportRows.length === 0) {
            return res.status(404).json({ message: `ไม่พบรายงาน ID ${reportId}` });
        }

        const { post_id: postId, reporter_id: reporterId } = reportRows[0];

        let updateReportStatus;
        let resolutionDetails;
        let notificationMessage;

        if (req.body.action === 'delete') {
    console.log('Del ID:', postId);

    // ลบรูปภาพที่เกี่ยวข้องกับโพสต์ก่อน
    const [deleteImagesResult] = await db.query('DELETE FROM post_images WHERE post_id = ?', [postId]);
    console.log('res Images:', deleteImagesResult);

    // ลบ Likes ที่เกี่ยวข้องกับโพสต์ก่อน
    const [deleteLikesResult] = await db.query('DELETE FROM likes WHERE post_id = ?', [postId]);
    console.log('res Likes:', deleteLikesResult);

    // ลอง Query SELECT COUNT(*) ก่อนลบ Comments เพื่อดูว่ามี Comments ที่เกี่ยวข้องหรือไม่
    const [commentCount] = await db.query('SELECT COUNT(*) AS count FROM comments WHERE post_id = ?', [postId]);
    console.log('Comments :', commentCount[0].count);

    // ลบ Comments ที่เกี่ยวข้องกับโพสต์ก่อน
    const [deleteCommentsResult] = await db.query('DELETE FROM comments WHERE post_id = ?', [postId]);
    console.log('res Comments:', deleteCommentsResult);

    // จากนั้นค่อยลบโพสต์
    const [deletePostResult] = await db.query('DELETE FROM posts WHERE id = ?', [postId]);
    console.log('res:', deletePostResult);

    updateReportStatus = 'resolved';
    resolutionDetails = reason ? `โพสต์ถูกลบเนื่องจาก: ${reason}` : 'โพสต์ถูกลบ';
    notificationMessage = `รายงานโพสต์ ID ${postId} ของคุณได้รับการดำเนินการแล้ว: โพสต์ถูกลบ ${reason ? `(${reason})` : ''}`;
}   else if (action === 'not_violation') {
            const updateReportQuery = `
                UPDATE reports
                SET report_status = ?,
                    reviewed_by = ?,
                    review_date = NOW(),
                    resolution_details = ?,
                    updated_at = NOW()
                WHERE report_id = ?
            `;
            const resolutionDetails = reason ? `โพสต์ไม่พบว่าละเมิดกฎ: ${reason}` : 'โพสต์ไม่พบว่าละเมิดกฎ';
            await db.query(updateReportQuery, ['resolved', req.user.userId, resolutionDetails, reportId]);

            const insertNotificationQuery = `
                INSERT INTO notifications (user_id, type, related_id, message, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            `;
            const notificationMessage = `รายงานโพสต์ ID ${postId} ของคุณได้รับการตรวจสอบแล้ว: ไม่พบว่าละเมิดกฎ ${reason ? `(${reason})` : ''}`;
            await db.query(insertNotificationQuery, [reporterId, 'report_resolved', reportId, notificationMessage]);

            return res.status(200).json({ message: `อัปเดตรายงาน ID ${reportId} แล้ว: ไม่พบการละเมิด` });

        } else {
            return res.status(400).json({ message: 'Action ไม่ถูกต้อง ต้องเป็น "delete" หรือ "not_violation"' });
        }

        const updateReportQuery = `
            UPDATE reports
            SET report_status = ?,
                reviewed_by = ?,
                review_date = NOW(),
                resolution_details = ?,
                updated_at = NOW()
            WHERE report_id = ?
        `;
        await db.query(updateReportQuery, [updateReportStatus, req.user.userId, resolutionDetails, reportId]);

        const insertNotificationQuery = `
            INSERT INTO notifications (user_id, type, related_id, message, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW())
        `;
        await db.query(insertNotificationQuery, [reporterId, 'report_resolved', reportId, notificationMessage]);

        return res.status(200).json({ message: `ดำเนินการ "${action}" กับรายงาน ID ${reportId} แล้ว` });

    } catch (error) {
        console.error(`เกิดข้อผิดพลาดในการจัดการรายงาน ID ${reportId}:`, error);
        return res.status(500).json({ message: `ไม่สามารถจัดการรายงาน ID ${reportId} ได้`, error: error.message }); // ส่ง error message กลับไปด้วยเพื่อการ debug
    }
});

module.exports = router;


// // PUT /api/admin/reports/:reportId/resolve
// router.put('/admin/reports/:reportId/resolve', authenticate, isAdmin, async (req, res) => {
//     const { reportId } = req.params;
//     const { action, reason } = req.body;

//     try {
//         const selectReportQuery = `
//             SELECT r.post_id, r.user_id AS reporter_id
//             FROM reports r
//             WHERE r.report_id = ?
//         `;
//         const [reportRows] = await db.query(selectReportQuery, [reportId]);

//         if (reportRows.length === 0) {
//             return res.status(404).json({ message: `ไม่พบรายงาน ID ${reportId}` });
//         }

//         const { post_id: postId, reporter_id: reporterId } = reportRows[0];

//         if (action === 'delete') {
//             const deletePostQuery = 'DELETE FROM posts WHERE id = ?';
//             await db.query(deletePostQuery, [postId]);

//             const updateReportQuery = `
//                 UPDATE reports
//                 SET report_status = ?,
//                     reviewed_by = ?,
//                     review_date = NOW(),
//                     resolution_details = ?,
//                     updated_at = NOW()
//                 WHERE report_id = ?
//             `;
//             const resolutionDetails = reason ? `โพสต์ถูกลบเนื่องจาก: ${reason}` : 'โพสต์ถูกลบ';
//             await db.query(updateReportQuery, ['resolved', req.user.userId, resolutionDetails, reportId]);

//             const insertNotificationQuery = `
//                 INSERT INTO notifications (user_id, type, related_id, message, created_at, updated_at)
//                 VALUES (?, ?, ?, ?, NOW(), NOW())
//             `;
//             const notificationMessage = `รายงานโพสต์ ID ${postId} ของคุณได้รับการดำเนินการแล้ว: โพสต์ถูกลบ ${reason ? `(${reason})` : ''}`;
//             await db.query(insertNotificationQuery, [reporterId, 'report_resolved', reportId, notificationMessage]);

//             return res.status(200).json({ message: `ลบโพสต์ ID ${postId} และอัปเดตรายงาน ID ${reportId} แล้ว` });

//         } else if (action === 'not_violation') {
//             const updateReportQuery = `
//                 UPDATE reports
//                 SET report_status = ?,
//                     reviewed_by = ?,
//                     review_date = NOW(),
//                     resolution_details = ?,
//                     updated_at = NOW()
//                 WHERE report_id = ?
//             `;
//             const resolutionDetails = reason ? `โพสต์ไม่พบว่าละเมิดกฎ: ${reason}` : 'โพสต์ไม่พบว่าละเมิดกฎ';
//             await db.query(updateReportQuery, ['resolved', req.user.userId, resolutionDetails, reportId]);

//             const insertNotificationQuery = `
//                 INSERT INTO notifications (user_id, type, related_id, message, created_at, updated_at)
//                 VALUES (?, ?, ?, ?, NOW(), NOW())
//             `;
//             const notificationMessage = `รายงานโพสต์ ID ${postId} ของคุณได้รับการตรวจสอบแล้ว: ไม่พบว่าละเมิดกฎ ${reason ? `(${reason})` : ''}`;
//             await db.query(insertNotificationQuery, [reporterId, 'report_resolved', reportId, notificationMessage]);

//             return res.status(200).json({ message: `อัปเดตรายงาน ID ${reportId} แล้ว: ไม่พบการละเมิด` });

//         } else {
//             return res.status(400).json({ message: 'Action ไม่ถูกต้อง ต้องเป็น "delete" หรือ "not_violation"' });
//         }

//     } catch (error) {
//         console.error(`เกิดข้อผิดพลาดในการจัดการรายงาน ID ${reportId}:`, error);
//         return res.status(500).json({ message: `ไม่สามารถจัดการรายงาน ID ${reportId} ได้` });
//     }
// });