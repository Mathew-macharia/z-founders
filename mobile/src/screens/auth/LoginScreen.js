import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';
import { useAuthStore } from '../../store/authStore';

const LoginScreen = ({ navigation }) => {
    const { login, isLoading, error, clearError } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        clearError();

        if (!email.trim() || !password) {
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            // Navigation handled by AppNavigator based on auth state
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

                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={[colors.primary[500], colors.primary[600]]}
                                style={styles.logoGradient}
                            >
                                <Ionicons name="rocket" size={36} color={colors.white} />
                            </LinearGradient>
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>
                            Sign in to continue building your future
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
                                placeholder="Enter your password"
                                secureTextEntry
                                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} />}
                            />

                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            {error && (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle" size={16} color={colors.error.main} />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            <Button
                                title="Sign In"
                                onPress={handleLogin}
                                loading={isLoading}
                                fullWidth
                                style={styles.submitButton}
                            />
                        </View>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Login */}
                        <View style={styles.socialButtons}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-linkedin" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
                                <Text style={styles.footerLink}> Sign Up</Text>
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing[6],
    },
    logoGradient: {
        width: 72,
        height: 72,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
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
        marginBottom: spacing[6],
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: -spacing[2],
        marginBottom: spacing[4],
    },
    forgotPasswordText: {
        ...typography.styles.small,
        color: colors.primary[500],
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
        marginTop: spacing[2],
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[6],
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border.light,
    },
    dividerText: {
        ...typography.styles.small,
        color: colors.text.tertiary,
        paddingHorizontal: spacing[4],
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing[4],
        marginBottom: spacing[6],
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border.light,
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

export default LoginScreen;
