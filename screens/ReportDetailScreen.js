import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TextInput, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../backend/config/config';

const ReportDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { reportId } = route.params;
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [resolutionReason, setResolutionReason] = useState('');

    useEffect(() => {
        const fetchReportDetail = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                    navigation.navigate('Login');
                    return;
                }

                const response = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Failed to fetch report detail: ${response.status} - ${errorData?.message || response.statusText}`);
                }

                const data = await response.json();
                setReport(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
                console.error("Error fetching report detail:", err);
            }
        };

        fetchReportDetail();
    }, [reportId, navigation]);

    const handleResolveReport = async (action) => {
    try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            navigation.navigate('Login');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
        console.log('Headers sent to resolve API:', headers);

        const response = await fetch(`${API_URL}/api/admin/reports/${reportId}/resolve`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ action: action, reason: resolutionReason }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to resolve report: ${response.status} - ${errorData?.message || response.statusText}`);
        }

        Alert.alert('สำเร็จ', `ดำเนินการ "${action}" กับรายงาน ID ${reportId} แล้ว`, [
            { text: 'ตกลง', onPress: () => navigation.navigate('ReportMenu') }, // เปลี่ยนจาก goBack() เป็น navigate('ReportMenu')
        ]);
    } catch (err) {
        Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถดำเนินการกับรายงานได้: ${err.message}`);
        console.error("Error resolving report:", err);
    }
};
    if (loading) {
        return <View style={styles.container}><ActivityIndicator size="large" /></View>;
    }

    if (error) {
        return <View style={styles.container}><Text>เกิดข้อผิดพลาดในการโหลดรายละเอียดรายงาน: {error}</Text></View>;
    }

    if (!report) {
        return <View style={styles.container}><Text>ไม่พบรายงาน</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>รายละเอียดรีพอร์ท ID: {report.report_id}</Text>
            <View style={styles.detailItem}>
                <Text style={styles.label}>ผู้รายงาน:</Text>
                <Text>{report.reporter_username} (ID: {report.reporter_id})</Text>
            </View>
            {report.reported_post_title && (
                <View style={styles.detailItem}>
                    <Text style={styles.label}>หัวข้อโพสต์ที่ถูกรายงาน:</Text>
                    <Text>{report.reported_post_title}</Text>
                </View>
            )}
            <View style={styles.detailItem}>
                <Text style={styles.label}>เนื้อหาโพสต์ที่ถูกรายงาน:</Text>
                <Text>{report.reported_post_content || 'ไม่มีเนื้อหา'}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>เหตุผลการรายงาน:</Text>
                <Text>{report.report_reason || '-'}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>รายละเอียดเพิ่มเติม:</Text>
                <Text>{report.report_details || '-'}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>สถานะ:</Text>
                <Text>{report.report_status}</Text>
            </View>
            <View style={styles.detailItem}>
                <Text style={styles.label}>วันที่สร้าง:</Text>
                <Text>{report.created_at}</Text>
            </View>

            <Text style={styles.actionTitle}>ดำเนินการ</Text>
            <TextInput
                style={styles.reasonInput}
                placeholder="เหตุผลเพิ่มเติม (ถ้ามี)"
                value={resolutionReason}
                onChangeText={setResolutionReason}
                multiline
            />

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#d9534f' }]} onPress={() => handleResolveReport('delete')}>
                <Text style={styles.actionButtonText}>ลบโพสต์</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#5cb85c' }]} onPress={() => handleResolveReport('not_violation')}>
                <Text style={styles.actionButtonText}>ไม่พบการละเมิด</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('ReportMenu')}>
                <Text style={styles.backButtonText}>กลับ</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f8f8',
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
    actionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#333',
    },
    actionButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backButton: {
        backgroundColor: '#6c757d',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    reasonInput: {
        height: 80,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
});

export default ReportDetailScreen;