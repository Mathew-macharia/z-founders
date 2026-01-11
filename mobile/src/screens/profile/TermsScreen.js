import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

const TermsScreen = ({ navigation }) => {
    const handleEmailLegal = () => {
        Linking.openURL('mailto:legal@zfounders.com');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Terms of Service</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.lastUpdated}>Last updated: January 2026</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                        <Text style={styles.paragraph}>
                            By accessing and using Z Founders ("the Platform"), you accept and agree to be
                            bound by these Terms of Service. If you do not agree to these terms, please
                            do not use this service.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. User Accounts</Text>
                        <Text style={styles.paragraph}>
                            You are responsible for safeguarding your account credentials and for any
                            activities or actions under your account. You must immediately notify us of
                            any unauthorized use. You may not share accounts or create multiple accounts
                            to circumvent restrictions.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. Account Types</Text>
                        <Text style={styles.paragraph}>
                            The Platform offers different account types: Founder, Investor, and Builder.
                            Each type has specific features and restrictions. Investor accounts require
                            verification before full access is granted. Misrepresenting your account type
                            may result in account termination.
                        </Text>
                    </View>

                    {/* CRITICAL: PRD-required content */}
                    <View style={[styles.section, styles.warningSection]}>
                        <View style={styles.warningHeader}>
                            <Ionicons name="warning" size={24} color={colors.warning.main} />
                            <Text style={styles.warningSectionTitle}>4. Content & Idea Sharing Disclaimer</Text>
                        </View>
                        <Text style={styles.warningParagraph}>
                            <Text style={styles.bold}>POST AT YOUR OWN RISK.</Text> By sharing content on this
                            platform, you acknowledge that:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>
                                • Ideas, pitches, and business concepts you share may be viewed by others
                            </Text>
                            <Text style={styles.bulletItem}>
                                • The Platform cannot prevent others from using ideas they see here
                            </Text>
                            <Text style={styles.bulletItem}>
                                • You should NOT share proprietary technology, trade secrets, or detailed IP
                            </Text>
                            <Text style={styles.bulletItem}>
                                • The Platform is not liable for idea theft or IP infringement
                            </Text>
                        </View>
                        <Text style={[styles.paragraph, { marginTop: spacing[3] }]}>
                            We recommend sharing your vision and value proposition rather than specific
                            implementation details or patentable innovations.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. Content Guidelines</Text>
                        <Text style={styles.paragraph}>
                            Users are responsible for the content they post. Content must not be:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• Illegal, fraudulent, or misleading</Text>
                            <Text style={styles.bulletItem}>• Defamatory, harassing, or abusive</Text>
                            <Text style={styles.bulletItem}>• Infringing on intellectual property rights</Text>
                            <Text style={styles.bulletItem}>• Spam or duplicate/repetitive content</Text>
                            <Text style={styles.bulletItem}>• Harmful to minors or containing adult content</Text>
                        </View>
                        <Text style={[styles.paragraph, { marginTop: spacing[3] }]}>
                            We reserve the right to remove content that violates these guidelines and may
                            suspend or terminate accounts for repeat violations.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>6. Confidentiality Between Users</Text>
                        <Text style={styles.paragraph}>
                            When investors view founder content marked as "Investors Only," they agree not
                            to share this content externally without the founder's consent. Violation of
                            this provision may result in account termination.
                        </Text>
                        <Text style={[styles.paragraph, { marginTop: spacing[3] }]}>
                            However, we cannot technically prevent screenshots or screen recordings.
                            Founders should assume anything posted can potentially be shared.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>7. Investment Disclaimer</Text>
                        <Text style={styles.paragraph}>
                            Z Founders is a platform for connecting founders and investors. We do NOT:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• Provide investment advice</Text>
                            <Text style={styles.bulletItem}>• Guarantee any investment outcomes</Text>
                            <Text style={styles.bulletItem}>• Verify the accuracy of pitch claims</Text>
                            <Text style={styles.bulletItem}>• Facilitate or process investments</Text>
                        </View>
                        <Text style={[styles.paragraph, { marginTop: spacing[3] }]}>
                            All investment decisions are made at your own risk. Investors should conduct
                            their own due diligence before making any investment.
                        </Text>
                    </View>

                    {/* PRD-required: NDA resources */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>8. Legal Agreements Between Users</Text>
                        <Text style={styles.paragraph}>
                            The Platform does not verify or enforce legal agreements between users.
                            If you require NDAs or other legal protections:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• We provide NDA templates in our Resources section</Text>
                            <Text style={styles.bulletItem}>• You may share documents via direct messages</Text>
                            <Text style={styles.bulletItem}>• Both parties sign outside the platform</Text>
                            <Text style={styles.bulletItem}>• We are a communication tool, not a legal service</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>9. Termination</Text>
                        <Text style={styles.paragraph}>
                            We may terminate or suspend your account immediately, without prior notice, for:
                        </Text>
                        <View style={styles.bulletList}>
                            <Text style={styles.bulletItem}>• Violation of these Terms</Text>
                            <Text style={styles.bulletItem}>• Fraudulent or scam activity</Text>
                            <Text style={styles.bulletItem}>• Harassment of other users</Text>
                            <Text style={styles.bulletItem}>• Multiple reports of guideline violations</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>10. Privacy</Text>
                        <Text style={styles.paragraph}>
                            Your privacy is important to us. Please review our Privacy Policy (accessible
                            from Settings → Privacy Policy) to understand how we collect, use, and protect
                            your personal information.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
                        <Text style={styles.paragraph}>
                            We may update these Terms from time to time. We will notify you of significant
                            changes via email or in-app notification. Continued use of the Platform after
                            changes constitutes acceptance of the new Terms.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>12. Contact</Text>
                        <Text style={styles.paragraph}>
                            If you have questions about these Terms, please contact us at:
                        </Text>
                        <TouchableOpacity style={styles.contactButton} onPress={handleEmailLegal}>
                            <Ionicons name="mail-outline" size={20} color={colors.primary[500]} />
                            <Text style={styles.contactButtonText}>legal@zfounders.com</Text>
                        </TouchableOpacity>
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
    bold: {
        fontWeight: '700',
        color: colors.text.primary,
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
    warningSection: {
        backgroundColor: colors.warning.main + '10',
        padding: spacing[4],
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.warning.main + '30',
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginBottom: spacing[3],
    },
    warningSectionTitle: {
        ...typography.styles.h4,
        color: colors.warning.main,
        flex: 1,
    },
    warningParagraph: {
        ...typography.styles.body,
        color: colors.text.secondary,
        lineHeight: 24,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        marginTop: spacing[2],
        padding: spacing[3],
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        alignSelf: 'flex-start',
    },
    contactButtonText: {
        ...typography.styles.bodyMedium,
        color: colors.primary[500],
    },
});

export default TermsScreen;
