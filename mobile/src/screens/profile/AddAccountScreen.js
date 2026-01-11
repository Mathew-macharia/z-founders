import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';

const ACCOUNT_TYPES = [
    { id: 'FOUNDER', label: 'Founder', icon: 'rocket', color: colors.primary[500] },
    { id: 'INVESTOR', label: 'Investor', icon: 'trending-up', color: colors.success.main },
    { id: 'BUILDER', label: 'Builder', icon: 'construct', color: colors.warning.main },
];

const AddAccountScreen = ({ navigation }) => {
    const { addAccountWithCredentials, registerNewAccount, isLoading } = useAuthStore();

    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedAccountType, setSelectedAccountType] = useState('FOUNDER');
    const [showPassword, setShowPassword] = useState(false);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleAddAccount = async () => {
        // Validation
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }
        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        if (!password) {
            Alert.alert('Error', 'Please enter a password');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        if (mode === 'register') {
            if (password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
            }

            const result = await registerNewAccount(email.trim(), password, selectedAccountType);

            if (result.success) {
                Alert.alert(
                    'Account Created',
                    `Account "${email}" has been added. You can now switch to it from the account list.`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Registration Failed', result.error);
            }
        } else {
            const result = await addAccountWithCredentials(email.trim(), password);

            if (result.success) {
                Alert.alert(
                    'Account Added',
                    `Account "${email}" has been linked. You can now switch to it from the account list.`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Login Failed', result.error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Account</Text>
                    <View style={{ width: 24 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.content}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Mode Toggle */}
                        <View style={styles.modeToggle}>
                            <TouchableOpacity
                                style={[styles.modeButton, mode === 'login' && styles.modeButtonActive]}
                                onPress={() => setMode('login')}
                            >
                                <Text style={[styles.modeButtonText, mode === 'login' && styles.modeButtonTextActive]}>
                                    Login
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
                                onPress={() => setMode('register')}
                            >
                                <Text style={[styles.modeButtonText, mode === 'register' && styles.modeButtonTextActive]}>
                                    Create New
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.description}>
                            {mode === 'login'
                                ? 'Log into an existing account to add it to your quick switch list.'
                                : 'Create a new account and add it to your quick switch list.'}
                        </Text>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color={colors.text.tertiary} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter email address"
                                    placeholderTextColor={colors.text.tertiary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    autoComplete="email"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter password"
                                    placeholderTextColor={colors.text.tertiary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoComplete="password"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color={colors.text.tertiary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password (Register only) */}
                        {mode === 'register' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm password"
                                        placeholderTextColor={colors.text.tertiary}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Account Type (Register only) */}
                        {mode === 'register' && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Account Type</Text>
                                <View style={styles.accountTypes}>
                                    {ACCOUNT_TYPES.map((type) => (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={[
                                                styles.accountTypeCard,
                                                selectedAccountType === type.id && {
                                                    borderColor: type.color,
                                                    backgroundColor: type.color + '10'
                                                }
                                            ]}
                                            onPress={() => setSelectedAccountType(type.id)}
                                        >
                                            <Ionicons
                                                name={type.icon}
                                                size={24}
                                                color={selectedAccountType === type.id ? type.color : colors.text.tertiary}
                                            />
                                            <Text style={[
                                                styles.accountTypeLabel,
                                                selectedAccountType === type.id && { color: type.color }
                                            ]}>
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            <Button
                                title={mode === 'login' ? 'Add Account' : 'Create & Add Account'}
                                onPress={handleAddAccount}
                                loading={isLoading}
                                fullWidth
                            />
                        </View>

                        <Text style={styles.note}>
                            💡 Your current session will remain active. You can switch accounts anytime from Settings.
                        </Text>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    content: {
        padding: spacing[4],
        paddingBottom: spacing[8],
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        padding: spacing[1],
        marginBottom: spacing[4],
    },
    modeButton: {
        flex: 1,
        paddingVertical: spacing[3],
        alignItems: 'center',
        borderRadius: borderRadius.md,
    },
    modeButtonActive: {
        backgroundColor: colors.primary[500],
    },
    modeButtonText: {
        ...typography.styles.bodyMedium,
        color: colors.text.secondary,
    },
    modeButtonTextActive: {
        color: colors.text.inverse,
    },
    description: {
        ...typography.styles.body,
        color: colors.text.secondary,
        marginBottom: spacing[6],
        lineHeight: 22,
    },
    inputGroup: {
        marginBottom: spacing[4],
    },
    label: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        marginBottom: spacing[2],
        marginLeft: spacing[1],
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        gap: spacing[3],
    },
    input: {
        flex: 1,
        ...typography.styles.body,
        color: colors.text.primary,
    },
    accountTypes: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    accountTypeCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[4],
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.border.light,
        gap: spacing[2],
    },
    accountTypeLabel: {
        ...typography.styles.caption,
        color: colors.text.secondary,
    },
    buttonContainer: {
        marginTop: spacing[6],
        marginBottom: spacing[4],
    },
    note: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default AddAccountScreen;
