import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Alert,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_URL, PIC_URL } from '../backend/config/config'; // Import PIC_URL
import { useLanguage } from '../LanguageContext'; // Import useLanguage
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons for heart icon

const FavoritesPage = () => {
    const navigation = useNavigation();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { translate } = useLanguage(); // ดึงฟังก์ชัน translate

    const fetchFavorites = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                setError(translate('please_login'));
                setLoading(false);
                return;
            }

            const res = await fetch(`${API_URL}/api/favorites`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    Alert.alert(translate('session_expired'), translate('please_login_again'));
                    navigation.navigate('Login');
                }
                throw new Error('Error fetching favorites');
            }

            const data = await res.json();
            setFavorites(data.favorites || []);
        } catch (err) {
            console.error(err);
            setError(translate('error_loading_data'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (restaurantId) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/api/favorites/remove/${restaurantId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error('Failed to remove favorite');
            }

            setFavorites(prev => prev.filter(item => item.id !== restaurantId));
        } catch (err) {
            console.error(err);
            Alert.alert(translate('error'), translate('failed_to_remove_favorite'));
        }
    };

    const navigateToRestaurant = useCallback((restaurantId) => {
        navigation.navigate('RestaurantDetail', { id: restaurantId });
    }, [navigation]);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.foodItem}
            onPress={() => navigateToRestaurant(item.id)}
        >
            <Image
                source={{ uri: item.pic ? `${PIC_URL}${item.pic}` : 'https://via.placeholder.com/150' }}
                style={styles.foodImage}
                defaultSource={require('../assets/logo.png')}
            />
            <View style={styles.foodDetails}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodDescription}>{item.description}</Text>
                <View style={styles.foodInfo}>
                    <View style={styles.rating}>
                        <Text style={styles.ratingText}>{item.score}</Text>
                        <Text style={styles.starIcon}>★</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={24} color="#FF6B00" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <Text style={styles.title}>{translate('favorites')}</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6B00" style={{ marginTop: 30 }} />
                ) : error ? (
                    <Text style={styles.error}>{error}</Text>
                ) : favorites.length === 0 ? (
                    <Text style={styles.empty}>{translate('no_favorites')}</Text>
                ) : (
                    <FlatList
                        data={favorites}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        style={styles.foodList}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff', // เหมือน Region
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff', // เหมือน Region
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black', // เหมือน Region
        marginBottom: 20,
        textAlign: 'center',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    empty: {
        color: '#666', // สีเทาอ่อน
        textAlign: 'center',
        marginTop: 20,
    },
    foodList: {
        flex: 1,
        marginTop: 10,
    },
    foodItem: {
        backgroundColor: '#f9f9f9', // สีพื้นหลังอ่อน
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center', // จัดกึ่งกลางแนวตั้ง
    },
    foodImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 15,
        backgroundColor: '#ddd', // เพิ่มสีพื้นหลังกันภาพโหลดช้า
    },
    foodDetails: {
        flex: 1,
        paddingVertical: 10,
        justifyContent: 'space-between',
    },
    foodName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 5,
    },
    foodDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    foodInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        color: 'black',
        marginRight: 4,
    },
    starIcon: {
        color: '#ff9800',
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
    deleteButtonText: {
        color: '#FF6B00',
        fontSize: 14,
    },
});

export default FavoritesPage;