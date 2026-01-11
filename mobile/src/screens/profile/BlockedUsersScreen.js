import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { colors, typography, spacing, borderRadius } from '../../theme';

const BlockedUsersScreen = ({ navigation }) => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBlockedUsers = async () => {
        try {
            const res = await api.get('/users/me/blocked');
            setBlockedUsers(res.data.blocked || []);
        } catch (error) {
            Alert.alert('Error', 'Failed to load blocked users');
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (userId, name) => {
        Alert.alert(
            'Unblock User',
            `Are you sure you want to unblock ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unblock',
                    onPress: async () => {
                        try {
                            await api.delete(`/users/${userId}/block`);
                            setBlockedUsers(prev => prev.filter(u => u.id !== userId));
                            Alert.alert('Success', 'User unblocked');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to unblock user');
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.userItem}>
            <View style={styles.userInfo}>
                <Image
                    source={{ uri: item.profile?.avatar || 'https://via.placeholder.com/50' }}
                    style={styles.avatar}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.name}>
                        {item.profile?.bio?.split('\n')[0] || item.email.split('@')[0]}
                    </Text>
                    <Text style={styles.handle}>@{item.email.split('@')[0]}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.unblockButton}
                onPress={() => handleUnblock(item.id, item.email)}
            >
                <Text style={styles.unblockText}>Unblock</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Blocked Users</Text>
            </View>

            {blockedUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="shield-checkmark-outline" size={64} color={colors.text.tertiary} />
                    <Text style={styles.emptyText}>You haven't blocked anyone</Text>
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[5],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    backButton: {
        marginRight: spacing[4],
    },
    headerTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: spacing[5],
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: spacing[4],
        backgroundColor: colors.background.tertiary,
    },
    textContainer: {
        flex: 1,
    },
    name: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    handle: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    unblockButton: {
        backgroundColor: colors.background.tertiary,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
    },
    unblockText: {
        ...typography.styles.button,
        fontSize: 12,
        color: colors.text.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[8],
    },
    emptyText: {
        ...typography.styles.body,
        color: colors.text.secondary,
        marginTop: spacing[5],
        textAlign: 'center',
    },
});

export default BlockedUsersScreen;
