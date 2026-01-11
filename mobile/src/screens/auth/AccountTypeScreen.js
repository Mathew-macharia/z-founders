import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/common/Button';

const ROLES = [
    {
        id: 'FOUNDER',
        title: 'Founder',
        icon: 'rocket',
        description: 'I have a startup or an idea and want to raise funding.',
        color: colors.primary[500]
    },
    {
        id: 'INVESTOR',
        title: 'Investor',
        icon: 'trending-up',
        description: 'I want to discover and fund the next big thing.',
        color: colors.success.main
    },
    {
        id: 'BUILDER',
        title: 'Builder',
        icon: 'construct',
        description: 'I want to join a startup and contribute my skills.',
        color: colors.warning.main
    }
];

const AccountTypeScreen = ({ navigation }) => {
    const { switchAccountType, isLoading } = useAuthStore();
    const [selectedRole, setSelectedRole] = useState(null);

    const handleContinue = async () => {
        if (!selectedRole) return;

        const result = await switchAccountType(selectedRole);

        if (result.success) {
            // Navigate to onboarding to complete profile
            navigation.replace('Onboarding');
        } else {
            Alert.alert('Error', result.error || 'Failed to update account type');
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.title}>Choose Your Path</Text>
                    <Text style={styles.subtitle}>
                        How do you want to use Z Founders?{"\n"}You can change this later.
                    </Text>

                    <View style={styles.rolesContainer}>
                        {ROLES.map((role) => (
                            <TouchableOpacity
                                key={role.id}
                                style={[
                                    styles.roleCard,
                                    selectedRole === role.id && styles.roleCardSelected,
                                    { borderColor: selectedRole === role.id ? role.color : colors.border.light }
                                ]}
                                onPress={() => setSelectedRole(role.id)}
                            >
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: role.color + '20' }
                                ]}>
                                    <Ionicons name={role.icon} size={24} color={role.color} />
                                </View>
                                <View style={styles.roleInfo}>
                                    <Text style={styles.roleTitle}>{role.title}</Text>
                                    <Text style={styles.roleDescription}>{role.description}</Text>
                                </View>
                                <View style={styles.radioContainer}>
                                    <View style={[
                                        styles.radioOuter,
                                        selectedRole === role.id && { borderColor: role.color }
                                    ]}>
                                        {selectedRole === role.id && (
                                            <View style={[styles.radioInner, { backgroundColor: role.color }]} />
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title="Continue"
                        onPress={handleContinue}
                        loading={isLoading}
                        disabled={!selectedRole}
                        fullWidth
                    />
                </View>
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
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    content: {
        padding: spacing[4],
        flexGrow: 1,
    },
    title: {
        ...typography.styles.h2,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    subtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        marginBottom: spacing[6],
    },
    rolesContainer: {
        gap: spacing[4],
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[4],
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        borderWidth: 2,
        borderColor: colors.border.light,
    },
    roleCardSelected: {
        backgroundColor: colors.background.secondary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[4],
    },
    roleInfo: {
        flex: 1,
        marginRight: spacing[3],
    },
    roleTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
        marginBottom: spacing[1],
    },
    roleDescription: {
        ...typography.styles.small,
        color: colors.text.secondary,
        lineHeight: 18,
    },
    radioContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.text.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    footer: {
        padding: spacing[4],
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
        backgroundColor: colors.background.primary,
    },
});

export default AccountTypeScreen;
