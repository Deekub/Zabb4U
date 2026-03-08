import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../backend/config/config';

export default function SignUpForm() {
    const navigation = useNavigation();
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleAvatarChange = (imageSrc) => {
        setSelectedAvatar(imageSrc);
    };

    const handleSubmit = async () => {
        if (password !== confirmPassword) {
            setErrorMsg("Passwords don't match.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, avatar: selectedAvatar }),
            });

            const responseText = await res.text(); // อ่าน Response เป็น Text ดิบๆ
            console.log("Raw Response:", responseText); // Log Response ดิบ

            const data = JSON.parse(responseText); // พยายาม Parse เป็น JSON หลังจาก Log

            if (res.ok) {
                navigation.navigate('Login');  // ไปที่หน้า Login หลังจากสมัครเสร็จ
            } else {
                setErrorMsg(data.message || 'Sign up failed');
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "There was an error while signing up.");
        }
    };

    const getAvatarImage = (avatarName) => {
        switch (avatarName) {
            case 'profile1.png':
                return require('../assets/profile1.png');
            case 'profile2.png':
                return require('../assets/profile2.png');
            case 'profile3.png':
                return require('../assets/profile3.png');
            case 'profile4.png':
                return require('../assets/profile4.png');
            case 'profile5.png':
                return require('../assets/profile5.png');
            default:
                return require('../assets/profile1.png');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.logo}>
            <Image source={require('../assets/logo.png')} style={styles.logoImage} />
        </View>
        
        <Text style={styles.header}>Sign Up</Text>

        <View style={styles.profileContainer}>
            <Image source={getAvatarImage(selectedAvatar || 'profile1.png')} style={styles.avatar} />
        </View>
        <Text>Select Your Profile Picture</Text>

        <View style={styles.avatarOptions}>
            {['profile1.png', 'profile2.png', 'profile3.png', 'profile4.png', 'profile5.png'].map((image, index) => (
                <TouchableOpacity key={index} onPress={() => handleAvatarChange(image)}>
                    <Image source={getAvatarImage(image)} style={[styles.avatarOption, selectedAvatar === image && styles.selectedAvatar]} />
                </TouchableOpacity>
            ))}
        </View>

        <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            required
        />
        <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            required
        />
        <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            required
        />
        <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            required
        />

        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>

        {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
    </ScrollView>
);
}

const styles = StyleSheet.create({
container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
},
backButton: {
    marginBottom: 20,
},
backButtonText: {
    fontSize: 18,
    color: 'blue',
},
logo: {
    alignItems: 'center',
    marginBottom: 20,
},
logoImage: {
    width: 100,
    height: 100,
},
header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 10,
},
profileContainer: {
    alignItems: 'center',
    marginBottom: 10,
},
avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
},
avatarOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
},
avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
},
selectedAvatar: {
    borderColor: 'blue',
    borderWidth: 2,
},
input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
},
submitButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
},
submitButtonText: {
    color: '#fff',
    fontSize: 18,
},
errorMsg: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
},
});