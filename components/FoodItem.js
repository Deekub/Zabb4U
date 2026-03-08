import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { PIC_URL } from '../backend/config/config';
import { Ionicons } from '@expo/vector-icons';

const FoodItem = ({ item, onPress, isFavorite, onToggleFavorite }) => {
    return (
        <TouchableOpacity
            style={styles.foodItem}
            onPress={() => onPress(item.id)}
        >
            <Image
                source={{ uri: item.pic ? `${PIC_URL}${item.pic}` : 'https://via.placeholder.com/150' }}
                style={styles.foodImage}
                defaultSource={require('../assets/logo.png')}
            />
            <View style={styles.foodDetails}>
                <Text style={styles.foodName}>{item.res_name}</Text>
                <Text style={styles.foodDescription}>{item.description}</Text>
                <View style={styles.foodInfo}>
                    <View style={styles.rating}>
                        <Text style={styles.ratingText}>{item.score}</Text>
                        <Text style={styles.starIcon}>★</Text>
                    </View>
                    <TouchableOpacity onPress={() => onToggleFavorite(item.id)}>
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
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    foodImage: {
        width: 120,
        height: 120,
    },
    foodDetails: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    foodName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 6,
        overflow: 'hidden',
        maxHeight: 18 * 1.2 * 1,
    },
    foodDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        overflow: 'hidden',
        maxHeight: 14 * 1.5 * 3,
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
    heartIcon: {
        fontSize: 24,
        color: 'black',
    },
});

export default FoodItem;