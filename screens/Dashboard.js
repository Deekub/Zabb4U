import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../backend/config/config';
import { useLanguage } from '../LanguageContext'; // Import useLanguage

export default function Dashboard() {
    const [profilePictureUrl, setProfilePictureUrl] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [role, setRole] = useState(null);
    const navigation = useNavigation();
    const { locale, translate } = useLanguage(); // ดึงภาษาปัจจุบันและฟังก์ชัน translate
    const [hasNewNotifications, setHasNewNotifications] = useState(false); // หรือ useState(0) สำหรับจำนวน

    useEffect(() => {
        const fetchData = async () => {
            try {
                // ดึง token จาก AsyncStorage
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                    navigation.navigate('Login'); // ถ้าไม่มี token ไปที่หน้า login
                    return;
                }

                // ถอดรหัส JWT
                const decoded = jwtDecode(token);
                const userId = decoded.userId;
                console.log("userId:", userId);

                // ดึงข้อมูลจาก API หรือฐานข้อมูล
                const response = await fetch(`${API_URL}/user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                const user = await response.json();

                if (user) {
                    setProfilePictureUrl(user.pic || '/default-profile.png');
                    setRole(user.permission);
                    if (user.permission === 'admin') {
                        setIsAdmin(true);
                    }
                } else {
                    navigation.navigate('Login'); // ถ้าไม่มีข้อมูลผู้ใช้ให้ไปที่หน้า login
                }
                console.log("user.permission:", user.permission);
                console.log("user.permission === 'admin':", user.permission === 'admin');

            } catch (error) {
                console.log("error:", error);
                console.error("Error occurred:", error.message);
                navigation.navigate('Login'); // ถ้าผิดพลาดไปที่หน้า login
            }
        };

        fetchData();
    }, [navigation]);

     useEffect(() => {
        const checkNotifications = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    const response = await fetch(`${API_URL}/api/notifications/status`, { // API สำหรับตรวจสอบสถานะ
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Notification Status:', data);
                        // ตรวจสอบ 'data' ว่ามีแจ้งเตือนใหม่หรือไม่ และอัปเดต state
                        if (data.hasUnread) { // สมมติว่า API ตอบกลับมาแบบนี้
                            setHasNewNotifications(true);
                        } else {
                            setHasNewNotifications(false);
                        }
                        // หรือถ้าเป็นจำนวน:
                        // setHasNewNotifications(data.unreadCount > 0);
                    } else {
                        console.error("Failed to fetch notification status");
                    }
                }
            } catch (error) {
                console.error("Error checking notifications:", error);
            }
        };

        checkNotifications();
        // อาจจะตั้ง Interval ให้ตรวจสอบเป็นระยะๆ ถ้าต้องการ Real-time (แต่แนะนำให้ระวังเรื่อง Performance)
    }, []);


    // แผนที่ที่เก็บไฟล์ใน assets
    const imageMapping = {
        'profile1.png': require('../assets/profile1.png'),
        'profile2.png': require('../assets/profile2.png'),
        'profile3.png': require('../assets/profile3.png'),
        'profile4.png': require('../assets/profile4.png'),
        'profile5.png': require('../assets/profile5.png'),
        'default-profile.png': require('../assets/profile1.png') // กรณีไม่มีข้อมูลหรือไม่พบไฟล์
    };

    // Object เก็บ Path รูปภาพเมนูตามชื่อ
    const menuImages = {
        North: {
            th: require('../assets/North_th.png'),
            en: require('../assets/North_en.png'),
        },
        Northeastern: {
            th: require('../assets/Northeastern_th.png'),
            en: require('../assets/Northeastern_en.png'),
        },
        central: {
            th: require('../assets/central_th.png'),
            en: require('../assets/central_en.png'),
        },
        South: {
            th: require('../assets/South_th.png'),
            en: require('../assets/South_en.png'),
        },
        store: {
            th: require('../assets/store_th.png'),
            en: require('../assets/store_en.png'),
        },
        community: {
            th: require('../assets/community_th.png'),
            en: require('../assets/community_en.png'),
        },
    };

    // ฟังก์ชันกำหนดแหล่งที่มาของรูปภาพเมนูตามภาษา
    const getMenuImageSource = (baseName) => {
        console.log("lang :",locale);
        return menuImages[baseName]?.[locale] || menuImages[baseName]?.th || null;
    };

    // ตรวจสอบการเปลี่ยนแปลงของ profilePictureUrl
    useEffect(() => {
        console.log("profile pic updated:", profilePictureUrl);
    }, [profilePictureUrl]);
    const profileImage = imageMapping[profilePictureUrl] || imageMapping['default-profile.png'];

    return (
        <ScrollView>
            <View style={styles.container}>
                <View style={styles.userProfile}>
                    {isAdmin && (
                        <TouchableOpacity onPress={() => navigation.navigate('ManagementMenu')} style={styles.adminButton}>
                            <Image source={require('../assets/admin.png')} style={styles.adminMenuIcon} />
                        </TouchableOpacity>
                    )}
                    <View style={{ flex: 1 }} /> 
                        <TouchableOpacity onPress={() => navigation.navigate('NotificationScreen')} style={styles.notificationButton}>
                        <Ionicons
                            name={hasNewNotifications ? "notifications" : "notifications-outline"}
                            size={30}
                            color="black"
                            style={styles.notificationIcon}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('IndexProfile')} style={styles.profileButton}>
                        <Image source={profileImage} style={styles.profilePic} />
                    </TouchableOpacity>
                    
                </View>

                {/* เมนูต่างๆ */}
                <TouchableOpacity onPress={() => navigation.navigate('Region', { region: 'North' })} style={styles.menuItem}>
                    <Image source={getMenuImageSource('North')} style={styles.menuImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Region', { region: 'Northeastern' })} style={styles.menuItem}>
                    <Image source={getMenuImageSource('Northeastern')} style={styles.menuImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Region', { region: 'Central' })} style={styles.menuItem}>
                    <Image source={getMenuImageSource('central')} style={styles.menuImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Region', { region: 'South' })} style={styles.menuItem}>
                    <Image source={getMenuImageSource('South')} style={styles.menuImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Nearby')} style={styles.menuItem}>
                    <Image source={getMenuImageSource('store')} style={styles.menuImage} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('Community')} style={styles.menuItem}>
                    <Image source={getMenuImageSource('community')} style={styles.menuImage} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 15,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        textAlign: 'center',
        position: 'relative',
        margin: 'auto',
        height: 700,
    },
    userProfile: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20, // เพิ่ม right เพื่อควบคุมการชิดขวา
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    adminButton: {
        marginRight: 10,
    },
    adminMenuIcon: {
        width: 50, // ปรับขนาดตามต้องการ
        height: 50, // ปรับขนาดตามต้องการ
        borderRadius: 5,
        objectFit: 'cover',
        border: '1px solid #ddd',
    },
    notificationButton: {
        marginLeft: 10,
    },
    notificationIcon: {
        // ไม่ต้องกำหนด margin ที่นี่แล้ว
    },
    profileButton: {
        marginLeft: 10,
    },
    profilePic: {
        width: 50, // ปรับขนาดตามต้องการ
        height:50, // ปรับขนาดตามต้องการ
        borderRadius: 25,
        borderColor: '#ddd',
        borderWidth: 1,
        marginLeft: 10,
    },
    header: {
        marginBottom: 15,
    },
    searchBar: {
        width: '94%',
        height: 30,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        padding: 7,
        backgroundColor: '#f9f9f9',
        position: 'relative',
        top: 70,
        left: 4,
    },
    menuItem: {
        color: 'white',
        border: 'none',
        borderRadius: 10,
        padding: 2,
        width: '100%',
        textAlign: 'center',
        fontSize: 18,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-color 0.3s ease',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 80,
        marginBottom: 5,
        position: 'relative',
        top: 70,
    },
    menuImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});