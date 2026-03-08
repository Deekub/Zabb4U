import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { PIC_URL } from '../backend/config/config';
import { useLanguage } from '../LanguageContext';

const RestaurantGrid = ({ restaurants, onDelete }) => {
    const { translate } = useLanguage();

    return (
        <View style={styles.gridContainer}>
            {restaurants.map((res) => (
                <View key={res.id} style={styles.restaurantCard}>
                    <Image
                        source={{ uri: res.pic ? `${PIC_URL}${res.pic}` : 'https://via.placeholder.com/150' }}
                        style={styles.restaurantImage}
                    />
                    <Text style={styles.restaurantName}>{res.res_name}</Text>
                    <Text style={styles.restaurantDescription}>{res.description}</Text>
                    <Text style={styles.restaurantRegion}>{translate('region')}: {translate(res.region)}</Text>

                    <TouchableOpacity
                        onPress={() => onDelete(res.id)}
                        style={styles.deleteButton}
                    >
                        <Text style={styles.deleteButtonText}>X</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    restaurantCard: {
        width: '45%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    restaurantImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 10,
        objectFit: 'cover',
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    restaurantDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    restaurantRegion: {
        fontSize: 13,
        color: '#999',
    },
    deleteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'red',
        color: 'white',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default RestaurantGrid;