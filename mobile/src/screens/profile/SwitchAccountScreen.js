import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';

const ACCOUNT_TYPE_COLORS = {
    FOUNDER: colors.primary[500],
    INVESTOR: colors.success.main,
    BUILDER: colors.warning.main,
    LURKER: colors.text.tertiary
};

const ACCOUNT_TYPE_ICONS = {
    FOUNDER: 'rocket',
    INVESTOR: 'trending-up',
    BUILDER: 'construct',
    LURKER: 'eye'
};

const SwitchAccountScreen = ({ navigation }) => {
    const { user, linkedAccounts, switchToAccount, removeLinkedAccount, isLoading } = useAuthStore();
    const [switchingId, setSwitchingId] = useState(null);

    const handleSwitchAccount = async (accountId) => {
        if (accountId === user?.id) return; // Already active

        setSwitchingId(accountId);
        const result = await switchToAccount(accountId);
        setSwitchingId(null);

        if (result.success) {
            navigation.goBack();
        } else {
            Alert.alert('Switch Failed', result.error);
        }
    };

    const handleRemoveAccount = (account) => {
        if (account.id === user?.id && linkedAccounts.length === 1) {
            Alert.alert('Cannot Remove', 'You cannot remove your only account.');
            return;
        }

        Alert.alert(
            'Remove Account',
            `Remove ${account.email} from quick switch?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeLinkedAccount(account.id)
                }
            ]
        );
    };

    const handleAddAccount = () => {
        navigation.navigate('AddAccount');
    };

    const getInitials = (email) => {
        return email ? email[0].toUpperCase() : '?';
    };

    const AccountItem = ({ account }) => {
        const isActive = account.id === user?.id;
        const isSwitching = switchingId === account.id;
        const typeColor = ACCOUNT_TYPE_COLORS[account.accountType] || colors.text.tertiary;
        const typeIcon = ACCOUNT_TYPE_ICONS[account.accountType] || 'person';

        return (
            <TouchableOpacity
                style={[styles.accountItem, isActive && styles.accountItemActive]}
                onPress={() => handleSwitchAccount(account.id)}
                onLongPress={() => handleRemoveAccount(account)}
                disabled={isSwitching || isLoading}
            >
                <View style={[styles.avatar, { backgroundColor: typeColor + '30' }]}>
                    {account.avatar ? (
                        <Text style={styles.avatarText}>{getInitials(account.email)}</Text>
                    ) : (
                        <Text style={[styles.avatarText, { color: typeColor }]}>
                            {getInitials(account.email)}
                        </Text>
                    )}
                </View>

                <View style={styles.accountInfo}>
                    <Text style={styles.email} numberOfLines={1}>{account.email}</Text>
                    <View style={styles.typeBadge}>
                        <Ionicons name={typeIcon} size={12} color={typeColor} />
                        <Text style={[styles.typeText, { color: typeColor }]}>
                            {account.accountType}
                        </Text>
                    </View>
                </View>

                {isSwitching ? (
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                ) : isActive ? (
                    <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
                ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Switch Account</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.sectionTitle}>Your Accounts</Text>
                    <Text style={styles.hint}>Long press to remove an account</Text>

                    <View style={styles.accountsList}>
                        {linkedAccounts.map((account) => (
                            <AccountItem key={account.id} account={account} />
                        ))}
                    </View>

                    <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
                        <View style={styles.addIcon}>
                            <Ionicons name="add" size={24} color={colors.primary[500]} />
                        </View>
                        <Text style={styles.addText}>Add Account</Text>
                    </TouchableOpacity>
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
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        marginBottom: spacing[1],
    },
    hint: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginBottom: spacing[4],
    },
    accountsList: {
        gap: spacing[2],
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    accountItemActive: {
        borderColor: colors.success.main,
        backgroundColor: colors.success.main + '10',
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
        ...typography.styles.h4,
        color: colors.text.primary,
    },
    accountInfo: {
        flex: 1,
    },
    email: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginBottom: spacing[1],
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
    },
    typeText: {
        ...typography.styles.caption,
        textTransform: 'capitalize',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        marginTop: spacing[4],
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border.light,
        borderStyle: 'dashed',
    },
    addIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary[500] + '20',
        marginRight: spacing[3],
    },
    addText: {
        ...typography.styles.bodyMedium,
        color: colors.primary[500],
    },
});

export default SwitchAccountScreen;
