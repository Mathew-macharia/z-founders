import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { subscriptionsAPI } from '../../services/api';
import Button from '../../components/common/Button';

const PLANS = {
    FOUNDER: [
        {
            id: 'FREE',
            name: 'Free',
            price: 0,
            features: [
                'Post videos & updates',
                'Basic profile',
                '3 investor DMs/month',
                'Community access',
            ],
            limitations: [
                'Limited analytics',
                'No priority support',
            ]
        },
        {
            id: 'FOUNDER_PRO',
            name: 'Founder Pro',
            price: 15,
            popular: true,
            features: [
                'Everything in Free',
                '📊 Premium analytics (who viewed)',
                '💎 Investor viewer breakdown',
                '📧 Unlimited DMs',
                '📌 Pin multiple pitches',
                '⭐ Priority support',
                '🏷️ Verified badge',
            ]
        },
        {
            id: 'STEALTH_MODE',
            name: 'Stealth Mode',
            price: 29,
            features: [
                'Everything in Founder Pro',
                '🕵️‍♂️ Hidden from search/browse',
                '🔒 Private pitch links',
                '🛡️ Control who sees you',
                '✨ Best for competitive spaces'
            ]
        }
    ],
    BUILDER: [
        {
            id: 'FREE',
            name: 'Free',
            price: 0,
            features: [
                'Browse all pitches',
                'Connect with founders',
                'Basic profile',
                'Apply to projects',
            ]
        },
        {
            id: 'BUILDER_PRO',
            name: 'Builder Pro',
            price: 10,
            features: [
                'Everything in Free',
                '🔍 Advanced search filters',
                '📧 Unlimited DMs',
                '⭐ Featured in search',
                '🏷️ Verified badge',
            ]
        }
    ],
    INVESTOR: [
        {
            id: 'FREE',
            name: 'Free',
            price: 0,
            features: [
                'Browse public pitches',
                'Express interest',
                'Basic filters',
            ],
            limitations: [
                'Limited deal flow',
                'No advanced filters',
            ]
        },
        {
            id: 'INVESTOR_PRO',
            name: 'Investor Pro',
            price: 49,
            popular: true,
            features: [
                'Everything in Free',
                '🎯 AI-curated "For You" feed',
                '🔍 Advanced industry filters',
                '📊 Deal flow analytics',
                '📧 Unlimited messaging',
                '📑 Weekly deal reports',
                '🚀 Early access to pitches',
                '⭐ Priority support',
            ]
        }
    ]
};

const SubscriptionScreen = ({ navigation }) => {
    const { user, subscription: currentPlan } = useAuthStore();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const accountType = user?.accountType || 'FOUNDER';
    const plans = PLANS[accountType] || PLANS.FOUNDER;

    useEffect(() => {
        setSelectedPlan(currentPlan || 'FREE');
    }, [currentPlan]);

    const handleSubscribe = async (planId) => {
        if (planId === 'FREE') return;

        setIsLoading(true);
        try {
            const response = await subscriptionsAPI.subscribe({ plan: planId });

            if (response.data.checkoutUrl) {
                // In production, open Stripe checkout
                Alert.alert(
                    'Redirecting to Checkout',
                    'You would be redirected to Stripe to complete payment.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Success', 'Subscription activated!');
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Subscription failed');
        }
        setIsLoading(false);
    };

    const handleCancel = async () => {
        Alert.alert(
            'Cancel Subscription',
            'Are you sure you want to cancel your subscription?',
            [
                { text: 'Keep Subscription', style: 'cancel' },
                {
                    text: 'Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await subscriptionsAPI.cancel();
                            Alert.alert('Cancelled', 'Your subscription has been cancelled');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel subscription');
                        }
                    }
                }
            ]
        );
    };

    const PlanCard = ({ plan, isCurrentPlan }) => (
        <View style={[styles.planCard, plan.popular && styles.popularCard]}>
            {plan.popular && (
                <LinearGradient
                    colors={[colors.primary[500], colors.primary[600]]}
                    style={styles.popularBadge}
                >
                    <Text style={styles.popularText}>Most Popular</Text>
                </LinearGradient>
            )}

            <Text style={styles.planName}>{plan.name}</Text>

            <View style={styles.priceRow}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>/month</Text>
            </View>

            <View style={styles.features}>
                {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.success.main} />
                        <Text style={styles.featureText}>{feature}</Text>
                    </View>
                ))}

                {plan.limitations?.map((limitation, index) => (
                    <View key={`limit-${index}`} style={styles.featureItem}>
                        <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
                        <Text style={styles.limitationText}>{limitation}</Text>
                    </View>
                ))}
            </View>

            {isCurrentPlan ? (
                <View style={styles.currentBadge}>
                    <Ionicons name="checkmark" size={16} color={colors.success.main} />
                    <Text style={styles.currentText}>Current Plan</Text>
                </View>
            ) : plan.price > 0 ? (
                <Button
                    title="Upgrade"
                    onPress={() => handleSubscribe(plan.id)}
                    loading={isLoading}
                    fullWidth
                    variant={plan.popular ? 'primary' : 'secondary'}
                />
            ) : (
                <Button
                    title="Downgrade"
                    onPress={() => handleCancel()}
                    variant="ghost"
                    fullWidth
                />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Subscription</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.heroSection}>
                        <Ionicons name="diamond" size={48} color={colors.primary[500]} />
                        <Text style={styles.heroTitle}>Unlock Your Potential</Text>
                        <Text style={styles.heroSubtitle}>
                            Get more visibility, insights, and connections
                        </Text>
                    </View>

                    {accountType === 'LURKER' ? (
                        <View style={styles.planCard}>
                            <LinearGradient
                                colors={[colors.primary[500], colors.primary[600]]}
                                style={styles.popularBadge}
                            >
                                <Text style={styles.popularText}>Start Your Journey</Text>
                            </LinearGradient>

                            <Text style={styles.planName}>Choose Your Role</Text>
                            <Text style={[styles.period, { marginBottom: 16 }]}>
                                Unlock potential by selecting your path
                            </Text>

                            <View style={styles.features}>
                                <View style={styles.featureItem}>
                                    <Ionicons name="rocket" size={18} color={colors.primary[500]} />
                                    <Text style={styles.featureText}>Founder: Raise funding & build</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="trending-up" size={18} color={colors.success.main} />
                                    <Text style={styles.featureText}>Investor: Find next unicorn</Text>
                                </View>
                                <View style={styles.featureItem}>
                                    <Ionicons name="construct" size={18} color={colors.warning.main} />
                                    <Text style={styles.featureText}>Builder: Join a startup</Text>
                                </View>
                            </View>

                            <Button
                                title="Complete Profile"
                                onPress={() => navigation.navigate('AccountType')}
                                fullWidth
                            />
                        </View>
                    ) : (
                        plans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                isCurrentPlan={currentPlan === plan.id || (!currentPlan && plan.id === 'FREE')}
                            />
                        ))
                    )}

                    {currentPlan && currentPlan !== 'FREE' && (
                        <TouchableOpacity style={styles.manageButton} onPress={handleCancel}>
                            <Text style={styles.manageText}>Manage Subscription</Text>
                        </TouchableOpacity>
                    )}
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
    heroSection: {
        alignItems: 'center',
        paddingVertical: spacing[6],
    },
    heroTitle: {
        ...typography.styles.h3,
        color: colors.text.primary,
        marginTop: spacing[4],
    },
    heroSubtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing[2],
    },
    planCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        padding: spacing[5],
        marginBottom: spacing[4],
        borderWidth: 1,
        borderColor: colors.border.light,
        position: 'relative',
        overflow: 'hidden',
    },
    popularCard: {
        borderColor: colors.primary[500],
        borderWidth: 2,
    },
    popularBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderBottomLeftRadius: borderRadius.lg,
    },
    popularText: {
        ...typography.styles.caption,
        color: colors.white,
        fontFamily: typography.fontFamily.semiBold,
    },
    planName: {
        ...typography.styles.h4,
        color: colors.text.primary,
        marginBottom: spacing[2],
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: spacing[4],
    },
    currency: {
        ...typography.styles.h4,
        color: colors.text.primary,
    },
    price: {
        ...typography.styles.h1,
        color: colors.text.primary,
        marginHorizontal: spacing[1],
    },
    period: {
        ...typography.styles.body,
        color: colors.text.tertiary,
    },
    features: {
        marginBottom: spacing[4],
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing[2],
        gap: spacing[2],
    },
    featureText: {
        ...typography.styles.body,
        color: colors.text.primary,
        flex: 1,
    },
    limitationText: {
        ...typography.styles.body,
        color: colors.text.tertiary,
        flex: 1,
    },
    currentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[3],
        backgroundColor: colors.success.main + '20',
        borderRadius: borderRadius.lg,
        gap: spacing[2],
    },
    currentText: {
        ...typography.styles.bodyMedium,
        color: colors.success.main,
    },
    manageButton: {
        alignItems: 'center',
        paddingVertical: spacing[4],
    },
    manageText: {
        ...typography.styles.body,
        color: colors.text.tertiary,
        textDecorationLine: 'underline',
    },
});

export default SubscriptionScreen;
