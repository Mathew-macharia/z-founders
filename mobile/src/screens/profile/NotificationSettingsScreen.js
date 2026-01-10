import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { notificationsAPI } from '../../services/api';

const NotificationSettingsScreen = ({ navigation }) => {
    const [settings, setSettings] = useState({
        pushEnabled: true,
        emailEnabled: true,
        likes: true,
        comments: true,
        follows: true,
        investorInterest: true,
        messages: true,
        milestones: true,
        weeklyDigest: true,
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await notificationsAPI.getPreferences();
            if (response.data.preferences) {
                setSettings(prev => ({ ...prev, ...response.data.preferences }));
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    };

    const updateSetting = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            await notificationsAPI.updatePreferences(newSettings);
        } catch (error) {
            console.error('Failed to update setting:', error);
            // Revert on failure
            setSettings(settings);
        }
    };

    const SettingItem = ({ icon, label, description, settingKey }) => (
        <View style={styles.settingItem}>
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
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notification Settings</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Master Controls */}
                    <Text style={styles.sectionTitle}>Delivery</Text>
                    <View style={styles.section}>
                        <SettingItem
                            icon="notifications"
                            label="Push Notifications"
                            description="Receive notifications on your device"
                            settingKey="pushEnabled"
                        />
                        <SettingItem
                            icon="mail"
                            label="Email Notifications"
                            description="Receive updates via email"
                            settingKey="emailEnabled"
                        />
                    </View>

                    {/* Activity Notifications */}
                    <Text style={styles.sectionTitle}>Activity</Text>
                    <View style={styles.section}>
                        <SettingItem
                            icon="heart"
                            label="Likes"
                            description="When someone likes your video"
                            settingKey="likes"
                        />
                        <SettingItem
                            icon="chatbubble"
                            label="Comments"
                            description="When someone comments on your video"
                            settingKey="comments"
                        />
                        <SettingItem
                            icon="person-add"
                            label="New Followers"
                            description="When someone follows you"
                            settingKey="follows"
                        />
                        <SettingItem
                            icon="mail"
                            label="Messages"
                            description="When you receive a new message"
                            settingKey="messages"
                        />
                    </View>

                    {/* Investor Notifications */}
                    <Text style={styles.sectionTitle}>Investor Activity</Text>
                    <View style={styles.section}>
                        <SettingItem
                            icon="heart-circle"
                            label="Express Interest"
                            description="When an investor expresses interest"
                            settingKey="investorInterest"
                        />
                    </View>

                    {/* Milestones */}
                    <Text style={styles.sectionTitle}>Milestones</Text>
                    <View style={styles.section}>
                        <SettingItem
                            icon="trophy"
                            label="Achievements"
                            description="When you reach view or engagement milestones"
                            settingKey="milestones"
                        />
                        <SettingItem
                            icon="newspaper"
                            label="Weekly Digest"
                            description="Summary of your weekly activity"
                            settingKey="weeklyDigest"
                        />
                    </View>
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
        marginBottom: spacing[2],
        marginTop: spacing[4],
        marginLeft: spacing[2],
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
});

export default NotificationSettingsScreen;
