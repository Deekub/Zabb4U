import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../backend/config/config';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stage, setStage] = useState('request');
  const navigation = useNavigation();

  const showAlert = (title, message, buttons = []) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      if (buttons.length > 0 && buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const handleRequestOTP = async () => {
    if (!email) {
      showAlert('ข้อผิดพลาด', 'กรุณากรอกอีเมล');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/forgot-password/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('สำเร็จ', data.message);
        setStage('verify');
      } else {
        showAlert('ข้อผิดพลาด', data.error || 'เกิดข้อผิดพลาดในการส่ง OTP');
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      showAlert('ข้อผิดพลาด', 'กรุณากรอก OTP');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/forgot-password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('สำเร็จ', data.message);
        setStage('reset');
      } else {
        showAlert('ข้อผิดพลาด', data.error || 'OTP ไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      showAlert('ข้อผิดพลาด', 'กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/forgot-password/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('สำเร็จ', data.message, [
          {
            text: 'ตกลง',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      } else {
        showAlert('ข้อผิดพลาด', data.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ลืมรหัสผ่าน</Text>

      {stage === 'request' && (
        <View>
          <Text>กรุณากรอกอีเมลของคุณเพื่อรับรหัส OTP สำหรับการรีเซ็ตรหัสผ่าน</Text>
          <TextInput
            style={styles.input}
            placeholder="อีเมล"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Button title="ส่ง OTP" onPress={handleRequestOTP} />
        </View>
      )}

      {stage === 'verify' && (
        <View>
          <Text>กรุณากรอกรหัส OTP ที่เราส่งไปยังอีเมลของคุณ ลองเช็คในแสปมหรือจดหมายขยะ</Text>
          <TextInput
            style={styles.input}
            placeholder="OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />
          <Button title="ยืนยัน OTP" onPress={handleVerifyOTP} />
        </View>
      )}

      {stage === 'reset' && (
        <View>
          <Text>กรุณากรอกรหัสผ่านใหม่ของคุณ</Text>
          <TextInput
            style={styles.input}
            placeholder="รหัสผ่านใหม่"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Button title="ตั้งรหัสผ่านใหม่" onPress={handleResetPassword} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

export default ForgotPasswordScreen;