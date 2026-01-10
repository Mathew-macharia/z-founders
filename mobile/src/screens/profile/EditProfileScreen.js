import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import TextInput from '../../components/common/TextInput';
import Button from '../../components/common/Button';

const EditProfileScreen = ({ navigation }) => {
    const { user, updateUser } = useAuthStore();

    const [avatar, setAvatar] = useState(user?.profile?.avatar || null);
    const [bio, setBio] = useState(user?.profile?.bio || '');
    const [location, setLocation] = useState(user?.profile?.location || '');
    const [website, setWebsite] = useState(user?.profile?.website || '');

    // Founder-specific
    const [tagline, setTagline] = useState(user?.founderProfile?.tagline || '');
    const [companyName, setCompanyName] = useState(user?.founderProfile?.companyName || '');
    const [industry, setIndustry] = useState(user?.founderProfile?.industry || '');
    const [lookingForFunding, setLookingForFunding] = useState(user?.founderProfile?.lookingForFunding || false);
    const [lookingForCofounder, setLookingForCofounder] = useState(user?.founderProfile?.lookingForCofounder || false);
    const [lookingForFeedback, setLookingForFeedback] = useState(user?.founderProfile?.lookingForFeedback || false);

    // Builder-specific
    const [skills, setSkills] = useState(user?.builderProfile?.skills?.join(', ') || '');
    const [availability, setAvailability] = useState(user?.builderProfile?.availability || '');
    const [lookingForProject, setLookingForProject] = useState(user?.builderProfile?.lookingForProject || false);

    // Investor-specific
    const [firm, setFirm] = useState(user?.investorProfile?.firm || '');
    const [investorTitle, setInvestorTitle] = useState(user?.investorProfile?.title || '');
    const [thesis, setThesis] = useState(user?.investorProfile?.thesis || '');
    const [isPublicMode, setIsPublicMode] = useState(user?.investorProfile?.isPublicMode ?? true);

    const [isLoading, setIsLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);

        const updates = {
            profile: {
                avatar,
                bio,
                location,
                website,
            }
        };

        if (user?.accountType === 'FOUNDER') {
            updates.founderProfile = {
                tagline,
                companyName,
                industry,
                lookingForFunding,
                lookingForCofounder,
                lookingForFeedback,
            };
        }

        if (user?.accountType === 'BUILDER') {
            updates.builderProfile = {
                skills: skills.split(',').map(s => s.trim()).filter(s => s),
                availability,
                lookingForProject,
            };
        }

        if (user?.accountType === 'INVESTOR') {
            updates.investorProfile = {
                firm,
                title: investorTitle,
                thesis,
                isPublicMode,
            };
        }

        const result = await updateUser(updates);

        setIsLoading(false);

        if (result.success) {
            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } else {
            Alert.alert('Error', result.error || 'Failed to update profile');
        }
    };

    const CheckboxOption = ({ label, value, onToggle, description }) => (
        <TouchableOpacity style={styles.checkboxOption} onPress={onToggle}>
            <Ionicons
                name={value ? "checkbox" : "square-outline"}
                size={24}
                color={colors.primary[500]}
            />
            <View style={styles.checkboxContent}>
                <Text style={styles.checkboxLabel}>{label}</Text>
                {description && <Text style={styles.checkboxDesc}>{description}</Text>}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                        <Text style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Avatar */}
                    <TouchableOpacity style={styles.avatarSection} onPress={pickImage}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatar} />
                        ) : (
                            <LinearGradient
                                colors={[colors.primary[500], colors.primary[600]]}
                                style={styles.avatar}
                            >
                                <Ionicons name="person" size={40} color={colors.white} />
                            </LinearGradient>
                        )}
                        <View style={styles.avatarEditBadge}>
                            <Ionicons name="camera" size={16} color={colors.white} />
                        </View>
                    </TouchableOpacity>

                    {/* Basic Info */}
                    <Text style={styles.sectionTitle}>Basic Info</Text>

                    <TextInput
                        label="Bio"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell people about yourself"
                        multiline
                        numberOfLines={3}
                        maxLength={300}
                    />

                    <TextInput
                        label="Location"
                        value={location}
                        onChangeText={setLocation}
                        placeholder="San Francisco, CA"
                        leftIcon={<Ionicons name="location-outline" size={20} color={colors.text.tertiary} />}
                    />

                    <TextInput
                        label="Website"
                        value={website}
                        onChangeText={setWebsite}
                        placeholder="https://yoursite.com"
                        leftIcon={<Ionicons name="globe-outline" size={20} color={colors.text.tertiary} />}
                        keyboardType="url"
                    />

                    {/* Founder-specific fields */}
                    {user?.accountType === 'FOUNDER' && (
                        <>
                            <Text style={styles.sectionTitle}>Founder Profile</Text>

                            <TextInput
                                label="Company/Project Name"
                                value={companyName}
                                onChangeText={setCompanyName}
                                placeholder="Your startup name"
                            />

                            <TextInput
                                label="Tagline"
                                value={tagline}
                                onChangeText={setTagline}
                                placeholder="One-liner about your startup"
                                maxLength={100}
                            />

                            <TextInput
                                label="Industry"
                                value={industry}
                                onChangeText={setIndustry}
                                placeholder="e.g., Fintech, Health, AI"
                            />

                            <Text style={styles.sectionTitle}>What are you looking for?</Text>

                            <CheckboxOption
                                label="💰 Funding"
                                value={lookingForFunding}
                                onToggle={() => setLookingForFunding(!lookingForFunding)}
                                description="Actively seeking investment"
                            />

                            <CheckboxOption
                                label="🤝 Cofounder"
                                value={lookingForCofounder}
                                onToggle={() => setLookingForCofounder(!lookingForCofounder)}
                                description="Looking for a partner"
                            />

                            <CheckboxOption
                                label="💬 Feedback"
                                value={lookingForFeedback}
                                onToggle={() => setLookingForFeedback(!lookingForFeedback)}
                                description="Open to advice and input"
                            />
                        </>
                    )}

                    {/* Builder-specific fields */}
                    {user?.accountType === 'BUILDER' && (
                        <>
                            <Text style={styles.sectionTitle}>Builder Profile</Text>

                            <TextInput
                                label="Skills (comma-separated)"
                                value={skills}
                                onChangeText={setSkills}
                                placeholder="React, Node.js, Python, Design"
                            />

                            <Text style={styles.fieldLabel}>Availability</Text>
                            <View style={styles.availabilityOptions}>
                                {['full-time', 'part-time', 'weekends', 'consulting'].map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.availabilityChip, availability === opt && styles.availabilityChipActive]}
                                        onPress={() => setAvailability(opt)}
                                    >
                                        <Text style={[styles.availabilityText, availability === opt && styles.availabilityTextActive]}>
                                            {opt}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <CheckboxOption
                                label="🔍 Looking for a project"
                                value={lookingForProject}
                                onToggle={() => setLookingForProject(!lookingForProject)}
                                description="Show founders you're available"
                            />
                        </>
                    )}

                    {/* Investor-specific fields */}
                    {user?.accountType === 'INVESTOR' && (
                        <>
                            <Text style={styles.sectionTitle}>Investor Profile</Text>

                            <TextInput
                                label="Firm"
                                value={firm}
                                onChangeText={setFirm}
                                placeholder="Your fund or firm name"
                            />

                            <TextInput
                                label="Title"
                                value={investorTitle}
                                onChangeText={setInvestorTitle}
                                placeholder="e.g., Partner, Principal"
                            />

                            <TextInput
                                label="Investment Thesis"
                                value={thesis}
                                onChangeText={setThesis}
                                placeholder="What types of companies do you invest in?"
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.sectionTitle}>Privacy</Text>

                            <CheckboxOption
                                label="🌍 Public Profile"
                                value={isPublicMode}
                                onToggle={() => setIsPublicMode(!isPublicMode)}
                                description="Founders can see your profile details"
                            />

                            {!isPublicMode && (
                                <View style={styles.privateNote}>
                                    <Ionicons name="information-circle" size={20} color={colors.warning.main} />
                                    <Text style={styles.privateNoteText}>
                                        In stealth mode, your profile is hidden until you engage with a founder.
                                    </Text>
                                </View>
                            )}
                        </>
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
    saveButton: {
        ...typography.styles.bodyMedium,
        color: colors.primary[500],
    },
    saveButtonDisabled: {
        color: colors.text.tertiary,
    },
    content: {
        padding: spacing[4],
    },
    avatarSection: {
        alignSelf: 'center',
        marginBottom: spacing[6],
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.background.primary,
    },
    sectionTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginTop: spacing[6],
        marginBottom: spacing[3],
    },
    fieldLabel: {
        ...typography.styles.small,
        color: colors.text.secondary,
        marginBottom: spacing[2],
    },
    checkboxOption: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.background.tertiary,
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        marginBottom: spacing[2],
    },
    checkboxContent: {
        marginLeft: spacing[3],
        flex: 1,
    },
    checkboxLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    checkboxDesc: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
    },
    availabilityOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
        marginBottom: spacing[4],
    },
    availabilityChip: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
        backgroundColor: colors.background.tertiary,
    },
    availabilityChipActive: {
        backgroundColor: colors.primary[500],
    },
    availabilityText: {
        ...typography.styles.small,
        color: colors.text.secondary,
        textTransform: 'capitalize',
    },
    availabilityTextActive: {
        color: colors.white,
    },
    privateNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.warning.main + '15',
        padding: spacing[3],
        borderRadius: borderRadius.lg,
        gap: spacing[2],
    },
    privateNoteText: {
        ...typography.styles.small,
        color: colors.text.secondary,
        flex: 1,
    },
});

export default EditProfileScreen;
