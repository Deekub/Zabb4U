import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Modal,
    Platform,
    Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../backend/config/config';
import { FontAwesome } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../LanguageContext';
import FoodItem from '../components/FoodItem';
import ShakeToRandomModal from '../components/ShakeToRandomModal';

const RegionScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { region } = route.params;

    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filteredFoods, setFilteredFoods] = useState([]);
    const [randomFoods, setRandomFoods] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [isShakeModalVisible, setIsShakeModalVisible] = useState(false);
    const lastShakeTime = useRef(0);
    const subscription = useRef(null);
    const SHAKE_THRESHOLD = 3;
    const { translate } = useLanguage();

    const getTranslatedRegionName = useCallback((regionKey) => {
        switch (regionKey) {
            case 'North':
                return translate('north');
            case 'Central':
                return translate('central');
            case 'South':
                return translate('south');
            case 'Northeastern':
                return translate('northeastern');
            default:
                return regionKey;
        }
    }, [translate]);

    const handleRandom = useCallback(() => {
        const shuffled = [...foods].sort(() => 0.5 - Math.random());
        setRandomFoods(shuffled.slice(0, 5));
        setSearch('');
    }, [foods]);

    const _handleAccelerometerData = useCallback(
        (accelerometerData) => {
            if (!accelerometerData || !isShakeModalVisible) {
                return;
            }
            let { x, y, z } = accelerometerData;
            let magnitude = Math.sqrt(x * x + y * y + z * z);

            const now = Date.now();
            if (magnitude > SHAKE_THRESHOLD && now - lastShakeTime.current > 500) {
                if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleRandom();
                    setIsShakeModalVisible(false);
                    lastShakeTime.current = now;
                    _unsubscribe();
                }
            }
        },
        [handleRandom, isShakeModalVisible]
    );

    const _subscribe = useCallback(() => {
        if (Platform.OS !== 'web' && Accelerometer && Accelerometer.addListener) {
            subscription.current = Accelerometer.addListener(_handleAccelerometerData);
        } else {
            console.log('Accelerometer not available on web, shake feature disabled.');
        }
    }, [_handleAccelerometerData]);

    const _unsubscribe = useCallback(() => {
        subscription.current && subscription.current.remove();
        subscription.current = null;
    }, []);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            Accelerometer.setUpdateInterval(200);
            _subscribe();
            return () => _unsubscribe();
        }
    }, [_subscribe, _unsubscribe]);

    useEffect(() => {
        if (region) {
            fetchRegionFoods();
        }
    }, [region]);

    const fetchRegionFoods = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                Alert.alert(translate('please_login'), translate('please_login_to_see_restaurants'));
                navigation.navigate('Login');
                return;
            }

            const response = await fetch(`${API_URL}/api/region/${region}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    Alert.alert(translate('session_expired'), translate('please_login_again'));
                    navigation.navigate('Login');
                    return;
                }
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                setFoods(data);
                setFilteredFoods(data);
            } else {
                setFoods([]);
                setFilteredFoods([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setFoods([]);
            setFilteredFoods([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (search.trim() !== '') {
            const results = foods.filter(food =>
                typeof food.res_name === 'string' &&
                food.res_name.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredFoods(results);
            setRandomFoods([]);
        } else {
            setFilteredFoods(foods);
        }
    }, [search, foods]);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) return;

            const res = await fetch(`${API_URL}/api/favorites`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                const data = await res.json();
                const favoriteIds = data.favorites.map(f => f.id);
                setFavorites(favoriteIds);
            }
        } catch (err) {
            console.error('Error loading favorites:', err);
        }
    };

    const handleRandomPress = useCallback(() => {
        if (Platform.OS === 'web') {
            handleRandom();
        } else {
            setIsShakeModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [handleRandom]);

    const resetRandom = useCallback(() => {
        setRandomFoods([]);
        setSearch('');
    }, []);

    const toggleFavorite = useCallback(async (restaurantId) => {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) return;

        const isFavorite = favorites.includes(restaurantId);

        try {
            const url = `${API_URL}/api/favorites/${isFavorite ? 'remove' : 'add'}`;
            const method = isFavorite ? 'DELETE' : 'POST';
            const body = isFavorite ? null : JSON.stringify({ restaurant_id: restaurantId });

            const res = await fetch(url + (isFavorite ? `/${restaurantId}` : ''), {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body,
            });

            if (res.ok) {
                fetchFavorites();
            }
        } catch (error) {
            console.error('Toggle favorite error:', error);
        }
    }, [favorites, fetchFavorites]);

    const navigateToRestaurant = useCallback((foodId) => {
        AsyncStorage.setItem('lastRegion', region);
        navigation.navigate('RestaurantDetail', { id: foodId, region });
    }, [navigation, region]);

    const displayedFoods = randomFoods.length > 0 ? randomFoods : filteredFoods;

    const renderItem = useCallback(({ item }) => (
        <FoodItem
            item={item}
            isFavorite={favorites.includes(item.id)}
            onPress={() => navigateToRestaurant(item.id)}
            onToggleFavorite={toggleFavorite}
        />
    ), [navigateToRestaurant, toggleFavorite, favorites]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                <Text style={styles.title}>{getTranslatedRegionName(region)}</Text>

                <View style={styles.searchBarContainer}>
                    <View style={styles.searchBar}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={translate('search_restaurants')}
                            placeholderTextColor="#999"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <TouchableOpacity style={styles.resetButton} onPress={resetRandom}>
                        <FontAwesome name="refresh" size={24} color="black" style={styles.resetButtonText}/>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.randomButton} onPress={handleRandomPress}>
                        <Text style={styles.randomButtonText}>🎲</Text>
                    </TouchableOpacity>
                </View>

                <ShakeToRandomModal
                    isVisible={isShakeModalVisible}
                    onClose={() => {
                        setIsShakeModalVisible(false);
                        _unsubscribe();
                    }}
                    onRandomize={handleRandom}
                    translate={translate}
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#FF6B00" style={styles.loader} />
                ) : (
                    <FlatList
                        data={displayedFoods}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
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
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 20,
        textAlign: 'center',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    searchBar: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchInput: {
        height: 40,
        color: 'black',
    },
    resetButton: {
        width: 40,
        height: 40,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resetButtonText: {
        color: 'black',
        fontSize: 20,
    },
    randomButton: {
        width: 40,
        height: 40,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    randomButtonText: {
        fontSize: 20,
    },
    loader: {
        marginTop: 30,
    },
    foodList: {
        flex: 1,
    },
});

export default RegionScreen;