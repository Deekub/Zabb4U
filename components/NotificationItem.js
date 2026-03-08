import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const NotificationItem = ({ item, onPress, onMarkAsRead, onDeleteNotification }) => (
    <View style={[styles.listItem, !item.is_read && styles.unread]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onPress}>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
        </TouchableOpacity>
        {item.is_read ? (
            <TouchableOpacity style={styles.deleteButton} onPress={() => onDeleteNotification(item.notification_id)}>
                <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
        ) : (
            <TouchableOpacity style={styles.markAsReadButton} onPress={() => onMarkAsRead(item.notification_id)}>
                <Text style={styles.markAsReadText}>Mark as Read</Text>
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    listItem: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    unread: {
        backgroundColor: '#e6f7ff',
        borderColor: '#91d5ff',
    },
    message: {
        fontSize: 16,
        color: '#333',
        flexShrink: 1,
    },
    date: {
        fontSize: 12,
        color: '#777',
        marginTop: 4,
    },
    markAsReadButton: {
        backgroundColor: '#52c41a',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginLeft: 10,
    },
    markAsReadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#ff4d4f', // สีแดงสำหรับปุ่มลบ
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginLeft: 10,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default NotificationItem;