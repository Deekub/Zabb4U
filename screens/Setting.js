import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_URL, PIC_URL } from '../backend/config/config'; // ปรับ path config
import { useLanguage } from '../LanguageContext'; // Import useLanguage

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('/default-profile.png');
  const [token, setToken] = useState(null);
  const { translate } = useLanguage(); // ดึงฟังก์ชัน translate

  useEffect(() => {
    const loadUserData = async () => {
      const storedToken = await AsyncStorage.getItem('userToken');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await fetch(`${API_URL}/api/users/me`, { // 👈 แก้ไข URL
            headers: {
              Authorization: `Bearer ${storedToken}`, // 👈 ส่ง Token ใน Header
            },
          });

          if (response.ok) {
            const userData = await response.json();
            console.log("DATA : ",userData);
            setName(userData.name || 'ไม่มีชื่อ');
            setEmail(userData.email || 'ไม่มีอีเมล');
            setProfilePictureUrl(userData.profilePictureUrl || '/default-profile.png'); // 👈 ใช้ profilePictureUrl จาก API
            
          } else {
            console.log('Failed to fetch user data');
            navigation.replace('Login');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          navigation.replace('Login');
        }
      } else {
        navigation.replace('Login');
      }
    };

    loadUserData();
  }, [navigation]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

    const imageMapping = {
        'profile1.png': require('../assets/profile1.png'),
        'profile2.png': require('../assets/profile2.png'),
        'profile3.png': require('../assets/profile3.png'),
        'profile4.png': require('../assets/profile4.png'),
        'profile5.png': require('../assets/profile5.png'),
        // เพิ่มไฟล์อื่นๆ ที่ต้องการ
        'default-profile.png': require('../assets/profile1.png') // กรณีไม่มีข้อมูลหรือไม่พบไฟล์
    };

    const avatarSource = imageMapping[profilePictureUrl] || imageMapping['default-profile.png'];

  return (
    <View style={styles.body}>
      <View style={styles.profileContainer}>
        <View style={styles.profileAvatarContainer}>
          <Image
            source={avatarSource}
            alt="Profile Avatar"
            style={styles.profileAvatar}
          />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>

        <View style={styles.profileActions}>
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Text>{translate('button_edit_profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  profileContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  backbutton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
  },
  profileAvatarContainer: {
    marginTop: 20,
    marginBottom: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: 'gray',
  },
  profileActions: {
    width: '100%',
  },
  editProfileButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  editText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;