import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../backend/config/config';
import { useLanguage } from '../LanguageContext';
import { FontAwesome } from '@expo/vector-icons';

const imageMapping = {
  'profile1.png': require('../assets/profile1.png'),
  'profile2.png': require('../assets/profile2.png'),
  'profile3.png': require('../assets/profile3.png'),
  'profile4.png': require('../assets/profile4.png'),
  'profile5.png': require('../assets/profile5.png'),
  'default-profile.png': require('../assets/profile1.png')
};

const IndexProfile = () => {
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState(null);
  const navigation = useNavigation();
  const { locale, changeLanguage, translate } = useLanguage();
  const [isEnglish, setIsEnglish] = useState(locale === 'en');

  const toggleLanguage = () => {
    const newLocale = isEnglish ? 'th' : 'en';
    setIsEnglish(!isEnglish);
    changeLanguage(newLocale);
    AsyncStorage.setItem('locale', newLocale); // บันทึกภาษาที่เลือกไว้
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          navigation.navigate('Login');
          return;
        }

        const decoded = jwtDecode(token);
        const userId = decoded.userId;

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
          setRole(user.permission);
          setProfilePictureUrl(user.pic || 'default-profile.png');
          if (user.permission === 'admin') {
            setIsAdmin(true);
          }
        } else {
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Error occurred:', error);
        navigation.navigate('Login');
      }
    };

    fetchData();
  }, [navigation]);

  const profileImage = imageMapping[profilePictureUrl] || imageMapping['default-profile.png'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileicon}>
          <Image source={profileImage} style={styles.profilePic} />
        </View>
        <Text style={styles.title}>Zabb 4U</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SettingsScreen')}>
        <Text style={styles.buttonText}>{translate('account_settings')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Favorites')}>
        <Text style={styles.buttonText}>{translate('favorites')}</Text>
      </TouchableOpacity>

      {/* แทนที่ปุ่มเลือกภาษาด้วย Switch */}
      <View style={styles.languageSwitchContainer}>
        <Text style={styles.buttonText}>{translate('language')}            </Text>
        <Text style={[styles.languageText, !isEnglish && styles.activeLanguageText]}>{translate('thai')}</Text>
        <TouchableOpacity
          style={[styles.languageSwitch, isEnglish ? styles.languageSwitchOn : styles.languageSwitchOff]}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <View style={styles.languageThumb} />
        </TouchableOpacity>
        <Text style={[styles.languageText, isEnglish && styles.activeLanguageText]}>{translate('english')}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={async () => {
        await AsyncStorage.removeItem('userToken');
        navigation.navigate('Login');
      }}>
        <Text style={styles.buttonText}>{translate('logout')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20, // ลด padding เพื่อให้เข้ากับ Switch
    height: 'auto', // ปรับความสูงอัตโนมัติ
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    margin: 'auto',
    gap: 10,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileicon: {
    width: 70,
    height: 70,
    backgroundColor: '#eee',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  profilePic: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  button: {
    width: '100%',
    padding: 12,
    marginVertical: 8, // ปรับ margin ให้เล็กลง
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: 'black',
  },
  languageSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    marginVertical: 12,
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
  activeLanguageText: {
    fontWeight: 'bold',
    color: 'blue',
  },
  languageSwitch: {
    width: 60,
    height: 30,
    backgroundColor: '#ccc',
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  languageSwitchOn: {
    backgroundColor: 'green',
    alignItems: 'flex-end',
  },
  languageSwitchOff: {
    backgroundColor: '#ccc',
    alignItems: 'flex-start',
  },
  languageThumb: {
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});

export default IndexProfile;