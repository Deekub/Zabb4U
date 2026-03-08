import React, { useEffect, useState, useContext } from 'react';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Linking,
    Platform,
    Modal,
    Pressable,
    TextInput,
    Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL, PIC_URL } from '../backend/config/config'; // ปรับ path config
import { WebView } from 'react-native-webview';
import { useLanguage } from '../LanguageContext'; // Import useLanguage
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome
import AsyncStorage from '@react-native-async-storage/async-storage';

const RestaurantDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { id } = route.params;
    const [restaurant, setRestaurant] = useState(null);
    const { translate } = useLanguage(); // ดึงฟังก์ชัน translate
    const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviews, setReviews] = useState([]);
    const [userReview, setUserReview] = useState(null); // เก็บรีวิวของผู้ใช้ปัจจุบัน
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const toggleReviewModal = () => {
        setIsReviewModalVisible(!isReviewModalVisible);
        if (!isReviewModalVisible && userReview) {
            setRating(userReview.rating);
            setComment(userReview.comment);
        } else {
            setRating(0);
            setComment('');
        }
    };

    const handleStarPress = (selectedRating) => {
        setRating(selectedRating);
    };

     const fetchRestaurant = async () => {
        try {
            const res = await fetch(`${API_URL}/api/restaurant/${id}`);
            const data = await res.json();
            console.log("Restaurant Detail Data (re-fetched):", data);
            setRestaurant(data);
        } catch (err) {
            console.error("Error fetching restaurant details:", err);
        }
    };

    const handleSendReview = async () => {
        if (rating === 0) {
            Alert.alert(translate('error'), translate('please_select_rating'));
            return;
        }
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                navigation.navigate('Login');
                return;
            }
            const method = userReview ? 'POST' : 'POST'; // ใช้ POST ทั้งคู่ Backend จะจัดการเอง
            const response = await fetch(`${API_URL}/api/restaurants/${id}/reviews`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ rating: rating, comment: comment }),
            });
            const data = await response.json();
            if (response.ok) {
                Alert.alert(translate('success'), data.message);
                toggleReviewModal();
                fetchReviews();
                fetchRestaurant();
                fetchUserReview();
            } else {
                Alert.alert(translate('error'), data.message || translate('failed_to_send_review'));
            }
        } catch (error) {
            console.error('Error sending/editing review:', error);
            Alert.alert(translate('error'), translate('failed_to_send_review'));
        }
    };

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API_URL}/api/restaurants/${id}/reviews`);
            const data = await res.json();
            setReviews(data);
            console.log("Restaurant Reviews:", data);
        } catch (err) {
            console.error("Error fetching reviews:", err);
        }
    };

    const fetchUserReview = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token && id) {
                const response = await fetch(`${API_URL}/api/restaurants/${id}/reviews/mine`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const text = await response.text(); // อ่าน Response เป็น text ก่อน
                    if (text) {
                        try {
                            const data = JSON.parse(text); // พยายาม Parse เป็น JSON
                            setUserReview(data);
                        } catch (e) {
                            console.error('Error parsing user review JSON:', e, text);
                            // อาจจะ set UserReview เป็น null หรือค่า default อื่นๆ ที่นี่
                            setUserReview(null);
                        }
                    } else {
                        setUserReview(null); // Response Body ว่าง
                    }
                } else if (response.status === 204) {
                    setUserReview(null); // ผู้ใช้ยังไม่เคยรีวิว
                } else {
                    console.error('Failed to fetch user review');
                    setUserReview(null); // ในกรณี Error อื่นๆ ก็อาจจะ set เป็น null
                }
            }
        } catch (error) {
            console.error('Error fetching user review:', error);
            setUserReview(null);
        }
    };

    const handleDeleteReview = async () => {
        setShowDeleteConfirmation(false);
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token || !userReview?.review_id) {
                Alert.alert(translate('error'), translate('not_logged_in_or_no_review'));
                return;
            }
            const response = await fetch(`${API_URL}/api/reviews/${userReview.review_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                Alert.alert(translate('success'), translate('review_deleted_successfully'));
                setUserReview(null);
                fetchReviews();
                fetchRestaurant();
            } else {
                const errorData = await response.json();
                Alert.alert(translate('error'), errorData?.message || translate('failed_to_delete_review'));
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            Alert.alert(translate('error'), translate('failed_to_delete_review'));
        }
    };

    const RestaurantMap = ({ googleMapLink, lat, lng }) => {
        if (!googleMapLink) {
            return null;
        }

        if (Platform.OS === 'web') {
            return (
                <iframe
                    src={`${googleMapLink}&z=16`}
                    width="100%"
                    height="300"
                    style={{ borderRadius: '16px', border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            );
        } else {
            const iframeHTML = `<iframe src="${googleMapLink}&z=16" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

            return (
                <View style={styles.webViewContainer}>
                    <WebView
                        style={styles.webView}
                        originWhitelist={['*']}
                        source={{ html: iframeHTML }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                    />
                </View>
            );
        }
    };


    useEffect(() => {
        if (id) {
            const fetchRestaurantData = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/restaurant/${id}`);
                    const data = await res.json();
                    console.log("Restaurant Detail Data:", data);
                    setRestaurant(data);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchRestaurantData();
            fetchReviews();
            fetchUserReview();
        }
    }, [id]);

    useEffect(() => {
        if (isReviewModalVisible && userReview) {
            setRating(userReview.rating);
            setComment(userReview.comment);
        } else if (isReviewModalVisible) {
            setRating(0);
            setComment('');
        }
    }, [isReviewModalVisible, userReview]);

    const reviewButtonText = userReview ? translate('edit_review') : translate('review_this_restaurant');
    const modalTitleText = userReview ? translate('edit_your_review') : translate('rate_this_restaurant');
    const sendButtonText = userReview ? translate('save_changes') : translate('send_review');
    const canDeleteReview = !!userReview;

    return (
        <ScrollView style={styles.container}>
            {restaurant ? (
                <>
                    <Text style={styles.title}>{restaurant.res_name}</Text>
                    <Image
                        source={{ uri: restaurant.pic ? `${PIC_URL}${restaurant.pic}` : 'https://via.placeholder.com/300' }}
                        style={styles.image}
                    />
                    <Text style={styles.description}>{restaurant.description}</Text>
                    <Text style={styles.score}>{translate('score')}: {restaurant.score ? parseFloat(restaurant.score).toFixed(1) : 0} ★</Text>

                    {reviews.length > 0 && (
                        <View style={styles.reviewsContainer}>
                            <Text style={styles.reviewsTitle}>{translate('reviews')}</Text>
                            {reviews.map((review) => (
                                <View key={review.review_id} style={styles.reviewItem}>
                                    <View style={styles.ratingRow}>
                                        {[...Array(5)].map((_, index) => (
                                            <FontAwesome
                                                key={index}
                                                name={index < review.rating ? 'star' : 'star-o'}
                                                size={16}
                                                color={index < review.rating ? '#ffc107' : '#ccc'}
                                            />
                                        ))}
                                    </View>
                                    {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                                    <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={styles.reviewButton} onPress={toggleReviewModal}>
                        <Text style={styles.reviewButtonText}>{reviewButtonText}</Text>
                    </TouchableOpacity>

                    {canDeleteReview && (
                        <TouchableOpacity style={styles.deleteReviewButton} onPress={() => setShowDeleteConfirmation(true)}>
                            <Text style={styles.deleteReviewButtonText}>{translate('delete_review')}</Text>
                        </TouchableOpacity>
                    )}

                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={isReviewModalVisible}
                        onRequestClose={toggleReviewModal}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>{modalTitleText}</Text>
                                <View style={styles.ratingStars}>
                                    {[...Array(5)].map((_, index) => (
                                        <TouchableOpacity key={index} onPress={() => handleStarPress(index + 1)}>
                                            <FontAwesome
                                                name={index < rating ? 'star' : 'star-o'}
                                                size={30}
                                                color={index < rating ? '#ffc107' : '#ccc'}
                                                style={styles.star}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder={translate('add_your_comment')}
                                    multiline
                                    value={comment}
                                    onChangeText={setComment}
                                />
                                <TouchableOpacity style={styles.sendReviewButton} onPress={handleSendReview}>
                                    <Text style={styles.sendReviewButtonText}>{sendButtonText}</Text>
                                </TouchableOpacity>
                                <Pressable style={[styles.button, styles.buttonClose]} onPress={toggleReviewModal}>
                                    <Text style={styles.textStyle}>{translate('cancel')}</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Modal>

                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={showDeleteConfirmation}
                        onRequestClose={() => setShowDeleteConfirmation(false)}
                    >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <Text style={styles.modalText}>{translate('confirm_delete_review')}</Text>
                                <View style={styles.modalButtons}>
                                    <Pressable
                                        style={[styles.button, styles.buttonConfirm]}
                                        onPress={handleDeleteReview}
                                    >
                                        <Text style={styles.textStyle}>{translate('delete')}</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.button, styles.buttonCancel]}
                                        onPress={() => setShowDeleteConfirmation(false)}
                                    >
                                        <Text style={styles.textStyle}>{translate('cancel')}</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {restaurant.google_map_link && (
                        <View>
                            <RestaurantMap
                                googleMapLink={restaurant.google_map_link}
                                lat={restaurant.lat}
                                lng={restaurant.lng}
                            />
                            <TouchableOpacity
                                style={styles.openMapButton}
                                onPress={() => {
                                    console.log("lat long :", restaurant);
                                    const googleMapsUrl = Platform.select({
                                        ios: `maps://app?daddr=${restaurant.lat},${restaurant.lng}`,
                                        android: `geo:${restaurant.lat},${restaurant.lng}?q=${restaurant.res_name}`
                                    });
                                    openMap(googleMapsUrl);
                                }}
                            >
                                <Text style={styles.openMapButtonText}>{translate('open_in_google_maps')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.loadingContainer}>
                    <Text>{translate('loading')}</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        marginBottom: 12,
    },
    score: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#ff9800',
    },
    contactTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 8,
    },
    contactText: {
        fontSize: 16,
        marginBottom: 4,
    },
    webViewContainer: {
        width: '100%',
        height: 250,
        marginTop: 20,
        marginBottom: 10,
        borderRadius: 16,
        overflow: 'hidden',
    },
    webView: {
        flex: 1,
    },
    openMapButton: {
        backgroundColor: '#4285F4',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 30,
    },
    openMapButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    galleryContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    galleryTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    galleryScrollView: {
        flexDirection: 'row',
    },
    galleryImage: {
        width: 150,
        height: 150,
        borderRadius: 8,
        marginRight: 10,
    },
    reviewButton: {
        backgroundColor: '#007bff',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    reviewButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    ratingStars: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    star: {
        marginHorizontal: 5,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    sendReviewButton: {
        backgroundColor: '#28a745',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    sendReviewButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    button: {
        borderRadius: 8,
        padding: 10,
        elevation: 2,
    },
    buttonClose: {
        backgroundColor: '#d3d3d3',
    },
    textStyle: {
        color: 'black',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    reviewsContainer: {
        marginTop: 20,
        paddingTop: 15,
        borderColor: '#eee',
        borderTopWidth: 1,
    },
    reviewsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    reviewItem: {
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 10,
        borderColor: '#eee',
        borderWidth: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    reviewComment: {
        fontSize: 16,
        marginBottom: 5,
    },
    reviewDate: {
        fontSize: 12,
        color: '#888',
    },
    deleteReviewButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    deleteReviewButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 18,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 10,
    },
    buttonConfirm: {
        backgroundColor: '#dc3545',
    },
    buttonCancel: {
        backgroundColor: '#6c757d',
        marginRight:100,
    },
    button: {
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 15,
        elevation: 2,
        marginHorizontal: 5,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default RestaurantDetailScreen;