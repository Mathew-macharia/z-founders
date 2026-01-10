import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useVideoStore } from '../../store/videoStore';
import { useAuthStore } from '../../store/authStore';
import VideoCard from '../../components/video/VideoCard';

const FILTERS = [
    { id: 'all', label: 'All', icon: 'apps' },
    { id: 'fintech', label: 'Fintech', icon: 'card' },
    { id: 'health', label: 'Health', icon: 'fitness' },
    { id: 'ai', label: 'AI/ML', icon: 'hardware-chip' },
    { id: 'saas', label: 'SaaS', icon: 'cloud' },
    { id: 'consumer', label: 'Consumer', icon: 'people' },
];

const PitchesScreen = ({ navigation }) => {
    const { user } = useAuthStore();
    const { videos, fetchFeed, isLoading, pagination, clearVideos } = useVideoStore();
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    const isInvestor = user?.accountType === 'INVESTOR';

    useEffect(() => {
        loadPitches();
    }, [activeFilter]);

    const loadPitches = async (refresh = false) => {
        if (refresh) clearVideos();
        const feedType = isInvestor ? 'for-you' : 'pitches';
        const filters = activeFilter !== 'all' ? { industry: activeFilter } : {};
        await fetchFeed(feedType, refresh ? 1 : pagination.page, filters);
    };

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPitches(true);
        setRefreshing(false);
    }, [activeFilter]);

    const handleLoadMore = () => {
        if (!isLoading && pagination.hasMore) {
            loadPitches();
        }
    };

    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            <FlatList
                horizontal
                data={FILTERS}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            activeFilter === item.id && styles.filterChipActive
                        ]}
                        onPress={() => setActiveFilter(item.id)}
                    >
                        <Ionicons
                            name={item.icon}
                            size={16}
                            color={activeFilter === item.id ? colors.white : colors.text.secondary}
                        />
                        <Text style={[
                            styles.filterText,
                            activeFilter === item.id && styles.filterTextActive
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {isInvestor ? '💎 For You' : '🚀 Pitches'}
                    </Text>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.navigate('Search', { type: 'founders' })}
                    >
                        <Ionicons name="options-outline" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>

                {renderFilters()}

                <FlatList
                    data={videos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <VideoCard
                            video={item}
                            onPress={() => navigation.navigate('VideoDetail', { videoId: item.id })}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary[500]}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        !isLoading && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="rocket-outline" size={64} color={colors.text.tertiary} />
                                <Text style={styles.emptyTitle}>No pitches found</Text>
                                <Text style={styles.emptySubtitle}>
                                    {isInvestor
                                        ? 'We\'re curating pitches based on your thesis'
                                        : 'Try a different filter'}
                                </Text>
                            </View>
                        )
                    }
                />
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
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filtersContainer: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    filtersList: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        gap: spacing[2],
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
        backgroundColor: colors.background.tertiary,
        marginRight: spacing[2],
        gap: spacing[2],
    },
    filterChipActive: {
        backgroundColor: colors.primary[500],
    },
    filterText: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    filterTextActive: {
        color: colors.white,
        fontFamily: typography.fontFamily.semiBold,
    },
    listContent: {
        paddingVertical: spacing[4],
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing[20],
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
    },
});

export default PitchesScreen;
