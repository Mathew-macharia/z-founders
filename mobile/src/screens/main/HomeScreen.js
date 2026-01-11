import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useVideoStore } from '../../store/videoStore';
import { useAuthStore } from '../../store/authStore';
import VideoCard from '../../components/video/VideoCard';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
    const { user } = useAuthStore();
    const { videos, fetchFeed, isLoading, pagination, clearVideos } = useVideoStore();
    const [refreshing, setRefreshing] = useState(false);

    // Refresh feed every time screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadFeed(true);
        }, [])
    );

    const loadFeed = async (refresh = false) => {
        if (refresh) {
            clearVideos();
        }
        await fetchFeed('home', refresh ? 1 : pagination.page);
    };

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadFeed(true);
        setRefreshing(false);
    }, []);

    const handleLoadMore = () => {
        if (!isLoading && pagination.hasMore) {
            fetchFeed('home', pagination.page + 1);
        }
    };

    const handleVideoPress = (video) => {
        navigation.navigate('VideoDetail', { videoId: video.id });
    };

    const handleCreatePress = () => {
        navigation.navigate('Record');
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.greeting}>
                    {getGreeting()}, {user?.email?.split('@')[0]}
                </Text>
                <Text style={styles.subtitle}>Discover what's new</Text>
            </View>

            <View style={styles.headerActions}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No videos yet</Text>
            <Text style={styles.emptySubtitle}>
                Follow founders and builders to see their updates here
            </Text>
        </View>
    );

    const renderFooter = () => {
        if (!isLoading) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator color={colors.primary[500]} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                {renderHeader()}

                <FlatList
                    data={videos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <VideoCard
                            video={item}
                            onPress={() => handleVideoPress(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary[500]}
                            colors={[colors.primary[500]]}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={!isLoading && renderEmpty()}
                    ListFooterComponent={renderFooter()}
                    showsVerticalScrollIndicator={false}
                />

                {/* Floating Create Button */}
                {user?.accountType !== 'LURKER' && (
                    <TouchableOpacity
                        style={styles.createButtonContainer}
                        onPress={handleCreatePress}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={[colors.primary[500], colors.primary[600]]}
                            style={styles.createButton}
                        >
                            <Ionicons name="add" size={32} color={colors.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
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
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    greeting: {
        ...typography.styles.h3,
        color: colors.text.primary,
    },
    subtitle: {
        ...typography.styles.small,
        color: colors.text.secondary,
        marginTop: spacing[1],
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error.main,
    },
    listContent: {
        paddingVertical: spacing[4],
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[20],
        paddingHorizontal: spacing[6],
    },
    emptyTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
        marginTop: spacing[4],
    },
    emptySubtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing[2],
    },
    loadingFooter: {
        paddingVertical: spacing[6],
    },
    createButtonContainer: {
        position: 'absolute',
        bottom: spacing[6],
        right: spacing[6],
    },
    createButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
});

export default HomeScreen;
