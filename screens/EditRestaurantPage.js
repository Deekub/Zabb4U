import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert as ReactNativeAlert,
    Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { API_URL, PIC_URL } from '../backend/config/config';
import { Picker } from '@react-native-picker/picker';
import { useLanguage } from '../LanguageContext';
import GalleryImageGrid from '../components/GalleryImageGrid'; 


const EditRestaurantScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { id } = route.params;
    const [form, setForm] = useState({ res_name: '', description: '', region: '', pic: '' });
    const [contact, setContact] = useState({ phone: '', facebook: '', line: '' });
    const [newCoverImage, setNewCoverImage] = useState(null);
    const [newGalleryImages, setNewGalleryImages] = useState([]);
    const [existingGalleryImages, setExistingGalleryImages] = useState([]);
    const { translate } = useLanguage();

    const showAlert = (title, message, buttons) => {
        if (Platform.OS === 'web') {
            if (buttons && buttons.length > 1 && buttons[1].onPress) {
                if (window.confirm(`${title}\n\n${message}`)) {
                    buttons[1].onPress();
                }
            } else {
                window.alert(`${title}\n\n${message}`);
            }
        } else {
            ReactNativeAlert.alert(title, message, buttons);
        }
    };

    useEffect(() => {
        if (!id) return;
        const fetchRestaurant = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/restaurants/${id}`);
                const data = res.data;
                setForm({
                    res_name: data.res_name,
                    description: data.description,
                    region: data.region,
                    pic: data.pic,
                });
                setExistingGalleryImages(data.images || []);
                const contactRes = await axios.get(`${API_URL}/api/contacts/${id}`);
                const contactData = contactRes.data;
                if (contactData) {
                    setContact({
                        phone: contactData.phone || '',
                        facebook: contactData.facebook || '',
                        line: contactData.line || '',
                    });
                }
            } catch (error) {
                console.error('Error fetching restaurant:', error);
                showAlert(translate('error'), translate('failed_to_fetch_restaurant'));
            }
        };
        fetchRestaurant();
    }, [id, translate]);

    const handleInputChange = (name, value) => {
        setForm({ ...form, [name]: value });
    };

    const handleContactChange = (name, value) => {
        setContact({ ...contact, [name]: value });
    };

    const pickCoverImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert(translate('permission_denied'), translate('grant_photo_library_permission'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setNewCoverImage(result.assets[0].uri);
        }
    };

    const pickGalleryImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert(translate('permission_denied'), translate('grant_photo_library_permission'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (result.assets && result.assets.length > 0) {
            setNewGalleryImages(result.assets.map(asset => asset.uri));
        }
    };

    const handleGalleryImageDelete = async (imageUrl) => {
        showAlert(
            translate('confirm_delete'),
            translate('are_you_sure_delete_image'),
            [
                {
                    text: translate('cancel'),
                    style: 'cancel',
                },
                {
                    text: translate('delete'),
                    onPress: async () => {
                        console.log('Deleting image with URL:', imageUrl);
                        try {
                            await axios.post(`${API_URL}/api/images/delete`, { imageUrl });
                            setExistingGalleryImages(existingGalleryImages.filter((img) => img.image_url !== imageUrl));
                            showAlert(translate('success'), translate('image_deleted_successfully'));
                        } catch (err) {
                            console.error('Error deleting image:', err);
                            showAlert(translate('error'), translate('failed_to_delete_image'));
                        }
                    },
                },
            ],
        );
    };

    const handleSubmit = async () => {
        console.log('handleSubmit function called');
        console.log('Form data:', form);
        console.log('Contact data:', contact);
        console.log('New cover image URI:', newCoverImage);
        console.log('New gallery image URIs:', newGalleryImages);

        const formData = new FormData();
        formData.append('res_name', form.res_name);
        formData.append('description', form.description);
        formData.append('region', form.region);
        formData.append('phone', contact.phone || '');
        formData.append('facebook', contact.facebook || '');
        formData.append('line', contact.line || '');

        if (newCoverImage) {
            const uriParts = newCoverImage.split('.');
            const fileType = uriParts[uriParts.length - 1];
            formData.append('coverImage', {
                uri: newCoverImage,
                name: `cover_${Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            });
        }

        const appendGalleryImagePromises = newGalleryImages.map(async (imageUri, index) => {
            const uriParts = imageUri.split(';');
            const base64Part = uriParts[1]?.split(',')[1];
            const fileType = uriParts[0]?.split(':')[1];
            const fileName = `gallery_${index}_${Date.now()}.${fileType?.split('/')[1] || 'jpg'}`;

            if (base64Part) {
                const res = await fetch(imageUri);
                const blob = await res.blob();
                formData.append('galleryImages', blob, fileName);
                console.log('Appended gallery image (blob):', fileName);
            } else {
                const uriPartsDirect = imageUri.split('.');
                const fileTypeDirect = uriPartsDirect[uriPartsDirect.length - 1];
                formData.append('galleryImages', {
                    uri: imageUri,
                    name: `gallery_${index}_${Date.now()}.${fileTypeDirect}`,
                    type: `image/${fileTypeDirect}`,
                });
                console.log('Appended gallery image (uri):', `gallery_${index}_${Date.now()}.${fileTypeDirect}`);
            }
        });

        await Promise.all(appendGalleryImagePromises);

        for (const pair of formData.entries()) {
            console.log(pair[0] + ', ', pair[1]);
        }
        console.log('formData:', formData);

        console.log('Form data before API call:', formData);

        try {
            const response = await axios.post(`${API_URL}/api/restaurants/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('API Response:', response.data);
            showAlert(translate('success'), translate('restaurant_updated_successfully'), [
                { text: translate('ok'), onPress: () => navigation.navigate('EditMenu') },
            ]);
            navigation.navigate('EditMenu');
        } catch (error) {
            console.error('Error updating restaurant:', error);
            showAlert(translate('error'), translate('failed_to_update_restaurant'));
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.heading}>{translate('edit_restaurant')}: {form.res_name}</Text>

            {/* ส่วนแก้ไขรูปภาพปก */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>{translate('cover_image')}</Text>
                {(form.pic || newCoverImage) ? (
                    <Image
                        source={{ uri: newCoverImage || (form.pic ? `${PIC_URL}${form.pic}` : null) }}
                        style={styles.coverImage}
                    />
                ) : (
                    <Text>{translate('no_cover_image')}</Text>
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={pickCoverImage}>
                    <Text style={styles.uploadButtonText}>{translate('change_cover_image')}</Text>
                </TouchableOpacity>
            </View>

            {/* ส่วนแก้ไขข้อมูลอื่นๆ */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>{translate('restaurant_name')}</Text>
                <TextInput
                    style={styles.input}
                    value={form.res_name}
                    onChangeText={(text) => handleInputChange('res_name', text)}
                    placeholder={translate('restaurant_name')}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>{translate('description')}</Text>
                <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    value={form.description}
                    onChangeText={(text) => handleInputChange('description', text)}
                    placeholder={translate('description')}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>{translate('region')}</Text>
                <Picker
                    selectedValue={form.region}
                    style={styles.picker}
                    onValueChange={(itemValue) => handleInputChange('region', itemValue)}
                >
                    <Picker.Item label={translate('select_region')} value="" />
                    <Picker.Item label={translate('north')} value="north" />
                    <Picker.Item label={translate('northeastern')} value="northeastern" />
                    <Picker.Item label={translate('central')} value="central" />
                    <Picker.Item label={translate('south')} value="south" />
                </Picker>
            </View>

            {/* ส่วนแก้ไขข้อมูลการติดต่อ */}
            <Text style={styles.heading}>{translate('contact_information')}</Text>
            <View style={styles.formGroup}>
                <Text style={styles.label}>{translate('phone_number')}</Text>
                <TextInput
                    style={styles.input}
                    value={contact.phone}
                    onChangeText={(text) => handleContactChange('phone', text)}
                    placeholder={translate('phone_number')}
                />
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Facebook</Text>
                <TextInput
                    style={styles.input}
                    value={contact.facebook}
                    onChangeText={(text) => handleContactChange('facebook', text)}
                    placeholder="Facebook"
                />
            </View>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Line</Text>
                <TextInput
                    style={styles.input}
                    value={contact.line}
                    onChangeText={(text) => handleContactChange('line', text)}
                    placeholder="Line"
                />
            </View>

            {/* ส่วนแก้ไขรูปภาพภายในร้าน */}
            <View style={styles.fileUpload}>
                <Text style={styles.label}>{translate('restaurant_gallery')}</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={pickGalleryImages}>
                    <Text style={styles.uploadButtonText}>{translate('add_restaurant_gallery')}</Text>
                </TouchableOpacity>
                <ScrollView horizontal>
                    <View style={styles.newImageHorizontalScroll}>
                        {newGalleryImages.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={styles.newImagePreview} />
                        ))}
                    </View>
                </ScrollView>
            </View>

            <Text style={styles.heading}>{translate('restaurant_gallery')}</Text>
            {console.log('existingGalleryImages:', existingGalleryImages)}
            <GalleryImageGrid
                images={existingGalleryImages}
                onDelete={handleGalleryImageDelete}
            />

            <TouchableOpacity style={styles.buttonContainer} onPress={handleSubmit}>
                <Text style={styles.buttonText}>{translate('save')}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#f0f0f0',
        paddingBottom: 200,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        backgroundColor: 'white',
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        backgroundColor: 'white',
        textAlignVertical: 'top',
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: 'white',
    },
    uploadButton: {
        backgroundColor: 'lightgray',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    uploadButtonText: {
        fontSize: 16,
    },
    buttonContainer: {
        backgroundColor: 'green',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 100,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    fileUpload: {
        marginBottom: 20,
    },
    newImagePreview: {
        width: 100,
        height: 100,
        borderRadius: 5,
        marginRight: 10,
    },
    coverImage: {
        width: '100%',
        height: 200,
        borderRadius: 5,
        marginBottom: 10,
    },
    newImageHorizontalScroll: {
        flexDirection: 'row',
        paddingVertical: 5,
        maxHeight: 120,
    },
});

export default EditRestaurantScreen;