import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL, PIC_URL } from '../backend/config/config';
import { Picker } from '@react-native-picker/picker'; // Import Picker ตัวใหม่
import { useLanguage } from '../LanguageContext'; // Import useLanguage

const EditMenu = () => {
    const navigation = useNavigation();
    const [restaurants, setRestaurants] = useState([]);
    const [filteredRestaurants, setFilteredRestaurants] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [loading, setLoading] = useState(true);
    const { translate } = useLanguage(); // ดึงฟังก์ชัน translate

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await fetch(`${API_URL}/api/get-restaurants`);
                const data = await res.json();
                setRestaurants(data);
                setFilteredRestaurants(data);
            } catch (error) {
                console.error('Error fetching restaurants:', error);
            } finally {
                setLoading(false);
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

    const handleEditClick = (id) => {
        console.log("ID : ",{id});
        navigation.navigate('EditRestaurantPage', { id }); // ให้แน่ใจว่าหน้านี้มีใน navigator
    };

    if (loading) {
        return <ActivityIndicator size="large" style={{ marginTop: 50 }} color="#FF6B00" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{translate('manage_restaurants')}</Text>

            <View style={styles.searchSection}>
                <TextInput
                    placeholder={translate('search_restaurant_name')}
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                />
                <Picker
                    selectedValue={selectedRegion}
                    style={styles.picker}
                    onValueChange={(value) => setSelectedRegion(value)}
                >
                    <Picker.Item label={translate('all_regions')} value="" />
                    <Picker.Item label={translate('north')} value="north" />
                    <Picker.Item label={translate('northeastern')} value="northeastern" />
                    <Picker.Item label={translate('central')} value="central" />
                    <Picker.Item label={translate('south')} value="south" />
                </Picker>
            </View>

            <FlatList
                data={filteredRestaurants}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handleEditClick(item.id)}
                        style={styles.card}
                    >
                        <Image
                            source={{ uri: item.pic ? `${PIC_URL}${item.pic}` : 'https://via.placeholder.com/300x180' }}
                            style={styles.image}
                        />
                        <Text style={styles.name}>{item.res_name}</Text>
                        <Text style={styles.description}>{item.description}</Text>
                        <Text style={styles.region}>{translate('region')}: {translate(item.region)}</Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#121212',
        flex: 1,
    },
    title: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    searchSection: {
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: 'white',
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
    },
    picker: {
        backgroundColor: 'white',
        borderRadius: 8,
    },
    card: {
        backgroundColor: '#1E1E1E',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    image: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        marginBottom: 10,
    },
    name: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    description: {
        color: '#CCC',
        marginTop: 4,
    },
    region: {
        color: '#888',
        fontSize: 12,
        marginTop: 4,
    },
});

export default EditMenu;