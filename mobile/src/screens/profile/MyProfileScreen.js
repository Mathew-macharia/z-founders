import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';
import api from '../../services/api';

const MyProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuthStore();
    const [profileData, setProfileData] = useState(null);
    const [videos, setVideos] = useState([]);
    const [activeTab, setActiveTab] = useState('videos');
    const [stats, setStats] = useState({ followers: 0, following: 0, videos: 0 });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await api.get(`/users/${user.id}`);
            setProfileData(response.data.user);
            setVideos(response.data.user.videos || []);
            setStats({
                followers: response.data.user._count?.followers || 0,
                following: response.data.user._count?.following || 0,
                videos: response.data.user._count?.videos || 0,
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    const getAccountTypeBadge = () => {
        switch (user?.accountType) {
            case 'FOUNDER':
                return { icon: 'rocket', color: colors.badges.founder, label: 'Founder' };
            case 'BUILDER':
                return { icon: 'construct', color: colors.badges.builder, label: 'Builder' };
            case 'INVESTOR':
                return { icon: 'trending-up', color: colors.badges.investor, label: 'Investor' };
            default:
                return { icon: 'eye', color: colors.text.tertiary, label: 'Explorer' };
        }
    };

    const badge = getAccountTypeBadge();

    const getLookingForBadges = () => {
        const badges = [];
        const fp = profileData?.founderProfile;
        if (fp?.lookingForFunding) badges.push({ icon: '💰', label: 'Funding' });
        if (fp?.lookingForCofounder) badges.push({ icon: '🤝', label: 'Cofounder' });
        if (fp?.lookingForFeedback) badges.push({ icon: '💬', label: 'Feedback' });
        return badges;
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Profile</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => navigation.navigate('Settings')}
                            >
                                <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        {/* Avatar */}
                        <View style={styles.avatarSection}>
                            {profileData?.profile?.avatar ? (
                                <Image
                                    source={{ uri: profileData.profile.avatar }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <LinearGradient
                                    colors={[colors.primary[500], colors.primary[600]]}
                                    style={styles.avatar}
                                >
                                    <Text style={styles.avatarText}>
                                        {user?.email?.[0]?.toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            )}

                            <TouchableOpacity
                                style={styles.editAvatarButton}
                                onPress={() => navigation.navigate('EditProfile')}
                            >
                                <Ionicons name="camera" size={16} color={colors.white} />
                            </TouchableOpacity>
                        </View>

                        {/* Name & Type */}
                        <View style={styles.nameSection}>
                            <Text style={styles.name}>
                                {profileData?.profile?.bio?.split('\n')[0] || user?.email?.split('@')[0]}
                            </Text>

                            <View style={[styles.typeBadge, { backgroundColor: badge.color + '20' }]}>
                                <Ionicons name={badge.icon} size={14} color={badge.color} />
                                <Text style={[styles.typeBadgeText, { color: badge.color }]}>
                                    {badge.label}
                                </Text>
                            </View>
                        </View>

                        {/* Tagline */}
                        {profileData?.founderProfile?.tagline && (
                            <Text style={styles.tagline}>
                                {profileData.founderProfile.tagline}
                            </Text>
                        )}

                        {/* Looking For Badges */}
                        {getLookingForBadges().length > 0 && (
                            <View style={styles.lookingForRow}>
                                {getLookingForBadges().map((b, index) => (
                                    <View key={index} style={styles.lookingForBadge}>
                                        <Text style={styles.lookingForIcon}>{b.icon}</Text>
                                        <Text style={styles.lookingForText}>{b.label}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Stats */}
                        <View style={styles.statsRow}>
                            <TouchableOpacity style={styles.statItem}>
                                <Text style={styles.statValue}>{stats.videos}</Text>
                                <Text style={styles.statLabel}>Videos</Text>
                            </TouchableOpacity>
                            <View style={styles.statDivider} />
                            <TouchableOpacity style={styles.statItem}>
                                <Text style={styles.statValue}>{stats.followers}</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </TouchableOpacity>
                            <View style={styles.statDivider} />
                            <TouchableOpacity style={styles.statItem}>
                                <Text style={styles.statValue}>{stats.following}</Text>
                                <Text style={styles.statLabel}>Following</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <Button
                                title="Edit Profile"
                                variant="secondary"
                                size="sm"
                                onPress={() => navigation.navigate('EditProfile')}
                                style={styles.actionButton}
                                icon={<Ionicons name="pencil" size={16} color={colors.text.primary} />}
                            />
                            <Button
                                title="Premium"
                                variant="outline"
                                size="sm"
                                onPress={() => navigation.navigate('Subscription')}
                                style={styles.actionButton}
                                icon={<Ionicons name="diamond" size={16} color={colors.primary[500]} />}
                            />
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
                            onPress={() => setActiveTab('videos')}
                        >
                            <Ionicons
                                name="grid-outline"
                                size={20}
                                color={activeTab === 'videos' ? colors.primary[500] : colors.text.tertiary}
                            />
                            <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
                                Videos
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
                            onPress={() => setActiveTab('saved')}
                        >
                            <Ionicons
                                name="bookmark-outline"
                                size={20}
                                color={activeTab === 'saved' ? colors.primary[500] : colors.text.tertiary}
                            />
                            <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
                                Saved
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Videos Grid */}
                    <View style={styles.videosGrid}>
                        {videos.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="videocam-outline" size={48} color={colors.text.tertiary} />
                                <Text style={styles.emptyTitle}>No videos yet</Text>
                                <Text style={styles.emptySubtitle}>
                                    Your videos will appear here
                                </Text>
                                <Button
                                    title="Record Your First Pitch"
                                    onPress={() => navigation.navigate('Record')}
                                    style={styles.emptyButton}
                                />
                            </View>
                        ) : (
                            <View style={styles.gridContainer}>
                                {videos.map((video, index) => (
                                    <TouchableOpacity
                                        key={video.id}
                                        style={styles.gridItem}
                                        onPress={() => navigation.navigate('VideoDetail', { videoId: video.id })}
                                    >
                                        {video.thumbnailUrl ? (
                                            <Image
                                                source={{ uri: video.thumbnailUrl }}
                                                style={styles.gridThumbnail}
                                            />
                                        ) : (
                                            <View style={styles.gridPlaceholder}>
                                                <Ionicons name="play" size={24} color={colors.text.tertiary} />
                                            </View>
                                        )}
                                        {video.isPinned && (
                                            <View style={styles.pinnedIndicator}>
                                                <Ionicons name="pin" size={12} color={colors.white} />
                                            </View>
                                        )}
                                        <View style={styles.gridOverlay}>
                                            <Ionicons name="play" size={16} color={colors.white} />
                                            <Text style={styles.gridViews}>{video.viewCount}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Logout Button */}
                    <View style={styles.logoutSection}>
                        <Button
                            title="Sign Out"
                            variant="ghost"
                            onPress={handleLogout}
                            icon={<Ionicons name="log-out-outline" size={20} color={colors.error.main} />}
                            textStyle={{ color: colors.error.main }}
                        />
                    </View>
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
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    headerTitle: {
        ...typography.styles.h3,
        color: colors.text.primary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileCard: {
        alignItems: 'center',
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[6],
    },
    avatarSection: {
        position: 'relative',
        marginBottom: spacing[4],
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        ...typography.styles.h1,
        color: colors.white,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.background.primary,
    },
    nameSection: {
        alignItems: 'center',
        marginBottom: spacing[2],
    },
    name: {
        ...typography.styles.h3,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.full,
        gap: spacing[1],
    },
    typeBadgeText: {
        ...typography.styles.small,
        fontFamily: typography.fontFamily.semiBold,
    },
    tagline: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing[3],
    },
    lookingForRow: {
        flexDirection: 'row',
        gap: spacing[2],
        marginBottom: spacing[4],
    },
    lookingForBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
        gap: spacing[1],
    },
    lookingForIcon: {
        fontSize: 14,
    },
    lookingForText: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: spacing[6],
    },
    statValue: {
        ...typography.styles.h3,
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
    actionButtons: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    actionButton: {
        minWidth: 130,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[4],
        gap: spacing[2],
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary[500],
    },
    tabText: {
        ...typography.styles.small,
        color: colors.text.tertiary,
    },
    activeTabText: {
        color: colors.primary[500],
        fontFamily: typography.fontFamily.semiBold,
    },
    videosGrid: {
        padding: spacing[2],
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing[10],
    },
    emptyTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
        marginTop: spacing[4],
    },
    emptySubtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        marginTop: spacing[2],
        marginBottom: spacing[4],
    },
    emptyButton: {
        minWidth: 200,
    },
    gridContainer: {
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
        backgroundColor: colors.secondary[800],
    },
    gridPlaceholder: {
        flex: 1,
        borderRadius: borderRadius.md,
        backgroundColor: colors.secondary[800],
        alignItems: 'center',
        justifyContent: 'center',
    },
    pinnedIndicator: {
        position: 'absolute',
        top: spacing[2],
        left: spacing[2],
        backgroundColor: colors.primary[500],
        padding: spacing[1],
        borderRadius: borderRadius.sm,
    },
    gridOverlay: {
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
    logoutSection: {
        paddingVertical: spacing[6],
        alignItems: 'center',
    },
});

export default MyProfileScreen;
