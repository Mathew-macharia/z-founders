import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';

const { width, height } = Dimensions.get('window');

const ONBOARDING_STEPS = {
    FOUNDER: [
        {
            id: 'welcome',
            title: 'Welcome, Founder! 🚀',
            subtitle: 'Let\'s set up your profile so investors and builders can discover you.',
            icon: 'rocket',
        },
        {
            id: 'company',
            title: 'Tell us about your startup',
            subtitle: 'This helps others understand what you\'re building.',
            fields: ['companyName', 'tagline', 'industry'],
        },
        {
            id: 'lookingFor',
            title: 'What are you looking for?',
            subtitle: 'Help the right people find you.',
            fields: ['lookingForFunding', 'lookingForCofounder', 'lookingForFeedback'],
        },
        {
            id: 'complete',
            title: 'You\'re all set! ✨',
            subtitle: 'Start by recording your first pitch to share with the community.',
            icon: 'checkmark-circle',
        },
    ],
    BUILDER: [
        {
            id: 'welcome',
            title: 'Welcome, Builder! 🛠️',
            subtitle: 'Let\'s showcase your skills so founders can find you.',
            icon: 'construct',
        },
        {
            id: 'skills',
            title: 'What are your skills?',
            subtitle: 'Help founders understand how you can contribute.',
            fields: ['skills', 'availability'],
        },
        {
            id: 'complete',
            title: 'Ready to build! ✨',
            subtitle: 'Browse pitches to find projects you\'re excited about.',
            icon: 'checkmark-circle',
        },
    ],
    INVESTOR: [
        {
            id: 'welcome',
            title: 'Welcome, Investor! 💼',
            subtitle: 'Let\'s set up your profile to discover the best deals.',
            icon: 'trending-up',
        },
        {
            id: 'firm',
            title: 'Tell us about yourself',
            subtitle: 'Help founders understand your background.',
            fields: ['firm', 'title', 'thesis'],
        },
        {
            id: 'privacy',
            title: 'Privacy Settings',
            subtitle: 'Control how founders can see you.',
            fields: ['isPublicMode'],
        },
        {
            id: 'complete',
            title: 'You\'re verified! ✨',
            subtitle: 'Start browsing pitches curated for your thesis.',
            icon: 'checkmark-circle',
        },
    ],
    LURKER: [
        {
            id: 'welcome',
            title: 'Welcome to Z Founders! 👋',
            subtitle: 'Explore the community and upgrade when you\'re ready.',
            icon: 'eye',
        },
        {
            id: 'complete',
            title: 'You\'re in! ✨',
            subtitle: 'Browse pitches and discover amazing startups.',
            icon: 'checkmark-circle',
        },
    ],
};

const INDUSTRIES = [
    'Fintech', 'Health/Bio', 'AI/ML', 'SaaS', 'Consumer',
    'Climate', 'Web3', 'Education', 'Enterprise', 'Other'
];

const OnboardingScreen = ({ navigation, route }) => {
    const { accountType = 'LURKER' } = route.params || {};
    const { updateUser } = useAuthStore();

    const steps = ONBOARDING_STEPS[accountType] || ONBOARDING_STEPS.LURKER;
    const [currentStep, setCurrentStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Form state
    const [formData, setFormData] = useState({
        companyName: '',
        tagline: '',
        industry: '',
        lookingForFunding: false,
        lookingForCofounder: false,
        lookingForFeedback: false,
        skills: '',
        availability: 'part-time',
        firm: '',
        title: '',
        thesis: '',
        isPublicMode: false,
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const animateTransition = (direction) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();

        if (direction === 'next') {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 0));
        }
    };

    const handleComplete = async () => {
        const updates = { profile: {} };

        if (accountType === 'FOUNDER') {
            updates.founderProfile = {
                companyName: formData.companyName,
                tagline: formData.tagline,
                industry: formData.industry,
                lookingForFunding: formData.lookingForFunding,
                lookingForCofounder: formData.lookingForCofounder,
                lookingForFeedback: formData.lookingForFeedback,
            };
        } else if (accountType === 'BUILDER') {
            updates.builderProfile = {
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
                availability: formData.availability,
            };
        } else if (accountType === 'INVESTOR') {
            updates.investorProfile = {
                firm: formData.firm,
                title: formData.title,
                thesis: formData.thesis,
                isPublicMode: formData.isPublicMode,
            };
        }

        await updateUser(updates);
        navigation.replace('Main');
    };

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    const renderStepContent = () => {
        if (step.icon) {
            return (
                <View style={styles.iconStep}>
                    <LinearGradient
                        colors={[colors.primary[500], colors.primary[600]]}
                        style={styles.iconCircle}
                    >
                        <Ionicons name={step.icon} size={64} color={colors.white} />
                    </LinearGradient>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                </View>
            );
        }

        return (
            <View style={styles.formStep}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>

                <View style={styles.fieldsContainer}>
                    {step.fields?.includes('companyName') && (
                        <TextInput
                            label="Company/Project Name"
                            value={formData.companyName}
                            onChangeText={(v) => updateField('companyName', v)}
                            placeholder="Your startup name"
                        />
                    )}

                    {step.fields?.includes('tagline') && (
                        <TextInput
                            label="One-liner"
                            value={formData.tagline}
                            onChangeText={(v) => updateField('tagline', v)}
                            placeholder="What are you building?"
                            maxLength={100}
                        />
                    )}

                    {step.fields?.includes('industry') && (
                        <>
                            <Text style={styles.fieldLabel}>Industry</Text>
                            <View style={styles.chipContainer}>
                                {INDUSTRIES.map((ind) => (
                                    <TouchableOpacity
                                        key={ind}
                                        style={[styles.chip, formData.industry === ind && styles.chipActive]}
                                        onPress={() => updateField('industry', ind)}
                                    >
                                        <Text style={[styles.chipText, formData.industry === ind && styles.chipTextActive]}>
                                            {ind}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {step.fields?.includes('lookingForFunding') && (
                        <View style={styles.checkboxGroup}>
                            <CheckboxItem
                                label="💰 Funding"
                                checked={formData.lookingForFunding}
                                onToggle={() => updateField('lookingForFunding', !formData.lookingForFunding)}
                            />
                            <CheckboxItem
                                label="🤝 Cofounder"
                                checked={formData.lookingForCofounder}
                                onToggle={() => updateField('lookingForCofounder', !formData.lookingForCofounder)}
                            />
                            <CheckboxItem
                                label="💬 Feedback"
                                checked={formData.lookingForFeedback}
                                onToggle={() => updateField('lookingForFeedback', !formData.lookingForFeedback)}
                            />
                        </View>
                    )}

                    {step.fields?.includes('skills') && (
                        <TextInput
                            label="Your Skills"
                            value={formData.skills}
                            onChangeText={(v) => updateField('skills', v)}
                            placeholder="React, Node.js, Python, Design..."
                        />
                    )}

                    {step.fields?.includes('availability') && (
                        <>
                            <Text style={styles.fieldLabel}>Availability</Text>
                            <View style={styles.chipContainer}>
                                {['full-time', 'part-time', 'weekends', 'consulting'].map((avail) => (
                                    <TouchableOpacity
                                        key={avail}
                                        style={[styles.chip, formData.availability === avail && styles.chipActive]}
                                        onPress={() => updateField('availability', avail)}
                                    >
                                        <Text style={[styles.chipText, formData.availability === avail && styles.chipTextActive]}>
                                            {avail}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {step.fields?.includes('firm') && (
                        <TextInput
                            label="Firm/Fund Name"
                            value={formData.firm}
                            onChangeText={(v) => updateField('firm', v)}
                            placeholder="Your firm name (optional)"
                        />
                    )}

                    {step.fields?.includes('title') && (
                        <TextInput
                            label="Your Title"
                            value={formData.title}
                            onChangeText={(v) => updateField('title', v)}
                            placeholder="e.g., Partner, Principal"
                        />
                    )}

                    {step.fields?.includes('thesis') && (
                        <TextInput
                            label="Investment Thesis"
                            value={formData.thesis}
                            onChangeText={(v) => updateField('thesis', v)}
                            placeholder="What types of startups do you invest in?"
                            multiline
                            numberOfLines={3}
                        />
                    )}

                    {step.fields?.includes('isPublicMode') && (
                        <View style={styles.privacyOption}>
                            <TouchableOpacity
                                style={[styles.privacyCard, formData.isPublicMode && styles.privacyCardActive]}
                                onPress={() => updateField('isPublicMode', true)}
                            >
                                <Ionicons name="globe" size={28} color={formData.isPublicMode ? colors.primary[500] : colors.text.tertiary} />
                                <Text style={styles.privacyTitle}>Public</Text>
                                <Text style={styles.privacyDesc}>Founders can see your profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.privacyCard, !formData.isPublicMode && styles.privacyCardActive]}
                                onPress={() => updateField('isPublicMode', false)}
                            >
                                <Ionicons name="eye-off" size={28} color={!formData.isPublicMode ? colors.primary[500] : colors.text.tertiary} />
                                <Text style={styles.privacyTitle}>Stealth</Text>
                                <Text style={styles.privacyDesc}>Hidden until you engage</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Progress */}
                <View style={styles.progressContainer}>
                    {steps.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressDot,
                                index <= currentStep && styles.progressDotActive
                            ]}
                        />
                    ))}
                </View>

                {/* Skip button */}
                {!isLastStep && (
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleComplete}
                    >
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                )}

                {/* Content */}
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    {renderStepContent()}
                </Animated.View>

                {/* Navigation */}
                <View style={styles.navigation}>
                    {!isFirstStep && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => animateTransition('back')}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                    )}

                    <View style={{ flex: 1 }} />

                    {isLastStep ? (
                        <Button
                            title="Get Started"
                            onPress={handleComplete}
                            icon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
                            iconPosition="right"
                        />
                    ) : (
                        <Button
                            title="Continue"
                            onPress={() => animateTransition('next')}
                            icon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
                            iconPosition="right"
                        />
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

const CheckboxItem = ({ label, checked, onToggle }) => (
    <TouchableOpacity style={styles.checkbox} onPress={onToggle}>
        <Ionicons
            name={checked ? "checkbox" : "square-outline"}
            size={24}
            color={colors.primary[500]}
        />
        <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    safeArea: {
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: spacing[4],
        gap: spacing[2],
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.background.tertiary,
    },
    progressDotActive: {
        backgroundColor: colors.primary[500],
        width: 24,
    },
    skipButton: {
        position: 'absolute',
        top: spacing[16],
        right: spacing[4],
        zIndex: 10,
    },
    skipText: {
        ...typography.styles.body,
        color: colors.text.tertiary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing[6],
    },
    iconStep: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[6],
    },
    formStep: {
        flex: 1,
    },
    stepTitle: {
        ...typography.styles.h2,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing[2],
    },
    stepSubtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing[6],
    },
    fieldsContainer: {
        flex: 1,
    },
    fieldLabel: {
        ...typography.styles.small,
        color: colors.text.secondary,
        marginBottom: spacing[2],
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
        marginBottom: spacing[4],
    },
    chip: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
        backgroundColor: colors.background.tertiary,
    },
    chipActive: {
        backgroundColor: colors.primary[500],
    },
    chipText: {
        ...typography.styles.small,
        color: colors.text.secondary,
    },
    chipTextActive: {
        color: colors.white,
    },
    checkboxGroup: {
        gap: spacing[2],
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        gap: spacing[3],
    },
    checkboxLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    privacyOption: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    privacyCard: {
        flex: 1,
        alignItems: 'center',
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background.tertiary,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    privacyCardActive: {
        borderColor: colors.primary[500],
        backgroundColor: colors.primary[500] + '10',
    },
    privacyTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginTop: spacing[2],
    },
    privacyDesc: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing[1],
    },
    navigation: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[6],
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default OnboardingScreen;
