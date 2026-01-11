import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';

const PrivacyScreen = ({ navigation }) => {
    const { user, updateUser } = useAuthStore();
    const [settings, setSettings] = useState({
        isPublic: true,
        showInSearch: true,
        showActivityStatus: true,
        allowMessagesFromEveryone: true,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.profile) {
            setSettings({
                isPublic: user.profile.isPublic ?? true,
                showInSearch: user.profile.showInSearch ?? true,
                showActivityStatus: user.profile.showActivityStatus ?? true,
                allowMessagesFromEveryone: user.profile.allowMessagesFromEveryone ?? true,
            });
        }
    }, [user]);

    const updateSetting = async (key, value) => {
        const oldSettings = { ...settings };
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            const api = require('../../services/api').default;
            const res = await api.patch(`/users/${user.id}`, {
                profile: { [key]: value }
            });
            // Also update store
            updateUser({ profile: res.data.user.profile });
        } catch (error) {
            console.error(error);
            // Revert on failure
            setSettings(oldSettings);
            Alert.alert('Error', 'Failed to update privacy setting');
        }
    };

    const SettingToggle = ({ icon, label, description, settingKey, disabled }) => (
        <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{label}</Text>
                {description && <Text style={styles.settingDesc}>{description}</Text>}
            </View>
            <Switch
                value={settings[settingKey]}
                onValueChange={(value) => updateSetting(settingKey, value)}
                trackColor={{ false: colors.background.tertiary, true: colors.primary[500] + '60' }}
                thumbColor={settings[settingKey] ? colors.primary[500] : colors.text.tertiary}
                disabled={disabled || loading}
            />
        </View>
    );

    const SettingLink = ({ icon, label, description, onPress }) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{label}</Text>
                {description && <Text style={styles.settingDesc}>{description}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
    );

    // Show different options based on account type
    const isInvestor = user?.accountType === 'INVESTOR';
    const isFounder = user?.accountType === 'FOUNDER';

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacy</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Profile Visibility */}
                    <Text style={styles.sectionTitle}>Profile Visibility</Text>
                    <View style={styles.section}>
                        <SettingToggle
                            icon="eye-outline"
                            label="Public Profile"
                            description={isInvestor
                                ? "When off, you're hidden from search and browse"
                                : "When on, anyone can see your profile"
                            }
                            settingKey="isPublic"
                        />
                        <SettingToggle
                            icon="search-outline"
                            label="Show in Search Results"
                            description="Allow others to find you via search"
                            settingKey="showInSearch"
                        />
                    </View>

                    {/* Content Defaults - Founders only */}
                    {isFounder && (
                        <>
                            <Text style={styles.sectionTitle}>Content Defaults</Text>
                            <View style={styles.section}>
                                <SettingLink
                                    icon="videocam-outline"
                                    label="Default Video Visibility"
                                    description="Set default visibility for new videos"
                                    onPress={() => navigation.navigate('DefaultVisibility')}
                                />
                            </View>
                        </>
                    )}

                    {/* Activity */}
                    <Text style={styles.sectionTitle}>Activity</Text>
                    <View style={styles.section}>
                        <SettingToggle
                            icon="footsteps-outline"
                            label="Activity Status"
                            description="Show when you were last active"
                            settingKey="showActivityStatus"
                        />
                    </View>

                    {/* Messaging */}
                    <Text style={styles.sectionTitle}>Messaging</Text>
                    <View style={styles.section}>
                        <SettingToggle
                            icon="chatbubble-outline"
                            label="Allow Messages from Everyone"
                            description="When off, only connections can message you"
                            settingKey="allowMessagesFromEveryone"
                        />
                        <SettingLink
                            icon="ban-outline"
                            label="Blocked Users"
                            description="Manage users you've blocked"
                            onPress={() => navigation.navigate('BlockedUsers')}
                        />
                    </View>

                    {/* Data */}
                    <Text style={styles.sectionTitle}>Data</Text>
                    <View style={styles.section}>
                        <SettingLink
                            icon="download-outline"
                            label="Download My Data"
                            description="Request a copy of your data"
                            onPress={async () => {
                                try {
                                    Alert.alert(
                                        'Download Data',
                                        'Your data is being prepared. It will be sent to your email shortly.',
                                        [{ text: 'OK' }]
                                    );
                                    await require('../../services/api').default.get('/users/me/export');
                                } catch (error) {
                                    Alert.alert('Error', 'Failed to request data export');
                                }
                            }}
                        />
                    </View>

                    <Text style={styles.note}>
                        Privacy settings control who can see your profile and content.
                        Changes take effect immediately.
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
        opacity: 0.5,
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
    settingLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    settingDesc: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
    },
    note: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing[6],
        lineHeight: 18,
    },
});

export default PrivacyScreen;
