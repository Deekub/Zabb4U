import React, { useState, useEffect } from 'react';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    Modal,
    FlatList,
    RefreshControl,
    Platform,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL, PIC_URL } from '../backend/config/config'; // ปรับ path config
import { jwtDecode } from 'jwt-decode';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios'; // <--- Import axios
import { Buffer } from 'buffer';
import { useLanguage } from '../LanguageContext'; // Import useLanguage

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    return new Date(dateString).toLocaleString('en-GB', options);
};

const CommunityScreen = ({ navigation }) => {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [commentMap, setCommentMap] = useState({});
    const [activePost, setActivePost] = useState(null);
    const [editPostModalVisible, setEditPostModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [menuPostId, setMenuPostId] = useState(null);
    const [username, setUsername] = useState('');
    const [token, setToken] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedImage, setSelectedImage] = useState([]);
    const { translate } = useLanguage(); // ดึงฟังก์ชัน translate

    // State สำหรับ Modal สร้างโพสต์ใหม่
    const [isCreatePostModalVisible, setIsCreatePostModalVisible] = useState(false);
    const [postContentModal, setPostContentModal] = useState('');
    const [postTitleModal, setPostTitleModal] = useState('');

    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportingPostId, setReportingPostId] = useState(null);
    const [reportReason, setReportReason] = useState(''); // State สำหรับเหตุผลการรายงาน (ถ้าต้องการ)

    const handleReportClick = (postId) => {
        setReportingPostId(postId);
        setReportModalVisible(true);
        setMenuPostId(null); // ปิด dropdown menu
    };

    const handleSendReport = async () => {
        if (!reportingPostId) {
            return;
        }

        const currentToken = token;
        if (!currentToken) {
            console.error('No token available in state');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // ถ้า Backend ต้องการ Authorization
                },
                body: JSON.stringify({
                    postId: reportingPostId,
                    reportReason: reportReason, // ส่งเหตุผล (ถ้ามี)
                    reportDetails: '', // คุณอาจให้ผู้ใช้ใส่รายละเอียดตรงนี้
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Report sent successfully:', data);
                setReportModalVisible(false);
                setReportingPostId(null);
                setReportReason(''); // ล้างเหตุผล
                // อาจจะแสดง feedback ให้ผู้ใช้ว่ารายงานสำเร็จ
            } else {
                const errorData = await response.json();
                console.error('Failed to send report:', errorData);
                // แสดง error message ให้ผู้ใช้
            }
        } catch (error) {
            console.error('Error sending report:', error);
            // แสดง error message ให้ผู้ใช้
        }
    };

    // Function เปิด Modal สร้างโพสต์ใหม่
    const openCreatePostModal = () => {
        console.log('openCreatePostModal called');
        setIsCreatePostModalVisible(true);
        setPostContentModal(''); // ล้างข้อความเมื่อเปิด Modal
        console.log("C P MD :", isCreatePostModalVisible)
    };

    // Function ปิด Modal สร้างโพสต์ใหม่
    const closeCreatePostModal = () => {
        setIsCreatePostModalVisible(false);
    };

    useEffect(() => {
        const loadData = async () => {
            const storedToken = await AsyncStorage.getItem('userToken');
            const storedUsername = await AsyncStorage.getItem('username');
            if (storedToken && storedUsername) {
                setToken(storedToken);
                setUsername(storedUsername);
                console.log('Token in CommunityScreen:', storedToken); // เพิ่ม Log ตรงนี้
                fetchPosts(storedToken);
            } else {
                console.log('Token or username not found');
                // อาจจะนำทางไปยังหน้า Login ที่นี่
            }
        };
        loadData();
    }, []);

    const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert(translate('permission_denied'), translate('photo_library_permission_message'));
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true, // <--- ตรงนี้ทำให้เลือกได้หลายรูป
    });

    console.log("Result from image picker:", result); // ดูผลลัพธ์ทั้งหมด

    if (!result.canceled && result.assets) {
        const selectedAssets = result.assets.map(asset => ({ uri: asset.uri, type: `image/${asset.uri.split('.').pop()}` }));
        console.log("Selected assets:", selectedAssets); // ดู assets ที่ถูกเลือก

        setSelectedImage(selectedAssets);
        console.log("Updated selectedImage:", selectedImage); // ดู state หลัง update
    }
};

    const onRefresh = async () => {
        setRefreshing(true);
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
            await fetchPosts(storedToken);
        }
        setRefreshing(false);
    };

    const fetchPosts = async (authToken) => {
        try {
            const res = await fetch(`${API_URL}/api/posts`, { // เปลี่ยนตรงนี้
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                console.log("data : ", data)
                setPosts(data); // API ใหม่ส่ง Array ของโพสต์โดยตรง
            } else {
                console.log('Failed to fetch posts');
                const errorData = await res.json();
                console.log('Error details:', errorData); // เพิ่มการ Log error ที่ละเอียดขึ้น
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleEditClick = (post) => {
    console.log("Edit CLick");
    setEditingPost(post);
    setEditContent(post.content);
    setEditTitle(post.postTitle || ''); // ตั้งค่า editTitle ด้วย title เดิม หรือ '' ถ้าไม่มี
    setEditPostModalVisible(prev => {
        console.log("Previous editPostModalVisible:", prev);
        return true;
    });
};

    const handleEditPostSubmit = async () => {
        if (!editingPost || !editContent) return;
        const postId = editingPost.id;
        try {
            const res = await fetch(`${API_URL}/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ content: editContent, postTitle: editTitle }),
            });
            if (res.ok) {
                const updatedPost = await res.json();
                setPosts((prevPosts) =>
                    prevPosts.map((post) =>
                        post.id === postId ? { ...post, content: updatedPost.content, postTitle: updatedPost.postTitle } : post
                    )
                );
                setEditPostModalVisible(false);
                setEditingPost(null);
                setEditContent('');
            } else {
                const errorData = await res.json();
                console.log('Failed to edit post:', errorData.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error editing post:', error);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            const res = await fetch(`${API_URL}/api/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
            } else {
                const errorData = await res.json();
                console.log('Failed to delete post:', errorData.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleLike = async (postId) => {
        try {
            const res = await fetch(`${API_URL}/api/likes/${postId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setPosts(prevPosts =>
                    prevPosts.map(post =>
                        post.id === postId ? { ...post, isLiked: data.liked, likeCount: data.likeCount } : post
                    )
                );
            } else {
                const errorData = await res.json();
                console.log('Failed to like/unlike post:', errorData.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error liking/unliking post:', error);
        }
    };

    const handleCommentSubmit = async (postId) => {
        const content = commentMap[postId];
        if (!content) return;
        try {
            const res = await fetch(`${API_URL}/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ token: token, postId, content }), // เพิ่ม token เข้าไปใน body ตรงนี้
            });
            if (res.ok) {
                const newComment = await res.json();
                setPosts(prevPosts =>
                    prevPosts.map(post => ({
                        ...post,
                        comments: post.comments ? [...post.comments, newComment.comment] : [newComment.comment],
                    }))
                );
                setCommentMap({ ...commentMap, [postId]: '' });
                const storedToken = await AsyncStorage.getItem('userToken');
                fetchPosts(storedToken);
                setActivePost(postId); // Keep the comment modal open
            } else {
                const errorData = await res.json();
                console.log('Failed to add comment:', errorData.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setPosts(prevPosts =>
                    prevPosts.map(post => ({
                        ...post,
                        comments: post.comments ? post.comments.filter(comment => comment.id !== commentId) : [],
                    }))
                );
                if (activePost) {
                    // ถ้า Modal ความคิดเห็นเปิดอยู่ อาจจะต้อง Refetch post เพื่อให้เห็นการเปลี่ยนแปลงทันที
                    const storedToken = await AsyncStorage.getItem('userToken');
                    if (storedToken) {
                        fetchPosts(storedToken);
                        setActivePost(null); // ปิด Modal หลังลบ (หรือจะคงไว้ก็ได้)
                    }
                }
            } else {
                const errorData = await res.json();
                console.log('Failed to delete comment:', errorData.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const getUserIdFromToken = () => {
        try {
            const decoded = jwtDecode(token);
            return decoded.userId;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    const confirmDeleteComment = (commentId) => {
        const alertTitle = translate('confirm_delete');
        const alertMessage = translate('are_you_sure_delete_comment');
        const buttons = [
            {
                text: translate('cancel'),
                style: 'cancel',
            },
            {
                text: translate('delete'),
                style: 'destructive',
                onPress: () => handleDeleteComment(commentId),
            },
        ];

        if (Platform.OS === 'web') {
            // แสดง Alert แบบ Web (เช่น ใช้ `window.confirm`)
            if (window.confirm(alertMessage)) {
                handleDeleteComment(commentId);
            }
        } else {
            // แสดง Native Alert บน App
            Alert.alert(alertTitle, alertMessage, buttons, { cancelable: false });
        }
    };

    const renderCommentItem = ({ item: comment }) => {
        const userIdFromToken = getUserIdFromToken();
        return ( // เพิ่ม return ตรงนี้
            <View style={styles.commentContainer}>
                <View style={styles.commentLeft}>
                    <Text style={styles.commentUsername}>{comment.username}:</Text>
                    <Text style={[styles.commentContent, { textAlign: 'left' }]}>{comment.content}</Text>
                </View>
                {comment.user_id === userIdFromToken && (
                    <TouchableOpacity onPress={() => confirmDeleteComment(comment.id)}>
                        <Ionicons name="trash-outline" size={18} color="red" style={styles.deleteCommentButton} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };
    const handleCreateNewPostWithImage = async () => {
        console.log('handleCreateNewPostWithImage called');
        console.log('postContentModal:', postContentModal);
        console.log('postTitleModal:', postTitleModal); // Log postTitleModal
        console.log('selectedImage:', selectedImage);
    
        if (!postContentModal && !postTitleModal && (!selectedImage || selectedImage.length === 0)) {
            Alert.alert(translate('notification'), translate('please_provide_text_title_or_image'));
            return;
        }
    
        const formData = new FormData();
        formData.append('content', postContentModal);
        formData.append('title', postTitleModal); // เพิ่ม title ใน formData
        console.log('Appended content:', postContentModal);
        console.log('Appended title:', postTitleModal); // Log การ append title
    
        if (selectedImage && selectedImage.length > 0) {
            for (let i = 0; i < selectedImage.length; i++) {
                const imageInfo = selectedImage[i];
                const imageUri = imageInfo.uri;
    
                if (Platform.OS === 'web' && imageUri.startsWith('data:')) {
                    try {
                        const response = await fetch(imageUri);
                        const blob = await response.blob();
                        formData.append('image', blob);
                        console.log('Appended web image (blob) without filename');
                    } catch (error) {
                        console.error('Error converting web image to blob:', error);
                        Alert.alert(translate('error_occurred'), translate('unable_to_prepare_image_file'));
                        return;
                    }
                } else {
                    const uriParts = imageUri.split('.');
                    const fileType = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
                    const imageName = `post_image_${Date.now()}_${i + 1}.${fileType}`;
                    formData.append('image', {
                        uri: imageUri,
                        name: imageName,
                        type: `image/${fileType}`,
                    });
                    console.log('Appended native image (uri):', imageName, 'Type:', `image/${fileType}`);
                }
            }
        }
    
        // Log formData entries
        for (const pair of formData.entries()) {
            console.log(pair[0] + ', ', pair[1]);
        }
        console.log('formData:', formData);
    
        try {
            const res = await axios.post(`${API_URL}/api/posts`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
    
            if (res.status === 201) {
                const data = res.data;
                setPosts([data, ...posts]);
                closeCreatePostModal();
                setSelectedImage(null);
                setPostContentModal('');
                setPostTitleModal(''); // ล้าง title ด้วย
            } else {
                console.log('Failed to create post with image:', res.data.message || 'Unknown error');
                Alert.alert(translate('error_occurred'), translate('unable_to_create_post'));
            }
        } catch (error) {
            console.error('Error creating post with image:', error);
            Alert.alert(translate('error_occurred'), translate('error_creating_post'));
        }
    };

    const renderCreatePostModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isCreatePostModalVisible}
            onRequestClose={closeCreatePostModal}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.createPostModal, { height: 'auto' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={styles.modalTitle}>{translate('create_new_post')}</Text>
                    </View>
                    <TextInput
                        style={[styles.modalInput, { minHeight: 50, borderColor: "grey", padding: 10, borderWidth: 1, marginBottom: 10 }]}
                        placeholder={translate('post_title')}
                        value={postTitleModal}
                        onChangeText={setPostTitleModal}
                    />
                    <TextInput
                        style={[styles.modalInput, { minHeight: 100, borderColor: "grey", padding: 10, borderWidth: 1 }]}
                        multiline
                        placeholder={translate('what_are_you_thinking')}
                        value={postContentModal}
                        onChangeText={setPostContentModal}
                        textAlignVertical="top"
                    />
                    {selectedImage && selectedImage.length > 0 && (
                        <ScrollView horizontal style={{ marginVertical: 15 }}>
                            {selectedImage.map((image, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: image.uri }}
                                    style={{ width: 100, height: 100, borderRadius: 10, marginRight: 10 }}
                                />
                            ))}
                        </ScrollView>
                    )}
                    <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                        <Ionicons name="image-outline" size={24} color="gray" />
                        <Text style={styles.attachButtonText}>{translate('attach_image')}</Text>
                    </TouchableOpacity>
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.postButton} onPress={handleCreateNewPostWithImage}>
                            <Text style={styles.postButtonText}>{translate('post')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closemodal} onPress={closeCreatePostModal}>
                            <Text>{translate('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );


    const renderEditPostModal = () => {
        console.log("renderEditPostModal called, visible:", editPostModalVisible); // เพิ่ม Log ตรงนี้
        console.log("content : ", editContent);
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={editPostModalVisible}
                onRequestClose={() => setEditPostModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>{translate('edit_post')}</Text>
                        <TextInput
                            style={styles.commentInput}
                            multiline
                            placeholder={translate('edit_your_post')}
                            value={editTitle}
                            onChangeText={setEditTitle}
                            textAlignVertical="top"
                        />
                        <TextInput
                            style={styles.commentInput}
                            multiline
                            placeholder={translate('edit_your_post')}
                            value={editContent}
                            onChangeText={setEditContent}
                            textAlignVertical="top"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.postButton} onPress={handleEditPostSubmit}>
                                <Text style={styles.postButtonText}>{translate('save')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.closemodal} onPress={() => setEditPostModalVisible(false)}>
                                <Text>{translate('cancel')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    const renderPost = ({ item: post }) => {
        const userIdFromToken = getUserIdFromToken();
        console.log("Post ID:", post.id, "Active Post:", activePost);
        console.log("Post :", post);

        const imageMapping = {
        'profile1.png': require('../assets/profile1.png'),
        'profile2.png': require('../assets/profile2.png'),
        'profile3.png': require('../assets/profile3.png'),
        'profile4.png': require('../assets/profile4.png'),
        'profile5.png': require('../assets/profile5.png'),
    // เพิ่มไฟล์อื่นๆ ที่ต้องการ
        'default-profile.png': require('../assets/profile1.png') // กรณีไม่มีข้อมูลหรือไม่พบไฟล์
    };
        
        const avatarSource = imageMapping[post.userAvatar] || imageMapping['default-profile.png'];
        return (
            <View key={post.id} style={styles.post}>
                <View style={styles.postHeader}>
                    <Image source={avatarSource} style={styles.userAvatar} />
                    <View style={styles.postDetails}>
                        <Text style={styles.name}>{post.name}</Text>
                        <Text style={styles.date}>{formatDate(post.created_at)}</Text>
                    </View>

                    <View style={styles.menuWrapper}>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => setMenuPostId(menuPostId === post.id ? null : post.id)}
                        >
                            <Text>⋯</Text>
                        </TouchableOpacity>
                        {menuPostId === post.id && (
                            <View style={styles.dropdownMenu}>
                                {post.user_id === userIdFromToken && (
                                    <>
                                        <TouchableOpacity style={styles.editbtn} onPress={() => { handleEditClick(post); setMenuPostId(null); }}>
                                            <Text>{translate('edit')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.delbtn} onPress={() => { handleDeletePost(post.id); setMenuPostId(null); }}>
                                            <Text>{translate('delete')}</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                <TouchableOpacity style={styles.reportbtn} onPress={() => handleReportClick(post.id)}>
                                <Text>{translate('report')}</Text>
                            </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.postTitle}>{post.postTitle}</Text>
                <Text style={styles.postContent}>{post.content}</Text>
                {post.postImages && Array.isArray(post.postImages) && post.postImages.length > 0 ? (
                    <ScrollView horizontal style={styles.picshow}>
                        {post.postImages.map((imageUri, index) => (
                            <Image
                                key={index}
                                source={{ uri: `${PIC_URL}${imageUri}` }}
                                style={styles.postImage}
                            />
                        ))}
                    </ScrollView>
                ) : post.postImages && post.postImages.length > 0 ? (
                        <View style={styles.picshow}>
                            <Image source={{ uri: `${PIC_URL}${post.postImages}` }} style={styles.postImage} />
                        </View>
                    ) : (
                        console.log("ไม่มีรูปภาพในโพสต์:", post.id)
                    )}


                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
                        <Ionicons
                            name={post.isLiked ? "heart" : "heart-outline"}
                            size={20}
                            color={post.isLiked ? "red" : "black"}
                        />
                        <Text style={styles.actionText}>{translate('like')}({post.likeCount || 0})</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setActivePost(post.id)}>
                        <Ionicons name="chatbubble-outline" size={20} color="black" />
                        <Text style={styles.actionText}>{translate('comment')}({post.comments?.length || 0})</Text>
                    </TouchableOpacity>
                </View>

                {activePost === post.id && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={activePost === post.id}
                        onRequestClose={() => setActivePost(null)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modal}>
                                <Text style={styles.modalTitle}>{translate('comments')}</Text>
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder={translate('write_a_comment')}
                                    value={commentMap[post.id] || ''}
                                    onChangeText={(text) => setCommentMap({
                                        ...commentMap, [post.id]: text
                                    })}
                                />
                                <TouchableOpacity style={styles.sendcomment} onPress={() => handleCommentSubmit(post.id)}>
                                    <Ionicons name="paper-plane-outline" size={20} color="white" />
                                    <Text style={styles.sendcommentText}>{translate('send_comment')}</Text>
                                </TouchableOpacity>

                                <FlatList
                                    data={post.comments || []}
                                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                                    renderItem={renderCommentItem}
                                />

                                <TouchableOpacity style={styles.closemodal} onPress={() => setActivePost(null)}>
                                    <Text>{translate('close')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        );
    };
    console.log("isCreatePostModalVisible in render:", isCreatePostModalVisible);
    const renderReportModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={reportModalVisible}
            onRequestClose={() => setReportModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>{translate('report_post')}</Text>
                    <Text>{translate('reason_for_report')}</Text>
                    <TextInput
                        style={styles.commentInput}
                        placeholder={translate('enter_reason')}
                        value={reportReason}
                        onChangeText={setReportReason}
                        multiline
                    />
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.postButton} onPress={handleSendReport}>
                            <Text style={styles.postButtonText}>{translate('send_report')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closemodal} onPress={() => setReportModalVisible(false)}>
                            <Text>{translate('cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
    return (
        <View style={styles.container}>
            {renderEditPostModal()}
            {renderReportModal()}
            <FlatList
                style={styles.flatList}
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPost}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Zabb 4U</Text>
                        </View>

                        <TouchableOpacity onPress={openCreatePostModal} style={{ width: '100%', height: 60, backgroundColor: 'lightgreen' }}>
                            <View style={styles.newPostContainer}>
                                <Text style={styles.newPostInput}>{translate('share_something')}...</Text>

                            </View>
                        </TouchableOpacity>
                        {renderCreatePostModal()}
                    </>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    attachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    attachButtonText: {
        marginLeft: 10,
        color: 'gray',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        color: 'blue',
        fontSize: 16,
    },
    createPostButton: {
        padding: 8,
        backgroundColor: 'green',
        borderRadius: 5,
    },
    createPostButtonText: {
        color: 'white',
    },
    newPostContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center', // เพิ่มตรงนี้
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    newPostInput: {
        flex: 1,
        // borderColor: '#ccc',
        // borderWidth: 1,
        // borderRadius: 5,
        padding: 10,
        marginRight: 10, // คุณอาจต้องการเอาออกถ้าอยากให้สีเขียวเต็มขอบ
        color:'white',
        textShadowColor:"grey",
        textShadowRadius:3,
        textAlignVertical: 'center',
        textShadowOffset:'white',
        textAlign: 'center', // เพิ่มตรงนี้
        fontSize:17,
    },
    postButton: {
        backgroundColor: 'blue',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
        marginTop: 20,
        alignItems: 'center',
    },
    postButtonText: {
        color: 'white',
        fontWeight: 'bold',
        alignItems: 'center',
    },
    post: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        justifyContent: 'space-between',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    postDetails: {
        flex: 1,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    date: {
        color: '#666',
        fontSize: 12,
    },
    menuWrapper: {
        position: 'relative',
    },
    menuButton: {
        padding: 5,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 20,
        right: 0,
        backgroundColor: 'white',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: 80, // ปรับขนาดตามต้องการ
    },
    editbtn: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    delbtn: {
        padding: 10,
        color: 'red',
    },
    postTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    postContent: {
        fontSize: 16,
        marginBottom: 10,
    },
  picshow: {
    flexDirection: 'row', // จัดเรียงรูปภาพในแนวนอน
    marginTop: 10,
    marginBottom: 10,
  },
  postImage: {
    width: 200, // ปรับขนาดตามต้องการ
    height: 150, // ปรับขนาดตามต้องการ
    marginRight: 10,
    borderRadius: 8,
    resizeMode: 'cover', // ปรับตามความเหมาะสม
  },
    actions: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        justifyContent: 'space-around',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: 5,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 20,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },  
    commentInput: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
        minHeight: 80,
    },
    sendcomment: {
        backgroundColor: 'blue',
        borderRadius: 5,
        padding: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    sendcommentText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    commentList: {
        marginTop: 10,
    },
    commentItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    commentUsername: {
        fontWeight: 'bold',
        marginRight: 5,
        flexShrink: 0,
        fontSize: 16, // ปรับขนาดตัวอักษรตรงนี้ (ลองเพิ่มค่า)
    },
    commentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        justifyContent: 'space-between', // เพิ่มตรงนี้
    },
    commentUsername: {
        fontWeight: 'bold',
        marginRight: 5,
        fontSize: 16,
    },
    commentContent: {
        flexShrink: 1,
        textAlign: 'left', // เพิ่มตรงนี้
        fontSize: 16,
    },
    commentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    deleteCommentButton: {
        //marginLeft: 10,
    },
    closemodal: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#ddd',
        borderRadius: 5,
        alignItems: 'center',
    },
    createPostModal: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '80%',
    },
    reportbtn: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
});

export default CommunityScreen;