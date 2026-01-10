import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { notificationsAPI } from '../services/api';

const NOTIFICATION_TYPES = {
    like: { icon: 'heart', color: colors.error.main },
    comment: { icon: 'chatbubble', color: colors.info.main },
    follow: { icon: 'person-add', color: colors.primary[500] },
    interest: { icon: 'heart-circle', color: colors.warning.main },
    message: { icon: 'mail', color: colors.success.main },
    milestone: { icon: 'trophy', color: colors.warning.main },
};

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await notificationsAPI.getAll({ page: 1, limit: 50 });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
        setIsLoading(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const handleNotificationPress = async (notification) => {
        // Mark as read
        if (!notification.isRead) {
            try {
                await notificationsAPI.markRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        // Navigate based on type
        switch (notification.type) {
            case 'like':
            case 'comment':
                navigation.navigate('VideoDetail', { videoId: notification.referenceId });
                break;
            case 'follow':
                navigation.navigate('Profile', { userId: notification.actorId });
                break;
            case 'interest':
                navigation.navigate('ExpressInterest', { interestId: notification.referenceId });
                break;
            case 'message':
                navigation.navigate('Chat', { conversationId: notification.referenceId });
                break;
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const renderNotification = ({ item }) => {
        const config = NOTIFICATION_TYPES[item.type] || NOTIFICATION_TYPES.like;

        return (
            <TouchableOpacity
                style={[styles.notificationItem, !item.isRead && styles.unread]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon} size={20} color={config.color} />
                </View>

                <View style={styles.content}>
                    <Text style={styles.message}>
                        <Text style={styles.actorName}>{item.actorName || 'Someone'}</Text>
                        {' '}{item.message}
                    </Text>
                    <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                </View>

                {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>
                When someone interacts with your content, you'll see it here
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('NotificationSettings')}>
                        <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotification}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary[500]}
                        />
                    }
                    ListEmptyComponent={!isLoading && renderEmpty()}
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
    listContent: {
        flexGrow: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    unread: {
        backgroundColor: colors.primary[500] + '08',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    content: {
        flex: 1,
    },
    message: {
        ...typography.styles.body,
        color: colors.text.primary,
        lineHeight: 20,
    },
    actorName: {
        fontFamily: typography.fontFamily.semiBold,
    },
    time: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary[500],
        marginLeft: spacing[2],
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        textAlign: 'center',
        marginTop: spacing[2],
        paddingHorizontal: spacing[6],
    },
});

export default NotificationsScreen;
