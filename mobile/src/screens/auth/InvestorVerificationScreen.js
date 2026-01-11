import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import Button from '../../components/common/Button';

const InvestorVerificationScreen = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={64} color={colors.warning.main} />
            </View>
            <Text style={styles.title}>Investor Verification Required</Text>
            <Text style={styles.subtitle}>
                To protect our founder community, we verify all investors before granting full access.
            </Text>

            <View style={styles.stepsContainer}>
                <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                    <Text style={styles.stepText}>Verify your email address</Text>
                </View>
                <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                    <Text style={styles.stepText}>Connect LinkedIn or provide proof</Text>
                </View>
                <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                    <Text style={styles.stepText}>Manual review (24-48 hours)</Text>
                </View>
            </View>

            <Button
                title="Start Verification"
                onPress={() => {
                    // TODO: Implement actual verification flow (LinkedIn/Upload)
                    alert('Verification request started! Please check your email for next steps.');
                    navigation.replace('Main');
                }}
                fullWidth
                style={styles.button}
            />
            <Button
                title="Browse as Read-Only"
                variant="ghost"
                onPress={() => navigation.replace('Main')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
        padding: spacing[6],
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: spacing[6],
    },
    title: {
        ...typography.styles.h3,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing[3],
    },
    subtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing[8],
    },
    stepsContainer: {
        width: '100%',
        marginBottom: spacing[8],
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[4],
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    stepNumberText: {
        ...typography.styles.small,
        color: colors.white,
        fontFamily: typography.fontFamily.semiBold,
    },
    stepText: {
        ...typography.styles.body,
        color: colors.text.primary,
    },
    button: {
        marginBottom: spacing[3],
    },
});

export default InvestorVerificationScreen;
