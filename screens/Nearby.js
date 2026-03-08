import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
    Modal,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../backend/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../LanguageContext';
import RestaurantItem from '../components/RestaurantItem';
import DistanceSlider from '../components/DistanceSlider';
import ShakeToRandomModal from '../components/ShakeToRandomModal';

const NearbyRestaurantsScreen = () => {
    const navigation = useNavigation();
    const [restaurants, setRestaurants] = useState([]);
    const [distance, setDistance] = useState(10);
    const [errorMsg, setErrorMsg] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [search, setSearch] = useState('');
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [randomRestaurants, setRandomRestaurants] = useState([]);
    const [location, setLocation] = useState(null);
    const [isShakeModalVisible, setIsShakeModalVisible] = useState(false);
    const lastShakeTime = useRef(0);
    const subscription = useRef(null);
    const SHAKE_THRESHOLD = 1.5;
    const { translate } = useLanguage();

    const handleRandom = useCallback(() => {
        const shuffled = [...filteredRestaurants].sort(() => 0.5 - Math.random());
        setRandomRestaurants(shuffled.slice(0, 5));
    }, [filteredRestaurants]);

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
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg(translate('location_permission_required'));
                return;
            }
            let locationData = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                maximumAge: 0,
                timeout: 1000,
            });
            setLocation(locationData);
            fetchFavorites();
        })();
    }, []);

    useEffect(() => {
        const fetchNearbyRestaurants = async () => {
            if (location) {
                const { latitude, longitude } = location.coords;
                try {
                    const res = await axios.get(
                        `${API_URL}/api/nearby?lat=${latitude}&lng=${longitude}&distance=${distance}`
                    );
                    setRestaurants(res.data);
                    setFilteredRestaurants(res.data);
                } catch (err) {
                    console.error('Error fetching nearby restaurants:', err);
                    setErrorMsg(translate('failed_to_load_nearby_restaurants'));
                }
            }
        };
        fetchNearbyRestaurants();
    }, [location, distance, translate]);

    useEffect(() => {
        if (search.trim() !== '') {
            const results = restaurants.filter((restaurant) =>
                typeof restaurant.res_name === 'string' &&
                restaurant.res_name.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredRestaurants(results);
            setRandomRestaurants([]);
        } else {
            setFilteredRestaurants(restaurants);
            setRandomRestaurants([]);
        }
    }, [search, restaurants]);

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

    const handleRandomPress = useCallback(() => {
        if (Platform.OS === 'web') {
            handleRandom();
        } else {
            setIsShakeModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            _subscribe();
        }
    }, [handleRandom, _subscribe]);

    const handleReset = () => {
        setSearch('');
        setDistance(10);
        setRandomRestaurants([]);
        setFilteredRestaurants(restaurants);
    };

    const goToRestaurantDetail = (id) => {
        navigation.navigate('RestaurantDetail', { id: id });
    };

    if (errorMsg) {
        return (
            <View style={styles.container}>
                <Text>{errorMsg}</Text>
            </View>
        );
    }

    const displayedRestaurants = randomRestaurants.length > 0 ? randomRestaurants : filteredRestaurants;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{translate('nearby_restaurants')}</Text>

            <View style={styles.searchBarContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder={translate('search_restaurants')}
                    value={search}
                    onChangeText={(text) => setSearch(text)}
                />
                <TouchableOpacity onPress={handleReset} style={styles.resetRandomButton}>
                    <FontAwesome name="refresh" size={24} color="black" style={styles.resetButtonText}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRandomPress} style={styles.randomButton}>
                    <Text style={styles.randomButtonText}>🎲</Text>
                </TouchableOpacity>
            </View>

            <DistanceSlider onValueChange={(value) => setDistance(value)} initialValue={distance} translate={translate} />

            <ShakeToRandomModal
                isVisible={isShakeModalVisible}
                onClose={() => {
                    setIsShakeModalVisible(false);
                    _unsubscribe();
                }}
                onRandomize={handleRandom}
                translate={translate}
            />

            <View style={styles.foodList}>
                {displayedRestaurants.map((r) => (
                    <RestaurantItem
                        key={r.id}
                        restaurant={r}
                        isFavorite={favorites.includes(r.id)}
                        onPress={() => goToRestaurantDetail(r.id)}
                        onToggleFavorite={toggleFavorite}
                        translate={translate}
                    />
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginRight: 10,
    },
    resetRandomButton: {
        padding: 10,
        marginLeft: 5,
    },
    resetRandomText: {
        fontSize: 20,
    },
    randomButton: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 5,
        marginLeft: 5,
    },
    randomButtonText: {
        fontSize: 20,
    },
    foodList: {
        marginTop: 10,
    },
});

const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonClose: {
        backgroundColor: '#2196F3',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 18,
    },
});

export default NearbyRestaurantsScreen;