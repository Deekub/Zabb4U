import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../backend/config/config';
import { useLanguage } from '../LanguageContext'; // Import useLanguage

const EditProfileScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('default-profile.png'); // Default filename
    const [initialProfilePictureUrl, setInitialProfilePictureUrl] = useState('default-profile.png');
    const { translate } = useLanguage(); // ดึงฟังก์ชัน translate

    const avatarOptions = [
        'profile1.png',
        'profile2.png',
        'profile3.png',
        'profile4.png',
        'profile5.png',
    ];

    const avatarSources = {
        'profile1.png': require('../assets/profile1.png'),
        'profile2.png': require('../assets/profile2.png'),
        'profile3.png': require('../assets/profile3.png'),
        'profile4.png': require('../assets/profile4.png'),
        'profile5.png': require('../assets/profile5.png'),
        'default-profile.png': require('../assets/profile1.png'), // Make sure this exists
    };

    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    const response = await fetch(`${API_URL}/api/users/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setName(data.name || '');
                        setSelectedAvatar(data.pic || 'default-profile.png'); // Ensure default is a filename
                    } else {
                        console.log('Failed to load profile');
                    }
                } else {
                    navigation.replace('Login');
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                Alert.alert('Error', 'Failed to load profile.');
            }
        };

        loadUserProfile();
    }, [navigation]);

    const handleSave = async () => {
        if (newPassword && newPassword !== confirmPassword) {
            Alert.alert('Error', translate('password_mismatch'));
            return;
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const response = await fetch(`${API_URL}/api/updateprofile`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: name,
                        password: newPassword,
                        profilePictureUrl: selectedAvatar, // ส่งเป็นชื่อไฟล์
                    }),
                });

                if (response.ok) {
                    if (Platform.OS !== 'web') {
                        Alert.alert(translate('success'), translate('profile_updated_successfully'), [
                            { text: translate('ok'), onPress: () => navigation.navigate('SettingsScreen') },
                        ]);
                    } else {
                        alert(`${translate('success')}: ${translate('profile_updated_successfully')}`); // หรือแสดงผลลัพธ์บน Web ในรูปแบบอื่น
                        navigation.navigate('SettingsScreen');
                    }
                } else {
                    const errorData = await response.json();
                    Alert.alert('Error', `${translate('error_updating_profile')}: ${errorData.message || translate('unknown_error')}`);
                    console.log('Response:', response);
                    console.log('Error Data:', errorData);
                }
            } else {
                navigation.replace('Login');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', translate('error_updating'));
        }
    };

    const handleAvatarSelect = (avatarFilename) => {
        setSelectedAvatar(avatarFilename);
    };

    return (
        <View style={stylesRN.container}>
            <Text style={stylesRN.heading}>{translate('heading_edit_profile')}</Text>

            <View style={stylesRN.avatarPreview}>
                <Image
                    source={avatarSources[selectedAvatar] || avatarSources['default-profile.png']}
                    style={stylesRN.avatarImage}
                />
            </View>

            <View style={stylesRN.profileOptions}>
                {avatarOptions.map((filename, index) => (
                    <TouchableOpacity key={index} onPress={() => handleAvatarSelect(filename)}>
                        <Image
                            source={avatarSources[filename]}
                            style={[stylesRN.avatarOption, selectedAvatar === filename && stylesRN.selectedAvatar]}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            <TextInput
                style={stylesRN.input}
                placeholder={translate('new_profile_name')}
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={stylesRN.input}
                placeholder={translate('new_password')}
                secureTextEntry={true}
                value={newPassword}
                onChangeText={setNewPassword}
            />
            <TextInput
                style={stylesRN.input}
                placeholder={translate('confirm_new_password_label')}
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />
            <TouchableOpacity style={stylesRN.button} onPress={handleSave}>
                <Text style={stylesRN.buttonText}>{translate('button_save')}</Text>
            </TouchableOpacity>
        </View>
    );
};

const stylesRN = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f4f4f4',
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    avatarPreview: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    profileOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    avatarOption: {
        width: 50,
        height: 50,
        borderRadius: 25,
        margin: 5,
    },
    selectedAvatar: {
        borderWidth: 2,
        borderColor: 'blue',
    },
    input: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        backgroundColor: 'blue',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditProfileScreen;