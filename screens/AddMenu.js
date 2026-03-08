import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_URL } from '../backend/config/config';
import { useLanguage } from '../LanguageContext'; // Import useLanguage

const AddMenu = () => {
  const navigation = useNavigation();
  const { translate } = useLanguage(); // ดึงฟังก์ชัน translate
  const [formData, setFormData] = useState({
    res_name: '',
    description: '',
    region: '',
    emb_link: '',
    phone: '', // เพิ่มช่องเบอร์โทรศัพท์
    facebook: '', // เพิ่มช่อง Facebook
    line: '', // เพิ่มช่อง Line
  });
  const [images, setImages] = useState([]);

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(translate('permission_required'), translate('photo_library_permission_message'));
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets;
      const formattedImages = selectedImages.map((img) => {
        let name = img.uri.split('/').pop();
        if (!name.includes('.') || name.split('.').pop().length > 4) {
          const ext = img.type === 'image/jpeg' ? '.jpg' :
                      img.type === 'image/png' ? '.png' :
                      img.type === 'image/gif' ? '.gif' : '.jpg';
          name = name + ext;
        }
        return { uri: img.uri, name: name, type: Platform.OS === 'web' ? 'image/jpeg' : img.type || 'image/jpeg' };
      });
      setImages(formattedImages);
    }
  };

  const handleSubmit = async () => {
    if (!formData.res_name || !formData.region || !formData.emb_link) {
      Alert.alert(translate('please_fill_all_fields'));
      return;
    }

    if (images.length === 0) {
      Alert.alert(translate('please_select_image'));
      return;
    }

    const form = new FormData();
    form.append('res_name', formData.res_name);
    form.append('description', formData.description || '');
    form.append('region', formData.region);
    form.append('emb_link', formData.emb_link);
    form.append('phone', formData.phone || '');
    form.append('facebook', formData.facebook || '');
    form.append('line', formData.line || '');

    if (Platform.OS === 'web') {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (!img.uri) {
          Alert.alert(translate('invalid_file'), translate('unable_to_upload'));
          return;
        }
        try {
          const response = await fetch(img.uri);
          const blob = await response.blob();
          const filename = img.name || `image-${Date.now()}.jpg`;
          form.append('images', blob, filename);
        } catch (error) {
          console.error('Error converting image to blob:', error);
          Alert.alert(translate('error_occurred'), translate('unable_to_prepare_file'));
          return;
        }
      }
    } else {
      images.forEach((img) => {
        form.append('images', {
          uri: img.uri,
          name: img.name || `image-${Date.now()}.jpg`,
          type: img.type || 'image/jpeg',
        });
      });
    }

    try {
      console.log('Sending request to server...');
      const response = await axios.post(`${API_URL}/api/addmenu`, form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000,
      });

      console.log('Server response:', response.data);
      Alert.alert(translate('success'), translate('upload_successful'));
      navigation.navigate('ManagementMenu');
    } catch (error) {
      console.error('Upload error:', error);
      let errorMsg = translate('unable_to_upload_restaurant');
      if (error.response) {
        console.log('Error response data:', error.response.data);
        errorMsg = error.response.data.error || errorMsg;
      } else if (error.request) {
        errorMsg = translate('unable_to_connect_server');
      }
      Alert.alert(translate('error_occurred'), errorMsg);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{translate('add_restaurant')}</Text>

      <TextInput
        style={styles.input}
        placeholder={translate('restaurant_name')}
        value={formData.res_name}
        onChangeText={(text) => setFormData({ ...formData, res_name: text })}
      />
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder={translate('description')}
        multiline
        numberOfLines={4}
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
      />

      <Text style={styles.label}>{translate('region')}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.region}
          onValueChange={(itemValue) =>
            setFormData({ ...formData, region: itemValue })
          }>
          <Picker.Item label={translate('select_region')} value="" />
          <Picker.Item label={translate('north')} value="north" />
          <Picker.Item label={translate('northeastern')} value="northeastern" />
          <Picker.Item label={translate('central')} value="central" />
          <Picker.Item label={translate('south')} value="south" />
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Google Embed Link"
        value={formData.emb_link}
        onChangeText={(text) => setFormData({ ...formData, emb_link: text })}
      />

      <Text style={styles.label}>{translate('contact_details')}:</Text>
      <TextInput
        style={styles.input}
        placeholder={translate('phone_number')}
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Facebook"
        value={formData.facebook}
        onChangeText={(text) => setFormData({ ...formData, facebook: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Line"
        value={formData.line}
        onChangeText={(text) => setFormData({ ...formData, line: text })}
      />

      <TouchableOpacity onPress={handlePickImage} style={styles.uploadButton}>
        <Text style={styles.uploadText}>{translate('select_images')}</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <View>
          <Text>selected  {images.length}  images</Text>
          <ScrollView horizontal style={styles.imagePreviewContainer}>
            {images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img.uri }}
                style={styles.previewImage}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button title={translate('add_restaurant')} onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadText: {
    color: '#333',
  },
  imagePreviewContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  previewImage: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default AddMenu;