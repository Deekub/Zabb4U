import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../backend/config/config';

export default function NotificationDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { notificationId } = route.params;
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNotificationDetail = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                    navigation.navigate('Login');
                    return;
                }

                const response = await fetch(`${API_URL}/api/noti/${notificationId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Failed to fetch notification: ${response.status} - ${errorData?.message || response.statusText}`);
                }

                const data = await response.json();
                setNotification(data);
                setLoading(false);
                // Mark as read when detail screen is viewed
                markAsRead(token, notificationId);

            } catch (err) {
                setError(err.message);
                setLoading(false);
                console.error("Error fetching notification detail:", err);
            }
        };

        fetchNotificationDetail();
    }, [notificationId, navigation]);

    const markAsRead = async (token, id) => {
        try {
            const response = await fetch(`${API_URL}/api/noti/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Failed to mark as read: ${response.status} - ${errorData?.message || response.statusText}`);
            }
            // Optionally, update the local state if needed
            if (response.ok && notification) {
                setNotification({ ...notification, is_read: 1 });
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    if (loading) {
        return <View style={styles.container}><Text>กำลังโหลด...</Text></View>;
    }

    if (error) {
        return <View style={styles.container}><Text>เกิดข้อผิดพลาด: {error}</Text></View>;
    }

    if (!notification) {
        return <View style={styles.container}><Text>ไม่พบการแจ้งเตือน</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>รายละเอียดการแจ้งเตือน</Text>
            <View style={styles.detailItem}>
                <Text style={styles.label}>ประเภท:</Text>
                <Text>{notification.type}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>ข้อความ:</Text>
                <Text>{notification.message}</Text>
            </View>
            {notification.related_id && (
                <View style={styles.detailItem}>
                    <Text style={styles.label}>ID ที่เกี่ยวข้อง:</Text>
                    <Text>{notification.related_id}</Text>
                </View>
            )}
            <View style={styles.detailItem}>
                <Text style={styles.label}>สถานะอ่าน:</Text>
                <Text>{notification.is_read ? 'อ่านแล้ว' : 'ยังไม่อ่าน'}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>สร้างเมื่อ:</Text>
                <Text>{new Date(notification.created_at).toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Notification')}>
                <Text style={styles.backButtonText}>กลับ</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f4f4f4',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    detailItem: {
        marginBottom: 15,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    label: {
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 5,
    },
    backButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});