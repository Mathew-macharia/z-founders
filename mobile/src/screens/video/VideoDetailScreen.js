import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Share,
    FlatList,
    TextInput as RNTextInput,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useVideoStore } from '../../store/videoStore';
import { useAuthStore } from '../../store/authStore';
import { videosAPI, expressInterestAPI } from '../../services/api';
import Button from '../../components/common/Button';

const { width, height } = Dimensions.get('window');

const VideoDetailScreen = ({ navigation, route }) => {
    const { videoId } = route.params || {};
    const { user } = useAuthStore();
    const { toggleLike, toggleSave } = useVideoStore();

    const videoRef = useRef(null);
    const [video, setVideo] = useState(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadVideo();
        loadComments();
    }, [videoId]);

    const loadVideo = async () => {
        try {
            const response = await videosAPI.get(videoId);
            setVideo(response.data.video);
            setIsLiked(response.data.isLiked);
            setIsSaved(response.data.isSaved);
            setIsFollowing(response.data.isFollowing);
        } catch (error) {
            console.error('Failed to load video:', error);
        }
        setIsLoading(false);
    };

    const loadComments = async () => {
        try {
            const response = await videosAPI.getComments(videoId, { page: 1, limit: 50 });
            setComments(response.data.comments || []);
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    };

    const handleLike = async () => {
        const newLiked = !isLiked;
        setIsLiked(newLiked);
        await toggleLike(videoId, isLiked);
    };

    const handleSave = async () => {
        const newSaved = !isSaved;
        setIsSaved(newSaved);
        await toggleSave(videoId, isSaved);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out this pitch on Z Founders: ${video?.caption}`,
                url: `https://zfounders.app/video/${videoId}`
            });
        } catch (error) {
            console.error('Share failed:', error);
        }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await fetch(`/api/users/${video.userId}/follow`, { method: 'DELETE' });
            } else {
                await fetch(`/api/users/${video.userId}/follow`, { method: 'POST' });
            }
            setIsFollowing(!isFollowing);
        } catch (error) {
            console.error('Follow failed:', error);
        }
    };

    const handleExpressInterest = async () => {
        try {
            await expressInterestAPI.send({
                founderId: video.userId,
                videoId: videoId,
                message: 'Interested in learning more about your startup!'
            });
            alert('Interest expressed! The founder will be notified.');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to express interest');
        }
    };

    const handleComment = async () => {
        if (!newComment.trim()) return;

        const submitComment = async () => {
            try {
                const response = await videosAPI.comment(videoId, { content: newComment });
                setComments([response.data.comment, ...comments]);
                setNewComment('');
            } catch (error) {
                console.error('Comment failed:', error);
            }
        };

        if (user?.accountType === 'INVESTOR') {
            const investorProfile = user?.investorProfile;
            if (investorProfile && !investorProfile.isPublicMode) {
                Alert.alert(
                    'Reveal Your Profile?',
                    'Commenting will make your profile visible to this founder. Continue?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Continue', onPress: submitComment }
                    ]
                );
                return;
            }
        }

        submitComment();
    };

    const getVideoTypeBadge = () => {
        switch (video?.type) {
            case 'PITCH': return { icon: '📍', label: 'Pitch', color: colors.primary[500] };
            case 'UPDATE': return { icon: '📈', label: 'Update', color: colors.success.main };
            case 'ASK': return { icon: '🙋', label: 'Ask', color: colors.warning.main };
            case 'WIN_LOSS': return { icon: '🎯', label: 'Win', color: colors.info.main };
            default: return null;
        }
    };

    const badge = getVideoTypeBadge();
    const isInvestor = user?.accountType === 'INVESTOR';
    const isOwner = user?.id === video?.userId;

    if (isLoading || !video) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={colors.white} />
                    </TouchableOpacity>

                    {isOwner && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Analytics', { videoId })}
                            style={styles.analyticsButton}
                        >
                            <Ionicons name="analytics" size={24} color={colors.white} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView style={styles.scrollView}>
                    {/* Video Player */}
                    <View style={styles.videoContainer}>
                        <Video
                            ref={videoRef}
                            source={{ uri: video.videoUrl }}
                            style={styles.video}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay={isPlaying}
                            isLooping
                            useNativeControls
                        />

                        {/* Video Type Badge */}
                        {badge && (
                            <View style={[styles.typeBadge, { backgroundColor: badge.color }]}>
                                <Text style={styles.typeBadgeText}>{badge.icon} {badge.label}</Text>
                            </View>
                        )}

                        {video.isPinned && (
                            <View style={styles.pinnedBadge}>
                                <Ionicons name="pin" size={12} color={colors.white} />
                                <Text style={styles.pinnedText}>Pinned Pitch</Text>
                            </View>
                        )}
                    </View>

                    {/* Engagement Bar */}
                    <View style={styles.engagementBar}>
                        <TouchableOpacity onPress={handleLike} style={styles.engagementItem}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={28}
                                color={isLiked ? colors.error.main : colors.text.primary}
                            />
                            <Text style={styles.engagementCount}>{video.likeCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowComments(!showComments)}
                            style={styles.engagementItem}
                        >
                            <Ionicons name="chatbubble-outline" size={26} color={colors.text.primary} />
                            <Text style={styles.engagementCount}>{video.commentCount}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSave} style={styles.engagementItem}>
                            <Ionicons
                                name={isSaved ? "bookmark" : "bookmark-outline"}
                                size={26}
                                color={isSaved ? colors.primary[500] : colors.text.primary}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleShare} style={styles.engagementItem}>
                            <Ionicons name="share-outline" size={26} color={colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Creator Info */}
                    <View style={styles.creatorSection}>
                        <TouchableOpacity
                            style={styles.creatorInfo}
                            onPress={() => navigation.navigate('Profile', { userId: video.userId })}
                        >
                            {video.user?.profile?.avatar ? (
                                <Image source={{ uri: video.user.profile.avatar }} style={styles.avatar} />
                            ) : (
                                <LinearGradient
                                    colors={[colors.primary[500], colors.primary[600]]}
                                    style={styles.avatar}
                                >
                                    <Text style={styles.avatarText}>
                                        {video.user?.email?.[0]?.toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            )}

                            <View style={styles.creatorDetails}>
                                <View style={styles.creatorNameRow}>
                                    <Text style={styles.creatorName}>
                                        {video.user?.profile?.bio?.split('\n')[0] || video.user?.email?.split('@')[0]}
                                    </Text>
                                    <View style={[styles.accountBadge, { backgroundColor: colors.badges.founder + '20' }]}>
                                        <Ionicons name="rocket" size={12} color={colors.badges.founder} />
                                    </View>
                                </View>

                                {video.user?.founderProfile?.tagline && (
                                    <Text style={styles.tagline} numberOfLines={1}>
                                        {video.user.founderProfile.tagline}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>

                        {!isOwner && (
                            <TouchableOpacity
                                style={[styles.followButton, isFollowing && styles.followingButton]}
                                onPress={handleFollow}
                            >
                                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Caption & Tags */}
                    <View style={styles.captionSection}>
                        {video.caption && (
                            <Text style={styles.caption}>{video.caption}</Text>
                        )}

                        {video.tags?.length > 0 && (
                            <View style={styles.tagsRow}>
                                {video.tags.map((tag, index) => (
                                    <TouchableOpacity key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>#{tag}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <Text style={styles.viewCount}>
                            {video.viewCount} views • {formatDate(video.createdAt)}
                        </Text>
                    </View>

                    {/* Looking For Section (Founders) */}
                    {video.user?.founderProfile && (
                        <View style={styles.lookingForSection}>
                            <Text style={styles.sectionTitle}>Looking For</Text>
                            <View style={styles.lookingForBadges}>
                                {video.user.founderProfile.lookingForFunding && (
                                    <View style={styles.lookingForBadge}>
                                        <Text>💰</Text>
                                        <Text style={styles.lookingForText}>Funding</Text>
                                    </View>
                                )}
                                {video.user.founderProfile.lookingForCofounder && (
                                    <View style={styles.lookingForBadge}>
                                        <Text>🤝</Text>
                                        <Text style={styles.lookingForText}>Cofounder</Text>
                                    </View>
                                )}
                                {video.user.founderProfile.lookingForFeedback && (
                                    <View style={styles.lookingForBadge}>
                                        <Text>💬</Text>
                                        <Text style={styles.lookingForText}>Feedback</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Investor Express Interest Button */}
                    {isInvestor && !isOwner && video.type === 'PITCH' && (
                        <View style={styles.expressInterestSection}>
                            <Button
                                title="Express Interest 💼"
                                onPress={handleExpressInterest}
                                fullWidth
                                icon={<Ionicons name="heart" size={20} color={colors.white} />}
                            />
                            <Text style={styles.expressInterestNote}>
                                Let this founder know you're interested
                            </Text>
                        </View>
                    )}

                    {/* Comments Section */}
                    {showComments && (
                        <View style={styles.commentsSection}>
                            <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

                            {comments.map((comment) => (
                                <View key={comment.id} style={styles.commentItem}>
                                    <LinearGradient
                                        colors={[colors.primary[500], colors.primary[600]]}
                                        style={styles.commentAvatar}
                                    >
                                        <Text style={styles.commentAvatarText}>
                                            {comment.user?.email?.[0]?.toUpperCase()}
                                        </Text>
                                    </LinearGradient>
                                    <View style={styles.commentContent}>
                                        <Text style={styles.commentAuthor}>
                                            {comment.user?.email?.split('@')[0]}
                                        </Text>
                                        <Text style={styles.commentText}>{comment.content}</Text>
                                    </View>
                                </View>
                            ))}

                            {comments.length === 0 && (
                                <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Comment Input */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.commentInputContainer}>
                        <RNTextInput
                            value={newComment}
                            onChangeText={setNewComment}
                            placeholder="Add a comment..."
                            placeholderTextColor={colors.text.tertiary}
                            style={styles.commentInput}
                            multiline
                        />
                        <TouchableOpacity onPress={handleComment} style={styles.sendButton}>
                            <Ionicons name="send" size={22} color={colors.primary[500]} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        ...typography.styles.body,
        color: colors.text.secondary,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing[4],
        zIndex: 10,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    analyticsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    videoContainer: {
        width: width,
        height: width * (16 / 9),
        backgroundColor: colors.black,
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    typeBadge: {
        position: 'absolute',
        top: spacing[16],
        left: spacing[4],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.full,
    },
    typeBadgeText: {
        ...typography.styles.caption,
        color: colors.white,
        fontFamily: typography.fontFamily.semiBold,
    },
    pinnedBadge: {
        position: 'absolute',
        top: spacing[16],
        right: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary[500],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.full,
        gap: spacing[1],
    },
    pinnedText: {
        ...typography.styles.caption,
        color: colors.white,
        fontFamily: typography.fontFamily.semiBold,
    },
    engagementBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    engagementItem: {
        alignItems: 'center',
    },
    engagementCount: {
        ...typography.styles.small,
        color: colors.text.secondary,
        marginTop: spacing[1],
    },
    creatorSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    creatorInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    avatarText: {
        ...typography.styles.bodyMedium,
        color: colors.white,
    },
    creatorDetails: {
        flex: 1,
    },
    creatorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    creatorName: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    accountBadge: {
        padding: spacing[1],
        borderRadius: borderRadius.sm,
    },
    tagline: {
        ...typography.styles.small,
        color: colors.text.secondary,
        marginTop: spacing[1],
    },
    followButton: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary[500],
    },
    followingButton: {
        backgroundColor: colors.background.tertiary,
        borderWidth: 1,
        borderColor: colors.border.medium,
    },
    followButtonText: {
        ...typography.styles.small,
        color: colors.white,
        fontFamily: typography.fontFamily.semiBold,
    },
    followingButtonText: {
        color: colors.text.secondary,
    },
    captionSection: {
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    caption: {
        ...typography.styles.body,
        color: colors.text.primary,
        marginBottom: spacing[3],
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    tag: {
        backgroundColor: colors.primary[500] + '20',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.full,
    },
    tagText: {
        ...typography.styles.small,
        color: colors.primary[400],
    },
    viewCount: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
    },
    lookingForSection: {
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    sectionTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginBottom: spacing[3],
    },
    lookingForBadges: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    lookingForBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.lg,
        gap: spacing[2],
    },
    lookingForText: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    expressInterestSection: {
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    expressInterestNote: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing[2],
    },
    commentsSection: {
        padding: spacing[4],
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: spacing[4],
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    commentAvatarText: {
        ...typography.styles.small,
        color: colors.white,
    },
    commentContent: {
        flex: 1,
    },
    commentAuthor: {
        ...typography.styles.small,
        fontFamily: typography.fontFamily.semiBold,
        color: colors.text.primary,
        marginBottom: spacing[1],
    },
    commentText: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    noComments: {
        ...typography.styles.body,
        color: colors.text.tertiary,
        textAlign: 'center',
        paddingVertical: spacing[6],
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        backgroundColor: colors.background.secondary,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    commentInput: {
        flex: 1,
        ...typography.styles.body,
        color: colors.text.primary,
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        marginRight: spacing[2],
        maxHeight: 100,
    },
    sendButton: {
        padding: spacing[2],
    },
});

export default VideoDetailScreen;
