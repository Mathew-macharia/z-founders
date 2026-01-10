import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';

const SettingsScreen = ({ navigation }) => {
    const { logout } = useAuthStore();

    const settingsGroups = [
        {
            title: 'Account',
            items: [
                { icon: 'person-outline', label: 'Edit Profile', screen: 'EditProfile' },
                { icon: 'swap-horizontal', label: 'Switch Account Type', screen: 'AccountType' },
                { icon: 'diamond-outline', label: 'Subscription', screen: 'Subscription' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: 'notifications-outline', label: 'Notifications', screen: 'NotificationSettings' },
                { icon: 'eye-outline', label: 'Privacy', screen: 'Privacy' },
                { icon: 'shield-outline', label: 'Security', screen: 'Security' },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: 'help-circle-outline', label: 'Help Center', screen: 'Help' },
                { icon: 'document-text-outline', label: 'Terms of Service', screen: 'Terms' },
                { icon: 'lock-closed-outline', label: 'Privacy Policy', screen: 'Privacy' },
            ]
        },
    ];

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {settingsGroups.map((group, groupIndex) => (
                        <View key={groupIndex} style={styles.group}>
                            <Text style={styles.groupTitle}>{group.title}</Text>
                            {group.items.map((item, itemIndex) => (
                                <TouchableOpacity
                                    key={itemIndex}
                                    style={styles.settingItem}
                                    onPress={() => item.screen && navigation.navigate(item.screen)}
                                >
                                    <Ionicons name={item.icon} size={22} color={colors.text.secondary} />
                                    <Text style={styles.settingLabel}>{item.label}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}

                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <Ionicons name="log-out-outline" size={22} color={colors.error.main} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <Text style={styles.version}>Version 1.0.0</Text>
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
    group: {
        marginBottom: spacing[6],
    },
    groupTitle: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        marginBottom: spacing[2],
        marginLeft: spacing[2],
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        marginBottom: spacing[2],
    },
    settingLabel: {
        flex: 1,
        ...typography.styles.body,
        color: colors.text.primary,
        marginLeft: spacing[3],
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[4],
        marginTop: spacing[4],
    },
    logoutText: {
        ...typography.styles.bodyMedium,
        color: colors.error.main,
        marginLeft: spacing[2],
    },
    version: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing[6],
    },
});

export default SettingsScreen;
