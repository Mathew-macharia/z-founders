import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Button from '../../components/common/Button';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
    return (
        <LinearGradient
            colors={[colors.background.primary, colors.secondary[800]]}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[colors.primary[500], colors.primary[600]]}
                            style={styles.logoGradient}
                        >
                            <Ionicons name="rocket" size={48} color={colors.white} />
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>Z Founders</Text>
                    <Text style={styles.subtitle}>
                        Where founders pitch, builders discover, and investors connect
                    </Text>
                </View>

                {/* Role Selection */}
                <View style={styles.rolesSection}>
                    <Text style={styles.rolesTitle}>What brings you here?</Text>

                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => navigation.navigate('SignUp', { accountType: 'FOUNDER' })}
                    >
                        <View style={[styles.roleIcon, { backgroundColor: colors.badges.founder + '20' }]}>
                            <Ionicons name="rocket" size={28} color={colors.badges.founder} />
                        </View>
                        <View style={styles.roleContent}>
                            <Text style={styles.roleTitle}>🚀 I have an idea</Text>
                            <Text style={styles.roleDescription}>
                                Share your vision, get feedback, find cofounders
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => navigation.navigate('SignUp', { accountType: 'BUILDER' })}
                    >
                        <View style={[styles.roleIcon, { backgroundColor: colors.badges.builder + '20' }]}>
                            <Ionicons name="construct" size={28} color={colors.badges.builder} />
                        </View>
                        <View style={styles.roleContent}>
                            <Text style={styles.roleTitle}>🛠️ I want to build</Text>
                            <Text style={styles.roleDescription}>
                                Discover projects, join teams, make an impact
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => navigation.navigate('SignUp', { accountType: 'INVESTOR' })}
                    >
                        <View style={[styles.roleIcon, { backgroundColor: colors.badges.investor + '20' }]}>
                            <Ionicons name="trending-up" size={28} color={colors.badges.investor} />
                        </View>
                        <View style={styles.roleContent}>
                            <Text style={styles.roleTitle}>💰 I invest in startups</Text>
                            <Text style={styles.roleDescription}>
                                Source deals, discover founders, curated pipeline
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.roleCard, styles.lurkerCard]}
                        onPress={() => navigation.navigate('SignUp', { accountType: 'LURKER' })}
                    >
                        <View style={[styles.roleIcon, { backgroundColor: colors.secondary[700] }]}>
                            <Ionicons name="eye" size={28} color={colors.text.tertiary} />
                        </View>
                        <View style={styles.roleContent}>
                            <Text style={styles.roleTitle}>👀 Just browsing</Text>
                            <Text style={styles.roleDescription}>
                                Explore ideas and join later
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <Button
                        title="Sign In"
                        variant="ghost"
                        onPress={() => navigation.navigate('Login')}
                    />
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: spacing[6],
    },
    heroSection: {
        alignItems: 'center',
        paddingTop: spacing[8],
        paddingBottom: spacing[6],
    },
    logoContainer: {
        marginBottom: spacing[4],
    },
    logoGradient: {
        width: 88,
        height: 88,
        borderRadius: borderRadius['2xl'],
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    title: {
        ...typography.styles.h1,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    subtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: spacing[4],
    },
    rolesSection: {
        flex: 1,
    },
    rolesTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
        marginBottom: spacing[4],
        textAlign: 'center',
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: colors.border.light,
    },
    lurkerCard: {
        opacity: 0.8,
    },
    roleIcon: {
        width: 52,
        height: 52,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    roleContent: {
        flex: 1,
    },
    roleTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginBottom: spacing[1],
    },
    roleDescription: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[4],
    },
    footerText: {
        ...typography.styles.body,
        color: colors.text.secondary,
    },
});

export default WelcomeScreen;
