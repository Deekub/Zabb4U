import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../backend/config/config';
import { useNavigation } from '@react-navigation/native';
import NotificationItem from '../components/NotificationItem';

export default function NotificationScreen() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                    navigation.navigate('Login');
                    return;
                }

                const response = await fetch(`${API_URL}/api/noti/notifications`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Failed to fetch notifications: ${response.status} - ${errorData?.message || response.statusText}`);
                }

                const data = await response.json();
                setNotifications(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
                console.error("Error fetching notifications:", err);
            }
        };

        fetchNotifications();
    }, [navigation]);

    const markAsRead = async (id) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                navigation.navigate('Login');
                return;
            }

            const response = await fetch(`${API_URL}/api/noti/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setNotifications(prevNotifications =>
                    prevNotifications.map(item =>
                        item.notification_id === id ? { ...item, is_read: 1 } : item
                    )
                );
                // อาจจะ Reload ข้อมูลทั้งหมดอีกครั้งก็ได้
                // fetchNotifications();
            } else {
                console.log('Response from markAsRead:', response);
                const errorData = await response.json();
                console.error(`Failed to mark as read: ${response.status} - ${errorData?.message || response.statusText}`);
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const deleteNotification = async (id) => {
        console.log('Deleting notification with ID:', id);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                navigation.navigate('Login');
                return;
            }

            const response = await fetch(`${API_URL}/api/noti/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setNotifications(prevNotifications =>
                    prevNotifications.filter(item => item.notification_id !== id)
                );
            } else {
                const errorData = await response.json();
                console.error(`Failed to delete notification: ${response.status} - ${errorData?.message || response.statusText}`);
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const renderItem = ({ item }) => (
        <NotificationItem
            item={item}
            onPress={() => navigation.navigate('NotificationDetailScreen', { notificationId: item.notification_id })}
            onMarkAsRead={markAsRead}
            onDeleteNotification={deleteNotification} // ส่ง deleteNotification
        />
    );

    if (loading) {
        return <View style={styles.container}><Text>กำลังโหลดการแจ้งเตือน...</Text></View>;
    }

    if (error) {
        return <View style={styles.container}><Text>เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน: {error}</Text></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>การแจ้งเตือน</Text>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.notification_id.toString()}
                renderItem={renderItem}
                ListEmptyComponent={() => <Text style={styles.emptyText}>ไม่มีการแจ้งเตือน</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#777',
        marginTop: 20,
    },
});