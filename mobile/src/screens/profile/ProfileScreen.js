import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { usersAPI, videosAPI, expressInterestAPI } from '../../services/api';
import Button from '../../components/common/Button';

const ProfileScreen = ({ navigation, route }) => {
    const { userId } = route.params || {};
    const { user: currentUser } = useAuthStore();

    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isOwnProfile = currentUser?.id === userId;
    const isInvestor = currentUser?.accountType === 'INVESTOR';

    useEffect(() => {
        loadProfile();
        loadVideos();
    }, [userId]);

    const loadProfile = async () => {
        try {
            const response = await usersAPI.getProfile(userId);
            setProfile(response.data.user);
            setIsFollowing(response.data.isFollowing || false);
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
        setIsLoading(false);
    };

    const loadVideos = async () => {
        try {
            const response = await videosAPI.getByUser(userId);
            setVideos(response.data.videos || []);
        } catch (error) {
            console.error('Failed to load videos:', error);
        }
    };

    const handleFollow = async () => {
        try {
            // Optimistic update
            const newIsFollowing = !isFollowing;
            setIsFollowing(newIsFollowing);

            // Update follower count locally
            setProfile(prev => ({
                ...prev,
                _count: {
                    ...prev._count,
                    followers: newIsFollowing
                        ? (prev._count?.followers || 0) + 1
                        : Math.max(0, (prev._count?.followers || 0) - 1)
                }
            }));

            if (isFollowing) {
                await usersAPI.unfollow(userId);
            } else {
                await usersAPI.follow(userId);
            }
        } catch (error) {
            console.error('Follow failed:', error);
            // Revert on error
            setIsFollowing(isFollowing);
            setProfile(prev => ({
                ...prev,
                _count: {
                    ...prev._count,
                    followers: isFollowing
                        ? (prev._count?.followers || 0) + 1
                        : Math.max(0, (prev._count?.followers || 0) - 1)
                }
            }));
        }
    };

    const handleMessage = () => {
        navigation.navigate('Chat', { userId });
    };

    const handleExpressInterest = async () => {
        try {
            await expressInterestAPI.send({
                founderId: userId,
                message: 'Interested in learning more!'
            });
            alert('Interest expressed! The founder will be notified.');
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to express interest');
        }
    };

    const getAccountBadge = () => {
        switch (profile?.accountType) {
            case 'FOUNDER': return { icon: 'rocket', color: colors.badges.founder, label: 'Founder' };
            case 'BUILDER': return { icon: 'construct', color: colors.badges.builder, label: 'Builder' };
            case 'INVESTOR': return { icon: 'trending-up', color: colors.badges.investor, label: 'Investor' };
            default: return null;
        }
    };

    const badge = getAccountBadge();

    if (isLoading || !profile) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    const pinnedVideo = videos.find(v => v.isPinned);
    const otherVideos = videos.filter(v => !v.isPinned);

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        {profile.profile?.avatar ? (
                            <Image source={{ uri: profile.profile.avatar }} style={styles.avatar} />
                        ) : (
                            <LinearGradient
                                colors={[colors.primary[500], colors.primary[600]]}
                                style={styles.avatar}
                            >
                                <Text style={styles.avatarText}>
                                    {profile.email?.[0]?.toUpperCase()}
                                </Text>
                            </LinearGradient>
                        )}

                        <Text style={styles.name}>
                            {profile.profile?.bio?.split('\n')[0] || profile.email?.split('@')[0]}
                        </Text>

                        {badge && (
                            <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                                <Ionicons name={badge.icon} size={14} color={badge.color} />
                                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                            </View>
                        )}

                        {profile.founderProfile?.tagline && (
                            <Text style={styles.tagline}>{profile.founderProfile.tagline}</Text>
                        )}

                        {/* Stats */}
                        <View style={styles.stats}>
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{videos.length}</Text>
                                <Text style={styles.statLabel}>Videos</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{profile._count?.followers || 0}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.stat}>
                                <Text style={styles.statValue}>{profile._count?.following || 0}</Text>
                                <Text style={styles.statLabel}>Following</Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        {!isOwnProfile && (
                            <View style={styles.actions}>
                                <Button
                                    title={isFollowing ? 'Following' : 'Follow'}
                                    onPress={handleFollow}
                                    variant={isFollowing ? 'secondary' : 'primary'}
                                    style={styles.actionButton}
                                />
                                <Button
                                    title="Message"
                                    onPress={handleMessage}
                                    variant="outline"
                                    style={styles.actionButton}
                                    icon={<Ionicons name="chatbubble-outline" size={16} color={colors.primary[500]} />}
                                />
                            </View>
                        )}

                        {/* Express Interest (Investors viewing Founders) */}
                        {isInvestor && profile.accountType === 'FOUNDER' && (
                            <Button
                                title="Express Interest 💼"
                                onPress={handleExpressInterest}
                                fullWidth
                                style={styles.interestButton}
                            />
                        )}
                    </View>

                    {/* Looking For Badges */}
                    {profile.founderProfile && (
                        <View style={styles.lookingForSection}>
                            {profile.founderProfile.lookingForFunding && (
                                <View style={styles.lookingForBadge}>
                                    <Text>💰</Text><Text style={styles.lookingForText}>Looking for Funding</Text>
                                </View>
                            )}
                            {profile.founderProfile.lookingForCofounder && (
                                <View style={styles.lookingForBadge}>
                                    <Text>🤝</Text><Text style={styles.lookingForText}>Looking for Cofounder</Text>
                                </View>
                            )}
                            {profile.founderProfile.lookingForFeedback && (
                                <View style={styles.lookingForBadge}>
                                    <Text>💬</Text><Text style={styles.lookingForText}>Looking for Feedback</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Pinned Pitch */}
                    {pinnedVideo && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="pin" size={16} color={colors.primary[500]} />
                                <Text style={styles.sectionTitle}>Pinned Pitch</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.pinnedVideo}
                                onPress={() => navigation.navigate('VideoDetail', { videoId: pinnedVideo.id })}
                            >
                                {pinnedVideo.thumbnailUrl ? (
                                    <Image source={{ uri: pinnedVideo.thumbnailUrl }} style={styles.pinnedThumbnail} />
                                ) : (
                                    <View style={styles.pinnedPlaceholder}>
                                        <Ionicons name="play" size={32} color={colors.text.tertiary} />
                                    </View>
                                )}
                                <View style={styles.pinnedOverlay}>
                                    <Ionicons name="play-circle" size={48} color={colors.white} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* All Videos */}
                    {(pinnedVideo ? otherVideos : videos).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Videos</Text>
                            <View style={styles.videoGrid}>
                                {(pinnedVideo ? otherVideos : videos).map((video) => (
                                    <TouchableOpacity
                                        key={video.id}
                                        style={styles.gridItem}
                                        onPress={() => navigation.navigate('VideoDetail', { videoId: video.id })}
                                    >
                                        {video.thumbnailUrl ? (
                                            <Image source={{ uri: video.thumbnailUrl }} style={styles.gridThumbnail} />
                                        ) : (
                                            <View style={styles.gridPlaceholder}>
                                                <Ionicons name="play" size={20} color={colors.text.tertiary} />
                                            </View>
                                        )}
                                        <View style={styles.gridStats}>
                                            <Ionicons name="play" size={12} color={colors.white} />
                                            <Text style={styles.gridViews}>{video.viewCount}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    content: {
        paddingBottom: spacing[10],
    },
    profileHeader: {
        alignItems: 'center',
        paddingHorizontal: spacing[6],
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[3],
    },
    avatarText: {
        ...typography.styles.h1,
        color: colors.white,
    },
    name: {
        ...typography.styles.h3,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.full,
        gap: spacing[1],
        marginBottom: spacing[2],
    },
    badgeText: {
        ...typography.styles.small,
        fontFamily: typography.fontFamily.semiBold,
    },
    tagline: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing[4],
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    stat: {
        alignItems: 'center',
        paddingHorizontal: spacing[6],
    },
    statValue: {
        ...typography.styles.h4,
        color: colors.text.primary,
    },
    statLabel: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.border.light,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing[3],
        marginBottom: spacing[3],
    },
    actionButton: {
        minWidth: 120,
    },
    interestButton: {
        marginTop: spacing[2],
    },
    lookingForSection: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[4],
    },
    lookingForBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        padding: spacing[3],
        borderRadius: borderRadius.lg,
        marginBottom: spacing[2],
        gap: spacing[2],
    },
    lookingForText: {
        ...typography.styles.body,
        color: colors.text.primary,
    },
    section: {
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    sectionTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    pinnedVideo: {
        aspectRatio: 16 / 9,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        position: 'relative',
    },
    pinnedThumbnail: {
        width: '100%',
        height: '100%',
    },
    pinnedPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.secondary[800],
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinnedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '33.33%',
        aspectRatio: 9 / 16,
        padding: spacing[1],
    },
    gridThumbnail: {
        flex: 1,
        borderRadius: borderRadius.md,
    },
    gridPlaceholder: {
        flex: 1,
        borderRadius: borderRadius.md,
        backgroundColor: colors.secondary[800],
        alignItems: 'center',
        justifyContent: 'center',
    },
    gridStats: {
        position: 'absolute',
        bottom: spacing[2],
        left: spacing[2],
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    gridViews: {
        ...typography.styles.caption,
        color: colors.white,
        fontFamily: typography.fontFamily.semiBold,
    },
});

export default ProfileScreen;
