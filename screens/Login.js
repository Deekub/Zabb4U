import React, { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../backend/config/config';

const saveUsername = async (username) => {
  if (Platform.OS === 'web') {
    if (username) {
      localStorage.setItem('username', username);
    } else {
      console.warn('Warning: Username is undefined, not saving to localStorage.');
    }
  } else {
    if (username) {
      await AsyncStorage.setItem('username', username);
    } else {
      console.warn('Warning: Username is undefined, not saving to AsyncStorage.');
    }
  }
};

const getUsername = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('username');
  } else {
    return await AsyncStorage.getItem('username');
  }
};

const removeUsername = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('username');
  } else {
    await AsyncStorage.removeItem('username');
  }
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await res.json();
      console.log('📦 API Response:', data);

      if (!data.token) {
        throw new Error('Token not found in response');
      }

      const decoded = jwtDecode(data.token);
      console.log('Decoded Token:', decoded);
      const usernameFromToken = decoded.username;
      const storedUsername = usernameFromToken || data.user?.display_name || data.user?.email;

      await AsyncStorage.setItem('userToken', data.token);
      await saveUsername(storedUsername);

      Alert.alert('Login Success', `Welcome ${data.user?.name || data.user?.email}`);
      navigation.navigate('Dashboard');

    } catch (error) {
      console.error('🚨 Login error:', error.message);
      setErrorMsg(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Log in</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPasswordScreen')}>
        <Text style={styles.forgot}>Forgot Password?</Text> 
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.signup}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  logo: { width: 100, height: 100, resizeMode: 'contain', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15 },
  button: { backgroundColor: '#ff6b6b', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  forgot: { color: '#0066cc', marginBottom: 20, textAlign: 'right' },
  signup: { marginTop: 20, textAlign: 'center', color: '#0066cc' },
  error: { color: 'red', textAlign: 'center', marginTop: 10 },
});