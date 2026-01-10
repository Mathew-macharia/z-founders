import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { messagesAPI, expressInterestAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const InboxScreen = ({ navigation }) => {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState([]);
    const [interests, setInterests] = useState([]);
    const [activeTab, setActiveTab] = useState('messages');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [convRes, intRes] = await Promise.all([
                messagesAPI.getConversations(),
                user?.accountType === 'FOUNDER' ? expressInterestAPI.getReceived() : null
            ]);

            setConversations(convRes.data.conversations || []);
            if (intRes) {
                setInterests(intRes.data.interests?.filter(i => i.status === 'pending') || []);
            }
        } catch (error) {
            console.error('Failed to load inbox:', error);
        }
        setIsLoading(false);
    };

    const renderConversation = ({ item }) => {
        const { otherParticipant, lastMessage } = item;

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
            >
                {otherParticipant?.profile?.avatar ? (
                    <Image
                        source={{ uri: otherParticipant.profile.avatar }}
                        style={styles.avatar}
                    />
                ) : (
                    <LinearGradient
                        colors={[colors.primary[500], colors.primary[600]]}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>
                            {otherParticipant?.isPrivate ? '?' : (otherParticipant?.email?.[0] || '?').toUpperCase()}
                        </Text>
                    </LinearGradient>
                )}

                <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                        <Text style={styles.conversationName} numberOfLines={1}>
                            {otherParticipant?.isPrivate
                                ? 'Private Investor'
                                : otherParticipant?.profile?.bio?.split('\n')[0] || otherParticipant?.email?.split('@')[0]
                            }
                        </Text>
                        {lastMessage && (
                            <Text style={styles.conversationTime}>
                                {formatTime(lastMessage.createdAt)}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessage?.content || 'No messages yet'}
                    </Text>
                </View>

                {item.status === 'REQUEST' && (
                    <View style={styles.requestBadge}>
                        <Text style={styles.requestBadgeText}>Request</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderInterest = ({ item }) => (
        <TouchableOpacity
            style={styles.interestItem}
            onPress={() => navigation.navigate('ExpressInterest', { interestId: item.id })}
        >
            <View style={styles.interestIcon}>
                <Ionicons name="heart" size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.interestContent}>
                <Text style={styles.interestTitle}>
                    {item.investor?.isPrivate
                        ? 'A verified investor'
                        : item.investor?.investorProfile?.firm || 'An investor'
                    } is interested!
                </Text>
                <Text style={styles.interestSubtitle}>
                    Tap to view and respond
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
    );

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Inbox</Text>
                </View>

                {/* Interest alerts for founders */}
                {interests.length > 0 && (
                    <View style={styles.interestsSection}>
                        <Text style={styles.sectionTitle}>🎉 New Interest</Text>
                        <FlatList
                            data={interests}
                            keyExtractor={(item) => item.id}
                            renderItem={renderInterest}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
                        onPress={() => setActiveTab('messages')}
                    >
                        <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
                            Messages
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                        onPress={() => setActiveTab('requests')}
                    >
                        <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                            Requests
                        </Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={conversations.filter(c =>
                        activeTab === 'requests' ? c.status === 'REQUEST' : c.status === 'ACTIVE'
                    )}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color={colors.text.tertiary} />
                            <Text style={styles.emptyTitle}>No messages yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Start connecting with founders, builders, and investors
                            </Text>
                        </View>
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
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
    },
    headerTitle: {
        ...typography.styles.h3,
        color: colors.text.primary,
    },
    interestsSection: {
        paddingHorizontal: spacing[4],
        marginBottom: spacing[4],
    },
    sectionTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginBottom: spacing[3],
    },
    interestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary[500] + '15',
        borderRadius: borderRadius.lg,
        padding: spacing[4],
        marginBottom: spacing[2],
        borderWidth: 1,
        borderColor: colors.primary[500] + '30',
    },
    interestIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary[500] + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    interestContent: {
        flex: 1,
    },
    interestTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    interestSubtitle: {
        ...typography.styles.small,
        color: colors.text.secondary,
        marginTop: spacing[1],
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
        marginBottom: spacing[2],
    },
    tab: {
        flex: 1,
        paddingVertical: spacing[3],
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary[500],
    },
    tabText: {
        ...typography.styles.bodyMedium,
        color: colors.text.tertiary,
    },
    activeTabText: {
        color: colors.primary[500],
    },
    listContent: {
        paddingHorizontal: spacing[4],
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    avatarText: {
        ...typography.styles.bodyMedium,
        color: colors.white,
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[1],
    },
    conversationName: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        flex: 1,
        marginRight: spacing[2],
    },
    conversationTime: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
    },
    lastMessage: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    requestBadge: {
        backgroundColor: colors.warning.main + '20',
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.sm,
        marginLeft: spacing[2],
    },
    requestBadgeText: {
        ...typography.styles.caption,
        color: colors.warning.main,
        fontFamily: typography.fontFamily.semiBold,
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
        textAlign: 'center',
        paddingHorizontal: spacing[6],
    },
});

export default InboxScreen;
