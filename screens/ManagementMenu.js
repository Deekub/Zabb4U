import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../LanguageContext'; // Import useLanguage

const ManagementMenu = () => {
    const navigation = useNavigation();
    const { translate } = useLanguage(); // ดึงฟังก์ชัน translate

    return (
        <View style={styles.container}>

            <TouchableOpacity
                onPress={() => navigation.navigate('AddMenu')}
                style={styles.menuItem}
            >
                <Text style={styles.menuText}>{translate('add_restaurant')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('EditMenu')}
                style={styles.menuItem}
            >
                <Text style={styles.menuText}>{translate('edit_restaurant')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('DeleteMenu')}
                style={styles.menuItem}
            >
                <Text style={styles.menuText}>{translate('delete_restaurant')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate('ReportMenu')}
                style={styles.menuItem}
            >
                <Text style={styles.menuText}>{translate('report_restaurant')}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#f4f4f4', // เพิ่มสีพื้นหลังให้มองเห็นง่าย
    },
    backbutton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    backText: {
        fontSize: 18,
        color: '#007BFF',
    },
    menuItem: {
        width: '80%',
        height: 70,
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderRadius: 40,
        backgroundColor: 'black', // ใช้พื้นหลังสีแทนการใช้ background image
    },
    menuText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default ManagementMenu;