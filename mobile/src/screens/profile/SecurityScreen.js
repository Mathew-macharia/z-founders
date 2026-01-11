import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';

const SecurityScreen = ({ navigation }) => {
    const { user, logoutAll, linkedAccounts } = useAuthStore();
    const [settings, setSettings] = useState({
        biometricLogin: false,
        twoFactorAuth: false,
    });

    const handleChangePassword = () => {
        navigation.navigate('ChangePassword');
    };

    const handleSignOutAllDevices = () => {
        Alert.alert(
            'Sign Out All Devices',
            'This will sign you out from all devices and remove all linked accounts. You will need to log in again.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out All',
                    style: 'destructive',
                    onPress: async () => {
                        await logoutAll();
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action is PERMANENT. All your data will be wiped immediately. Are you absolutely sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'DELETE ACCOUNT',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const api = require('../../services/api').default;
                            await api.delete('/users/me');
                            await logoutAll();
                            Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete account. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const SettingToggle = ({ icon, label, description, settingKey, comingSoon }) => (
        <View style={[styles.settingItem, comingSoon && styles.settingItemDisabled]}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.settingContent}>
                <View style={styles.labelRow}>
                    <Text style={styles.settingLabel}>{label}</Text>
                    {comingSoon && (
                        <View style={styles.comingSoonBadge}>
                            <Text style={styles.comingSoonText}>Coming Soon</Text>
                        </View>
                    )}
                </View>
                {description && <Text style={styles.settingDesc}>{description}</Text>}
            </View>
            <Switch
                value={settings[settingKey]}
                onValueChange={(value) => setSettings({ ...settings, [settingKey]: value })}
                trackColor={{ false: colors.background.tertiary, true: colors.primary[500] + '60' }}
                thumbColor={settings[settingKey] ? colors.primary[500] : colors.text.tertiary}
                disabled={comingSoon}
            />
        </View>
    );

    const SettingButton = ({ icon, label, description, onPress, danger }) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={[styles.settingIcon, danger && { backgroundColor: colors.error.main + '20' }]}>
                <Ionicons name={icon} size={20} color={danger ? colors.error.main : colors.text.secondary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, danger && { color: colors.error.main }]}>{label}</Text>
                {description && <Text style={styles.settingDesc}>{description}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Security</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Password */}
                    <Text style={styles.sectionTitle}>Password</Text>
                    <View style={styles.section}>
                        <SettingButton
                            icon="key-outline"
                            label="Change Password"
                            description="Update your account password"
                            onPress={handleChangePassword}
                        />
                    </View>

                    {/* Login Security */}
                    <Text style={styles.sectionTitle}>Login Security</Text>
                    <View style={styles.section}>
                        <SettingToggle
                            icon="finger-print-outline"
                            label="Biometric Login"
                            description="Use Face ID or fingerprint to log in"
                            settingKey="biometricLogin"
                            comingSoon
                        />
                        <SettingToggle
                            icon="phone-portrait-outline"
                            label="Two-Factor Authentication"
                            description="Add an extra layer of security"
                            settingKey="twoFactorAuth"
                            comingSoon
                        />
                    </View>

                    {/* Sessions */}
                    <Text style={styles.sectionTitle}>Sessions</Text>
                    <View style={styles.section}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingIcon}>
                                <Ionicons name="desktop-outline" size={20} color={colors.text.secondary} />
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingLabel}>Active Sessions</Text>
                                <Text style={styles.settingDesc}>
                                    {linkedAccounts.length} account(s) logged in on this device
                                </Text>
                            </View>
                        </View>
                        <SettingButton
                            icon="exit-outline"
                            label="Sign Out All Devices"
                            description="Remove access from all devices"
                            onPress={handleSignOutAllDevices}
                        />
                    </View>

                    {/* Danger Zone */}
                    <Text style={styles.sectionTitle}>Danger Zone</Text>
                    <View style={styles.section}>
                        <SettingButton
                            icon="trash-outline"
                            label="Delete Account"
                            description="Permanently delete your account and data"
                            onPress={handleDeleteAccount}
                            danger
                        />
                    </View>

                    <Text style={styles.note}>
                        Keep your account secure by enabling two-factor authentication
                        and regularly reviewing your active sessions.
                    </Text>
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
        paddingBottom: spacing[8],
    },
    sectionTitle: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        marginBottom: spacing[2],
        marginLeft: spacing[2],
        marginTop: spacing[4],
    },
    section: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    settingItemDisabled: {
        opacity: 0.7,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    settingContent: {
        flex: 1,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    settingLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    settingDesc: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
    },
    comingSoonBadge: {
        backgroundColor: colors.primary[500] + '20',
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.sm,
    },
    comingSoonText: {
        ...typography.styles.caption,
        color: colors.primary[500],
        fontSize: 10,
    },
    note: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing[6],
        lineHeight: 18,
    },
});

export default SecurityScreen;
