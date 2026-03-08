import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { PIC_URL } from '../backend/config/config';
import { Ionicons } from '@expo/vector-icons';

const RestaurantItem = ({ restaurant, onPress, isFavorite, onToggleFavorite, translate }) => {
    return (
        <TouchableOpacity style={styles.foodItem} onPress={() => onPress(restaurant.id)}>
            <Image
                source={{ uri: restaurant.pic ? `${PIC_URL}${restaurant.pic}` : 'https://via.placeholder.com/150' }}
                style={styles.foodImage}
                defaultSource={require('../assets/logo.png')}
            />
            <View style={styles.foodDetails}>
                <Text style={styles.foodName}>{restaurant.res_name}</Text>
                <Text style={styles.foodDescription}>{restaurant.description}</Text>
                <Text>{translate('distance_away')} {restaurant.distance?.toFixed(2)} {translate('km')}</Text>
                <View style={styles.foodInfo}>
                    <Text style={styles.rating}>{restaurant.score} ★</Text>
                    <TouchableOpacity onPress={() => onToggleFavorite(restaurant.id)} style={styles.heartButton}>
                        <Ionicons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={24}
                            color={isFavorite ? 'red' : 'black'}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    foodItem: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    foodImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 15,
        backgroundColor: '#ddd',
    },
    foodDetails: {
        flex: 1,
    },
    foodName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    foodDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    foodInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    rating: {
        fontSize: 16,
        color: '#ff9800',
    },
    heartButton: {
        padding: 5,
    },
    heartIcon: {
        fontSize: 24,
    },
});

export default RestaurantItem;