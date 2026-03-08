import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { PIC_URL } from '../backend/config/config';
import { useLanguage } from '../LanguageContext';

const GalleryImageGrid = ({ images, onDelete }) => {
    const { translate } = useLanguage();

    return (
        <View style={styles.imageGrid}>
            {images.map((img, idx) => (
                <View key={idx} style={styles.imageWrapper}>
                    <Image source={{ uri: PIC_URL + img.image_url }} style={styles.image} />
                    <TouchableOpacity onPress={() => onDelete(img.image_url)} style={styles.deleteButton}>
                        <Text style={styles.deleteButtonText}>X</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    imageWrapper: {
        width: '30%',
        marginRight: '5%',
        marginBottom: 10,
        position: 'relative',
        overflow: 'hidden', // เพิ่ม overflow เพื่อซ่อนส่วนที่ล้น
        borderRadius: 5,     // เพิ่ม borderRadius ให้เข้ากับรูปภาพ
    },
    image: {
        width: '100%',
        height: 150,
    },
    deleteButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: 'red',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default GalleryImageGrid;