import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/Login';
import SignupScreen from './screens/Signup';
import Dashboard from './screens/Dashboard';
import IndexProfile from './screens/IndexProfile';
import Region from './screens/Region';
import ManagementMenu from './screens/ManagementMenu';
import AddMenu from './screens/AddMenu';
import FavoritesPage from './screens/Favorites';
import EditMenu from './screens/EditMenu';
import EditRestaurantPage from './screens/EditRestaurantPage';
import DeleteMenuScreen from './screens/DeleteMenu';
import NearbyRestaurantsScreen from './screens/Nearby';
import RestaurantDetailScreen from './screens/RestaurantsDetail';
import CommunityScreen from './screens/CommunityScreen';
import SettingsScreen from './screens/Setting';
import EditProfileScreen from './screens/EditProfile';
// import LanguageSettingsScreen from './screens/LanguageSettingsScreen';
import NotificationScreen from './screens/Notification';
import NotificationDetailScreen from './screens/NotificationDetailScreen';
import ReportMenuScreen from './screens/ReportMenu';
import ReportDetailScreen from './screens/ReportDetailScreen';
import ForgotPasswordScreen from './screens/ResetPassword';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LanguageProvider } from './LanguageContext';
import { Ionicons } from '@expo/vector-icons';


const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // เมื่อแอพเปิดขึ้น ให้รอ 1.5 วินาทีเพื่อแสดงโลโก้
    const timer = setTimeout(() => {
      setIsLoading(false); // หลังจาก 1.5 วินาที เปลี่ยนไปหน้า Login
    }, 2000);

    return () => clearTimeout(timer); // เคลียร์ timeout หากมีการยกเลิก
  }, []);

  if (isLoading) {
    // หน้าโลโก้แสดงในขณะที่กำลังโหลด
    return (
      <View style={styles.container}>
        <Image source={require('./assets/logo.png')} style={styles.logo} />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'เข้าสู่ระบบ' }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'สมัครสมาชิก' }} />
          <Stack.Screen
            name="ForgotPasswordScreen"
            component={ForgotPasswordScreen}
            options={({ navigation }) => ({
              title: 'ลืมรหัสผ่าน',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="Dashboard" component={Dashboard} options={{
            title: 'หน้าหลัก',
            headerLeft: () => null, // ซ่อนปุ่ม Back ด้านซ้าย
            gestureEnabled: false, // ปิดการ Swipe เพื่อย้อนกลับ (ถ้ามี) 
          }} />
            <Stack.Screen
            name="NotificationScreen"
            component={NotificationScreen}
            options={({ navigation }) => ({
              title: 'การแจ้งเตือน',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="NotificationDetailScreen"
            component={NotificationDetailScreen}
            options={({ navigation }) => ({
              title: 'รายละเอียดการแจ้งเตือน',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('NotificationScreen')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="IndexProfile"
            component={IndexProfile}
            options={({ navigation }) => ({
              title: 'โปรไฟล์',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="Region" component={Region} options={{ title: 'ภูมิภาค' }} />
          <Stack.Screen
            name="ManagementMenu"
            component={ManagementMenu}
            options={({ navigation }) => ({
              title: 'หน้าจัดการร้าน',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="AddMenu"
            component={AddMenu}
            options={({ navigation }) => ({
              title: 'เพิ่มร้านอาหาร',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('ManagementMenu')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="Favorites" component={FavoritesPage} options={{ title: 'รายการโปรด' }} />
          <Stack.Screen
            name="EditMenu"
            component={EditMenu}
            options={({ navigation }) => ({
              title: 'แก้ไขร้านอาหาร',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('ManagementMenu')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="EditRestaurantPage" component={EditRestaurantPage} options={{ title: 'แก้ไขร้านอาหาร' }} />
          <Stack.Screen name="DeleteMenu" component={DeleteMenuScreen} options={{ title: 'ลบร้านอาหาร' }} />
          <Stack.Screen name="Nearby" component={NearbyRestaurantsScreen} options={{ title: 'ร้านใกล้ฉัน' }} />
          <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ title: 'ร้าน' }} />
          <Stack.Screen
            name="Community"
            component={CommunityScreen}
            options={({ navigation }) => ({
              title: 'ชุมชน',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="SettingsScreen"
            component={SettingsScreen}
            options={({ navigation }) => ({
              title: 'โปรไฟล์',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('IndexProfile')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'แก้ไขโปรไฟล์' }} />
          <Stack.Screen
            name="ReportMenu"
            component={ReportMenuScreen}
            options={({ navigation }) => ({
              title: 'รายละเอียดรายงาน',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('ManagementMenu')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen
            name="ReportDetailScreen"
            component={ReportDetailScreen}
            options={({ navigation }) => ({
              title: 'รายละเอียดรายงาน',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('ReportMenu')}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
              ),
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
});
