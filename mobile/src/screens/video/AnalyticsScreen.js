import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useVideoStore } from '../../store/videoStore';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';

const { width } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation, route }) => {
    const { videoId } = route.params || {};
    const { user } = useAuthStore();
    const [analytics, setAnalytics] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, [videoId]);

    const loadAnalytics = async () => {
        try {
            const { fetchAnalytics } = useVideoStore.getState();
            const result = await fetchAnalytics(videoId);
            if (result.success) {
                setAnalytics(result.analytics);
                setIsPremium(result.analytics.premium);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
        setIsLoading(false);
    };

    const StatCard = ({ icon, label, value, color = colors.primary[500], description }) => (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            {description && <Text style={styles.statDesc}>{description}</Text>}
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading analytics...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Video Analytics</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Basic Stats */}
                    <Text style={styles.sectionTitle}>Overview</Text>
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon="eye"
                            label="Views"
                            value={analytics?.viewCount || 0}
                            color={colors.info.main}
                        />
                        <StatCard
                            icon="heart"
                            label="Likes"
                            value={analytics?.likeCount || 0}
                            color={colors.error.main}
                        />
                        <StatCard
                            icon="chatbubble"
                            label="Comments"
                            value={analytics?.commentCount || 0}
                            color={colors.success.main}
                        />
                        <StatCard
                            icon="share"
                            label="Shares"
                            value={analytics?.shareCount || 0}
                            color={colors.warning.main}
                        />
                    </View>

                    {/* Premium Analytics */}
                    {isPremium ? (
                        <>
                            {/* Audience Breakdown */}
                            <Text style={styles.sectionTitle}>Audience Breakdown</Text>
                            <View style={styles.breakdownCard}>
                                <View style={styles.breakdownItem}>
                                    <View style={styles.breakdownBar}>
                                        <View
                                            style={[styles.breakdownFill, {
                                                width: `${(analytics?.accountTypeBreakdown?.founders / analytics?.viewCount * 100) || 0}%`,
                                                backgroundColor: colors.badges.founder
                                            }]}
                                        />
                                    </View>
                                    <View style={styles.breakdownLabel}>
                                        <Ionicons name="rocket" size={16} color={colors.badges.founder} />
                                        <Text style={styles.breakdownText}>Founders</Text>
                                        <Text style={styles.breakdownCount}>{analytics?.accountTypeBreakdown?.founders || 0}</Text>
                                    </View>
                                </View>

                                <View style={styles.breakdownItem}>
                                    <View style={styles.breakdownBar}>
                                        <View
                                            style={[styles.breakdownFill, {
                                                width: `${(analytics?.accountTypeBreakdown?.builders / analytics?.viewCount * 100) || 0}%`,
                                                backgroundColor: colors.badges.builder
                                            }]}
                                        />
                                    </View>
                                    <View style={styles.breakdownLabel}>
                                        <Ionicons name="construct" size={16} color={colors.badges.builder} />
                                        <Text style={styles.breakdownText}>Builders</Text>
                                        <Text style={styles.breakdownCount}>{analytics?.accountTypeBreakdown?.builders || 0}</Text>
                                    </View>
                                </View>

                                <View style={styles.breakdownItem}>
                                    <View style={styles.breakdownBar}>
                                        <View
                                            style={[styles.breakdownFill, {
                                                width: `${(analytics?.accountTypeBreakdown?.investors / analytics?.viewCount * 100) || 0}%`,
                                                backgroundColor: colors.badges.investor
                                            }]}
                                        />
                                    </View>
                                    <View style={styles.breakdownLabel}>
                                        <Ionicons name="trending-up" size={16} color={colors.badges.investor} />
                                        <Text style={styles.breakdownText}>Investors</Text>
                                        <Text style={styles.breakdownCount}>{analytics?.accountTypeBreakdown?.investors || 0}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Investor Views Highlight */}
                            {analytics?.investorViews > 0 && (
                                <View style={styles.investorHighlight}>
                                    <LinearGradient
                                        colors={[colors.warning.main + '20', colors.warning.main + '10']}
                                        style={styles.investorHighlightGradient}
                                    >
                                        <Ionicons name="trending-up" size={32} color={colors.warning.main} />
                                        <View style={styles.investorHighlightContent}>
                                            <Text style={styles.investorHighlightValue}>
                                                {analytics.investorViews} Investor{analytics.investorViews > 1 ? 's' : ''}
                                            </Text>
                                            <Text style={styles.investorHighlightText}>
                                                watched your pitch! 🎉
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </View>
                            )}

                            {/* Public Investor Viewers */}
                            {analytics?.publicInvestorViewers?.length > 0 && (
                                <>
                                    <Text style={styles.sectionTitle}>Investors Who Viewed</Text>
                                    <View style={styles.investorList}>
                                        {analytics.publicInvestorViewers.map((investor, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.investorItem}
                                                onPress={() => navigation.navigate('Profile', { userId: investor.id })}
                                            >
                                                <View style={styles.investorAvatar}>
                                                    <Ionicons name="person" size={20} color={colors.badges.investor} />
                                                </View>
                                                <Text style={styles.investorFirm}>{investor.firm || 'Investor'}</Text>
                                                <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Watch Time */}
                            <View style={styles.watchTimeCard}>
                                <Ionicons name="time" size={24} color={colors.primary[500]} />
                                <View style={styles.watchTimeContent}>
                                    <Text style={styles.watchTimeValue}>
                                        {Math.round(analytics?.averageWatchTime || 0)}s
                                    </Text>
                                    <Text style={styles.watchTimeLabel}>Avg. Watch Time</Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        /* Upgrade CTA */
                        <View style={styles.upgradeCta}>
                            <LinearGradient
                                colors={[colors.primary[500] + '20', colors.primary[600] + '10']}
                                style={styles.upgradeGradient}
                            >
                                <Ionicons name="diamond" size={48} color={colors.primary[500]} />
                                <Text style={styles.upgradeTitle}>Unlock Premium Analytics</Text>
                                <Text style={styles.upgradeText}>
                                    See who's watching your pitches, including investor views,
                                    audience breakdown, and engagement insights.
                                </Text>
                                <Button
                                    title="Upgrade to Founder Pro"
                                    onPress={() => navigation.navigate('Subscription')}
                                    style={styles.upgradeButton}
                                />
                            </LinearGradient>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    headerTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
    },
    content: {
        padding: spacing[4],
    },
    sectionTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginBottom: spacing[3],
        marginTop: spacing[4],
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[3],
    },
    statCard: {
        width: (width - spacing[4] * 2 - spacing[3]) / 2,
        backgroundColor: colors.background.secondary,
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[2],
    },
    statValue: {
        ...typography.styles.h2,
        color: colors.text.primary,
    },
    statLabel: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    statDesc: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
        textAlign: 'center',
    },
    breakdownCard: {
        backgroundColor: colors.background.secondary,
        padding: spacing[4],
        borderRadius: borderRadius.lg,
    },
    breakdownItem: {
        marginBottom: spacing[3],
    },
    breakdownBar: {
        height: 8,
        backgroundColor: colors.background.tertiary,
        borderRadius: 4,
        marginBottom: spacing[2],
        overflow: 'hidden',
    },
    breakdownFill: {
        height: '100%',
        borderRadius: 4,
    },
    breakdownLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    breakdownText: {
        ...typography.styles.small,
        color: colors.text.secondary,
        flex: 1,
    },
    breakdownCount: {
        ...typography.styles.small,
        color: colors.text.primary,
        fontFamily: typography.fontFamily.semiBold,
    },
    investorHighlight: {
        marginTop: spacing[4],
    },
    investorHighlightGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderRadius: borderRadius.lg,
    },
    investorHighlightContent: {
        marginLeft: spacing[4],
    },
    investorHighlightValue: {
        ...typography.styles.h4,
        color: colors.text.primary,
    },
    investorHighlightText: {
        ...typography.styles.body,
        color: colors.text.secondary,
    },
    investorList: {
        gap: spacing[2],
    },
    investorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        padding: spacing[3],
        borderRadius: borderRadius.lg,
    },
    investorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.badges.investor + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    investorFirm: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        flex: 1,
    },
    watchTimeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        marginTop: spacing[4],
    },
    watchTimeContent: {
        marginLeft: spacing[4],
    },
    watchTimeValue: {
        ...typography.styles.h3,
        color: colors.text.primary,
    },
    watchTimeLabel: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    upgradeCta: {
        marginTop: spacing[6],
    },
    upgradeGradient: {
        alignItems: 'center',
        padding: spacing[6],
        borderRadius: borderRadius.xl,
    },
    upgradeTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
        marginTop: spacing[4],
        marginBottom: spacing[2],
    },
    upgradeText: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing[4],
    },
    upgradeButton: {
        minWidth: 200,
    },
});

export default AnalyticsScreen;
