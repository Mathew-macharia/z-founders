import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { helpTopics } from '../../data/helpContent';
import { useAuthStore } from '../../store/authStore';

const HelpScreen = ({ navigation }) => {
    const { user } = useAuthStore();

    const filteredTopics = useMemo(() => {
        // Default to 'LURKER' if no user is logged in or accountType matches nothing
        const userRole = user?.accountType || 'LURKER';

        console.log('Current User Role for Help:', userRole);

        // 1. Role Specific (For You): Matches exact role AND is NOT for 'ALL'
        const roleSpecific = helpTopics.filter(topic =>
            topic.roles.includes(userRole) && !topic.roles.includes('ALL')
        );

        // 2. General (For Everyone): Explicitly marked as 'ALL'
        const general = helpTopics.filter(topic =>
            topic.roles.includes('ALL')
        );

        return { roleSpecific, general };
    }, [user]);

    const handleContact = () => {
        Linking.openURL('mailto:support@zfounders.com');
    };

    const renderTopicItem = (item) => (
        <TouchableOpacity
            key={item.id}
            style={styles.topicItem}
            onPress={() => navigation.navigate('HelpArticle', { article: item })}
        >
            <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={24} color={colors.primary[500]} />
            </View>
            <View style={styles.topicInfo}>
                <Text style={styles.topicLabel}>{item.label}</Text>
                <Text style={styles.topicDescription}>{item.description}</Text>
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
                    <Text style={styles.headerTitle}>Help Center</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Role Specific Section */}
                    {filteredTopics.roleSpecific.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>
                                For {user?.accountType ? user.accountType.charAt(0) + user.accountType.slice(1).toLowerCase() + 's' : 'You'}
                            </Text>
                            <View style={styles.section}>
                                {filteredTopics.roleSpecific.map(renderTopicItem)}
                            </View>
                        </>
                    )}

                    {/* General Section */}
                    <Text style={styles.sectionTitle}>General Knowledge</Text>
                    <View style={styles.section}>
                        {filteredTopics.general.map(renderTopicItem)}
                    </View>

                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <TouchableOpacity style={styles.contactCard} onPress={handleContact}>
                        <Ionicons name="mail-outline" size={24} color={colors.primary[500]} />
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactTitle}>Email Support</Text>
                            <Text style={styles.contactSubtitle}>support@zfounders.com</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.note}>
                        Our support team typically responds within 24 hours.
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
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary[500] + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topicInfo: {
        flex: 1,
        marginLeft: spacing[3],
    },
    topicLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    topicDescription: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        padding: spacing[4],
        borderRadius: borderRadius.xl,
        gap: spacing[3],
    },
    contactInfo: {
        flex: 1,
    },
    contactTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    contactSubtitle: {
        ...typography.styles.caption,
        color: colors.primary[500],
        marginTop: spacing[1],
    },
    note: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing[4],
    },
});

export default HelpScreen;
