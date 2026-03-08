import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../backend/config/config';
import { useNavigation } from '@react-navigation/native';

const ReportMenuScreen = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
const fetchReports = async () => {
    try {
        setLoading(true);
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            navigation.navigate('Login');
            return;
        }

        const response = await fetch(`${API_URL}/api/reports`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to fetch reports: ${response.status} - ${errorData?.message || response.statusText}`);
        }

        const dataObject = await response.json();
        console.log('Data from API (Object):', dataObject);

        // Convert Object to Array
        const dataArray = Object.values(dataObject);
        console.log('Data as Array:', dataArray);

        setReports(dataArray);
        setLoading(false);
    } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching reports:", err);
    }
};
        fetchReports();
    }, [navigation]);

const renderItem = ({ item }) => (
    <TouchableOpacity
        style={styles.reportItem}
        onPress={() => navigation.navigate('ReportDetailScreen', { reportId: item.report_id })}
    >
        <Text style={styles.reporter}>ผู้รายงาน: {item.reporter_username}</Text>
        <Text>ID ที่ถูกรายงาน: {item.report_id}</Text>
        <Text>สาเหตุ: {item.report_reason}</Text>
        <Text>สถานะ: {item.report_status}</Text>
    </TouchableOpacity>
);
    if (loading) {
        return <View style={styles.container}><ActivityIndicator size="large" /></View>;
    }

    if (error) {
        return <View style={styles.container}><Text>เกิดข้อผิดพลาดในการโหลดรายงาน: {error}</Text></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>รายการรีพอร์ท</Text>
            <FlatList
                data={reports}
                keyExtractor={(item) => item.report_id.toString()}
                renderItem={renderItem}
                ListEmptyComponent={() => <Text>ไม่มีรีพอร์ท</Text>}
            />
        </View>
    );
};

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
    reportItem: {
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    reporter: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
});

export default ReportMenuScreen;