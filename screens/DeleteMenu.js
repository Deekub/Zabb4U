import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    Platform,
    Picker,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../backend/config/config';
import { useLanguage } from '../LanguageContext';
import RestaurantGrid from '../components/RestaurantGrid'; // Import RestaurantGrid

const DeleteRestaurantScreen = () => {
    const navigation = useNavigation();
    const [restaurants, setRestaurants] = useState([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const { translate } = useLanguage();

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/get-restaurants`);
                setRestaurants(response.data);
                setFilteredRestaurants(response.data);
            } catch (error) {
                console.error('Error fetching restaurants:', error);
                Alert.alert(translate('error'), translate('failed_to_load_restaurants'));
            }
        };

        fetchRestaurants();
    }, []);

    useEffect(() => {
        const filtered = restaurants.filter((res) => {
            const matchName = res.res_name.toLowerCase().includes(searchText.toLowerCase());
            const matchRegion = selectedRegion ? res.region === selectedRegion : true;
            return matchName && matchRegion;
        });
        setFilteredRestaurants(filtered);
    }, [searchText, selectedRegion, restaurants]);

    const deleteRestaurant = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/restaurants/${id}`);
            setRestaurants((prevRestaurants) => prevRestaurants.filter((res) => res.id !== id));
            Alert.alert(translate('success'), translate('restaurant_deleted_successfully'));
        } catch (error) {
            console.error('Error deleting restaurant:', error);
            Alert.alert(translate('error'), translate('failed_to_delete_restaurant'));
        }
    };

    const handleDeleteClick = (id) => {
        const confirmationTitle = translate('confirm_delete');
        const confirmationMessage = translate('are_you_sure_delete_restaurant');
        const buttons = [
            { text: translate('cancel'), style: 'cancel' },
            {
                text: translate('delete'),
                style: 'destructive',
                onPress: () => deleteRestaurant(id),
            },
        ];

        if (Platform.OS === 'web') {
            if (window.confirm(confirmationMessage)) {
                deleteRestaurant(id);
            }
        } else {
            Alert.alert(confirmationTitle, confirmationMessage, buttons, { cancelable: false });
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.heading}>{translate('manage_restaurants')}</Text>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    type="text"
                    placeholder={translate('search_restaurant_name')}
                    value={searchText}
                    onChangeText={(text) => setSearchText(text)}
                />

                <Picker
                    selectedValue={selectedRegion}
                    style={styles.regionPicker}
                    onValueChange={(itemValue) => setSelectedRegion(itemValue)}
                >
                    <Picker.Item label={translate('all_regions')} value="" />
                    <Picker.Item label={translate('north')} value="north" />
                    <Picker.Item label={translate('northeastern')} value="northeastern" />
                    <Picker.Item label={translate('central')} value="central" />
                    <Picker.Item label={translate('south')} value="south" />
                </Picker>
            </View>

            <RestaurantGrid restaurants={filteredRestaurants} onDelete={handleDeleteClick} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginRight: 10,
    },
    regionPicker: {
        width: 150,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
    },
});

export default DeleteRestaurantScreen;