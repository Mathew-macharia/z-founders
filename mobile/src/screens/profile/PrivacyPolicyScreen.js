import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

const PrivacyPolicyScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacy Policy</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.lastUpdated}>Last updated: January 2026</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                        <Text style={styles.paragraph}>
                            We collect information you provide directly to us, such as when you create
                            an account, post content, send messages, or contact us for support. This includes:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• Account information (email, password, account type)</Text>
                            <Text style={styles.bulletItem}>• Profile information (name, bio, avatar, location)</Text>
                            <Text style={styles.bulletItem}>• Content you create (videos, comments, messages)</Text>
                            <Text style={styles.bulletItem}>• Usage data and analytics</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                        <Text style={styles.paragraph}>
                            We use the information we collect to:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• Provide, maintain, and improve our services</Text>
                            <Text style={styles.bulletItem}>• Connect founders with investors and builders</Text>
                            <Text style={styles.bulletItem}>• Send you notifications and updates</Text>
                            <Text style={styles.bulletItem}>• Detect and prevent fraud or abuse</Text>
                            <Text style={styles.bulletItem}>• Comply with legal obligations</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. Information Sharing</Text>
                        <Text style={styles.paragraph}>
                            We do not sell your personal information. We may share information:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• With other users as part of the platform functionality</Text>
                            <Text style={styles.bulletItem}>• With service providers who assist our operations</Text>
                            <Text style={styles.bulletItem}>• When required by law or to protect rights</Text>
                            <Text style={styles.bulletItem}>• In connection with a merger or acquisition</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>4. Visibility Controls</Text>
                        <Text style={styles.paragraph}>
                            You have control over who sees your content through our three-tier visibility system:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• Public: Visible to everyone</Text>
                            <Text style={styles.bulletItem}>• Community Only: Visible to founders and builders</Text>
                            <Text style={styles.bulletItem}>• Investors Only: Visible only to verified investors</Text>
                        </View>
                        <Text style={[styles.paragraph, { marginTop: spacing[3] }]}>
                            Investors can choose between Public and Private profiles. Private investor
                            profiles are hidden from search and browse.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. Data Security</Text>
                        <Text style={styles.paragraph}>
                            We implement appropriate technical and organizational measures to protect
                            your personal information. However, no method of transmission over the
                            Internet is 100% secure.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>6. Data Retention</Text>
                        <Text style={styles.paragraph}>
                            We retain your information for as long as your account is active or as
                            needed to provide services. You can request deletion of your account
                            and associated data at any time.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>7. Your Rights</Text>
                        <Text style={styles.paragraph}>
                            Depending on your location, you may have rights including:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• Access to your personal data</Text>
                            <Text style={styles.bulletItem}>• Correction of inaccurate data</Text>
                            <Text style={styles.bulletItem}>• Deletion of your data</Text>
                            <Text style={styles.bulletItem}>• Data portability</Text>
                            <Text style={styles.bulletItem}>• Objection to processing</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>8. Contact Us</Text>
                        <Text style={styles.paragraph}>
                            If you have questions about this Privacy Policy, please contact us at
                            privacy@zfounders.com.
                        </Text>
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
        paddingBottom: spacing[8],
    },
    lastUpdated: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginBottom: spacing[4],
    },
    section: {
        marginBottom: spacing[6],
    },
    sectionTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    paragraph: {
        ...typography.styles.body,
        color: colors.text.secondary,
        lineHeight: 24,
    },
    bulletList: {
        marginTop: spacing[2],
        gap: spacing[1],
    },
    bulletItem: {
        ...typography.styles.body,
        color: colors.text.secondary,
        lineHeight: 24,
        paddingLeft: spacing[2],
    },
});

export default PrivacyPolicyScreen;
