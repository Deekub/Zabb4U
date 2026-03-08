import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';

const DistanceSlider = ({ onValueChange, initialValue, translate }) => {
    const [value, setValue] = useState(initialValue);

    const handleValueChange = (newValue) => {
        setValue(newValue);
        onValueChange(newValue);
    };

    if (Platform.OS === 'web') {
        return (
            <View style={styles.distanceContainerWeb}>
                <input
                    type="range"
                    style={styles.webSlider}
                    min="1"
                    max="50"
                    value={value}
                    onChange={(event) => handleValueChange(parseInt(event.target.value, 10))}
                />
                <Text>{translate('radius')} {value} {translate('km')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.distanceContainer}>
            <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={50}
                value={value}
                onValueChange={handleValueChange}
                step={1}
            />
            <Text>{translate('radius')} {value} {translate('km')}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    distanceContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    distanceContainerWeb: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    slider: {
        width: '80%',
    },
    webSlider: {
        width: '80%',
    },
});

export default DistanceSlider;