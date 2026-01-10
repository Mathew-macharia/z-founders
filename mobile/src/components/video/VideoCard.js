import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing[8];

const VideoCard = ({
    video,
    onPress,
    showEngagement = true,
    compact = false
}) => {
    const { user, isLiked, isSaved, _count } = video;

    const getAccountTypeBadge = () => {
        switch (user?.accountType) {
            case 'FOUNDER':
                return { icon: 'rocket', color: colors.badges.founder, label: 'Founder' };
            case 'BUILDER':
                return { icon: 'construct', color: colors.badges.builder, label: 'Builder' };
            case 'INVESTOR':
                return { icon: 'trending-up', color: colors.badges.investor, label: 'Investor' };
            default:
                return null;
        }
    };

    const badge = getAccountTypeBadge();

    const formatCount = (count) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count?.toString() || '0';
    };

    const getVideoTypeLabel = () => {
        switch (video.type) {
            case 'PITCH': return '📍 Pitch';
            case 'UPDATE': return '📈 Update';
            case 'ASK': return '🙋 Ask';
            case 'WIN_LOSS': return '🎯 Win';
            default: return '';
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, compact && styles.compactContainer]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            {/* Thumbnail */}
            <View style={styles.thumbnailContainer}>
                {video.thumbnailUrl ? (
                    <Image
                        source={{ uri: video.thumbnailUrl }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <LinearGradient
                        colors={[colors.secondary[700], colors.secondary[800]]}
                        style={styles.thumbnail}
                    >
                        <Ionicons name="play-circle" size={48} color={colors.text.tertiary} />
                    </LinearGradient>
                )}

                {/* Duration badge */}
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </Text>
                </View>

                {/* Video type badge */}
                {video.isPinned && (
                    <View style={styles.pinnedBadge}>
                        <Ionicons name="pin" size={12} color={colors.white} />
                    </View>
                )}

                {/* Play overlay */}
                <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={24} color={colors.white} />
                    </View>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* User info */}
                <View style={styles.userRow}>
                    <View style={styles.avatarContainer}>
                        {user?.profile?.avatar ? (
                            <Image
                                source={{ uri: user.profile.avatar }}
                                style={styles.avatar}
                            />
                        ) : (
                            <LinearGradient
                                colors={[colors.primary[500], colors.primary[600]]}
                                style={styles.avatar}
                            >
                                <Text style={styles.avatarText}>
                                    {user?.email?.[0]?.toUpperCase() || '?'}
                                </Text>
                            </LinearGradient>
                        )}
                    </View>

                    <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.userName} numberOfLines={1}>
                                {user?.profile?.bio?.split('\n')[0] || user?.email?.split('@')[0]}
                            </Text>
                            {badge && (
                                <View style={[styles.typeBadge, { backgroundColor: badge.color + '20' }]}>
                                    <Ionicons name={badge.icon} size={10} color={badge.color} />
                                </View>
                            )}
                        </View>
                        <Text style={styles.videoType}>{getVideoTypeLabel()}</Text>
                    </View>

                    {/* Save button */}
                    <TouchableOpacity style={styles.saveButton}>
                        <Ionicons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={20}
                            color={isSaved ? colors.primary[500] : colors.text.tertiary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Caption */}
                {video.caption && (
                    <Text style={styles.caption} numberOfLines={2}>
                        {video.caption}
                    </Text>
                )}

                {/* Tags */}
                {video.tags?.length > 0 && (
                    <View style={styles.tagsRow}>
                        {video.tags.slice(0, 3).map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Engagement */}
                {showEngagement && (
                    <View style={styles.engagementRow}>
                        <View style={styles.engagementItem}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={16}
                                color={isLiked ? colors.error.main : colors.text.tertiary}
                            />
                            <Text style={styles.engagementText}>
                                {formatCount(_count?.likes || video.likeCount)}
                            </Text>
                        </View>

                        <View style={styles.engagementItem}>
                            <Ionicons name="chatbubble-outline" size={16} color={colors.text.tertiary} />
                            <Text style={styles.engagementText}>
                                {formatCount(_count?.comments || video.commentCount)}
                            </Text>
                        </View>

                        <View style={styles.engagementItem}>
                            <Ionicons name="eye-outline" size={16} color={colors.text.tertiary} />
                            <Text style={styles.engagementText}>
                                {formatCount(video.viewCount)}
                            </Text>
                        </View>

                        <View style={styles.engagementItem}>
                            <Ionicons name="share-outline" size={16} color={colors.text.tertiary} />
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        marginHorizontal: spacing[4],
        marginBottom: spacing[4],
        overflow: 'hidden',
        ...shadows.md,
    },
    compactContainer: {
        marginHorizontal: 0,
        marginBottom: spacing[2],
    },
    thumbnailContainer: {
        aspectRatio: 16 / 9,
        backgroundColor: colors.secondary[800],
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    durationBadge: {
        position: 'absolute',
        bottom: spacing[2],
        right: spacing[2],
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.sm,
    },
    durationText: {
        ...typography.styles.caption,
        color: colors.white,
        fontFamily: typography.fontFamily.medium,
    },
    pinnedBadge: {
        position: 'absolute',
        top: spacing[2],
        left: spacing[2],
        backgroundColor: colors.primary[500],
        padding: spacing[1],
        borderRadius: borderRadius.sm,
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: spacing[4],
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[3],
    },
    avatarContainer: {
        marginRight: spacing[3],
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...typography.styles.bodyMedium,
        color: colors.white,
    },
    userInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    userName: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        flex: 1,
    },
    typeBadge: {
        padding: spacing[1],
        borderRadius: borderRadius.sm,
    },
    videoType: {
        ...typography.styles.caption,
        color: colors.text.secondary,
        marginTop: spacing[1],
    },
    saveButton: {
        padding: spacing[2],
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
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.sm,
    },
    tagText: {
        ...typography.styles.caption,
        color: colors.primary[400],
    },
    engagementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[5],
        paddingTop: spacing[2],
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    engagementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    engagementText: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
    },
});

export default VideoCard;
