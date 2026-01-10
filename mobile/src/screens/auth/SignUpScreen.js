import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { useAuthStore } from '../../store/authStore';

const SignUpScreen = ({ navigation, route }) => {
    const { accountType = 'LURKER' } = route.params || {};
    const { register, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationError, setValidationError] = useState(null);

    const getTypeLabel = () => {
        switch (accountType) {
            case 'FOUNDER': return 'Founder';
            case 'BUILDER': return 'Builder';
            case 'INVESTOR': return 'Investor';
            default: return 'Explorer';
        }
    };

    const getTypeIcon = () => {
        switch (accountType) {
            case 'FOUNDER': return 'rocket';
            case 'BUILDER': return 'construct';
            case 'INVESTOR': return 'trending-up';
            default: return 'eye';
        }
    };

    const getTypeColor = () => {
        switch (accountType) {
            case 'FOUNDER': return colors.badges.founder;
            case 'BUILDER': return colors.badges.builder;
            case 'INVESTOR': return colors.badges.investor;
            default: return colors.text.tertiary;
        }
    };

    const handleSignUp = async () => {
        clearError();
        setValidationError(null);

        // Validation
        if (!email.trim()) {
            setValidationError('Email is required');
            return;
        }

        if (!email.includes('@')) {
            setValidationError('Please enter a valid email');
            return;
        }

        if (password.length < 8) {
            setValidationError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        const result = await register(email, password, accountType);

        if (result.success) {
            if (result.requiresVerification) {
                navigation.replace('InvestorVerification');
            } else {
                navigation.replace('Onboarding', { accountType });
            }
        }
    };

    return (
        <LinearGradient
            colors={[colors.background.primary, colors.secondary[800]]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Account Type Badge */}
                        <View style={styles.typeBadgeContainer}>
                            <View style={[styles.typeBadge, { backgroundColor: getTypeColor() + '20' }]}>
                                <Ionicons name={getTypeIcon()} size={20} color={getTypeColor()} />
                                <Text style={[styles.typeBadgeText, { color: getTypeColor() }]}>
                                    {getTypeLabel()} Account
                                </Text>
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Create Your Account</Text>
                        <Text style={styles.subtitle}>
                            Join thousands of founders, builders, and investors
                        </Text>

                        {/* Form */}
                        <View style={styles.form}>
                            <TextInput
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                leftIcon={<Ionicons name="mail-outline" size={20} color={colors.text.tertiary} />}
                            />

                            <TextInput
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="At least 8 characters"
                                secureTextEntry
                                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} />}
                            />

                            <TextInput
                                label="Confirm Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm your password"
                                secureTextEntry
                                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} />}
                            />

                            {(validationError || error) && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={16} color={colors.error.main} />
                                    <Text style={styles.errorText}>{validationError || error}</Text>
                                </View>
                            )}

                            <Button
                                title="Create Account"
                                onPress={handleSignUp}
                                loading={isLoading}
                                fullWidth
                                style={styles.submitButton}
                            />

                            {/* Terms */}
                            <Text style={styles.terms}>
                                By signing up, you agree to our{' '}
                                <Text style={styles.link}>Terms of Service</Text> and{' '}
                                <Text style={styles.link}>Privacy Policy</Text>
                            </Text>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.footerLink}> Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing[6],
    },
    header: {
        paddingTop: spacing[2],
        marginBottom: spacing[4],
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeBadgeContainer: {
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
        gap: spacing[2],
    },
    typeBadgeText: {
        ...typography.styles.small,
        fontFamily: typography.fontFamily.semiBold,
    },
    title: {
        ...typography.styles.h2,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing[2],
    },
    subtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing[8],
    },
    form: {
        flex: 1,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.error.light + '20',
        padding: spacing[3],
        borderRadius: borderRadius.md,
        marginBottom: spacing[4],
        gap: spacing[2],
    },
    errorText: {
        ...typography.styles.small,
        color: colors.error.main,
        flex: 1,
    },
    submitButton: {
        marginTop: spacing[4],
    },
    terms: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing[4],
    },
    link: {
        color: colors.primary[500],
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing[6],
    },
    footerText: {
        ...typography.styles.body,
        color: colors.text.secondary,
    },
    footerLink: {
        ...typography.styles.bodyMedium,
        color: colors.primary[500],
    },
});

export default SignUpScreen;
