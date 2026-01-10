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
import { colors, typography, spacing, borderRadius } from '../../theme';
import { expressInterestAPI } from '../../services/api';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';

const ExpressInterestScreen = ({ navigation, route }) => {
    const { interestId, mode = 'view' } = route.params || {}; // view or respond

    const [interest, setInterest] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isResponding, setIsResponding] = useState(false);

    useEffect(() => {
        if (interestId) {
            loadInterest();
        }
    }, [interestId]);

    const loadInterest = async () => {
        try {
            const response = await expressInterestAPI.getReceived();
            const found = response.data.interests?.find(i => i.id === interestId);
            setInterest(found);
        } catch (error) {
            console.error('Failed to load interest:', error);
        }
        setIsLoading(false);
    };

    const handleAccept = async () => {
        setIsResponding(true);
        try {
            const response = await expressInterestAPI.respond(interestId, {
                accept: true,
                message: responseMessage || 'Thanks for reaching out! Looking forward to connecting.'
            });

            Alert.alert(
                '🎉 Connected!',
                'A new conversation has been created.',
                [
                    {
                        text: 'Open Chat',
                        onPress: () => navigation.replace('Chat', {
                            conversationId: response.data.conversationId
                        })
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to accept');
        }
        setIsResponding(false);
    };

    const handleDecline = async () => {
        Alert.alert(
            'Decline Interest',
            'Are you sure you want to decline this investor\'s interest?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await expressInterestAPI.respond(interestId, { accept: false });
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to decline');
                        }
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (!interest) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Interest not found</Text>
            </View>
        );
    }

    const investor = interest.investor;
    const isPrivate = investor?.isPrivate;
    const video = interest.video;

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Interest</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Celebration card */}
                    <View style={styles.celebrationCard}>
                        <LinearGradient
                            colors={[colors.warning.main + '30', colors.warning.main + '10']}
                            style={styles.celebrationGradient}
                        >
                            <Text style={styles.celebrationEmoji}>🎉</Text>
                            <Text style={styles.celebrationTitle}>
                                {isPrivate ? 'A verified investor' : investor?.investorProfile?.firm || 'An investor'}
                            </Text>
                            <Text style={styles.celebrationSubtitle}>
                                is interested in your pitch!
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* Investor info (if public) */}
                    {!isPrivate && investor && (
                        <View style={styles.investorCard}>
                            <View style={styles.investorHeader}>
                                <LinearGradient
                                    colors={[colors.badges.investor, colors.badges.investor + 'CC']}
                                    style={styles.investorAvatar}
                                >
                                    <Ionicons name="trending-up" size={24} color={colors.white} />
                                </LinearGradient>
                                <View style={styles.investorInfo}>
                                    <Text style={styles.investorName}>
                                        {investor.investorProfile?.firm || 'Investor'}
                                    </Text>
                                    {investor.investorProfile?.title && (
                                        <Text style={styles.investorTitle}>
                                            {investor.investorProfile.title}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="shield-checkmark" size={16} color={colors.success.main} />
                                    <Text style={styles.verifiedText}>Verified</Text>
                                </View>
                            </View>

                            {investor.investorProfile?.thesis && (
                                <View style={styles.thesisSection}>
                                    <Text style={styles.thesisLabel}>Investment Thesis</Text>
                                    <Text style={styles.thesisText}>{investor.investorProfile.thesis}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* If private investor */}
                    {isPrivate && (
                        <View style={styles.privateCard}>
                            <Ionicons name="eye-off" size={24} color={colors.text.tertiary} />
                            <Text style={styles.privateTitle}>Stealth Mode Investor</Text>
                            <Text style={styles.privateText}>
                                This investor prefers to stay private until you connect.
                                Their profile will be revealed after you accept.
                            </Text>
                        </View>
                    )}

                    {/* Video context */}
                    {video && (
                        <View style={styles.videoContext}>
                            <Text style={styles.contextLabel}>They're interested in your pitch:</Text>
                            <TouchableOpacity
                                style={styles.videoPreview}
                                onPress={() => navigation.navigate('VideoDetail', { videoId: video.id })}
                            >
                                {video.thumbnailUrl ? (
                                    <Image source={{ uri: video.thumbnailUrl }} style={styles.videoThumbnail} />
                                ) : (
                                    <View style={styles.videoPlaceholder}>
                                        <Ionicons name="play" size={24} color={colors.text.tertiary} />
                                    </View>
                                )}
                                <Text style={styles.videoCaption} numberOfLines={2}>
                                    {video.caption || 'Your pitch video'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Interest message */}
                    {interest.message && (
                        <View style={styles.messageCard}>
                            <Text style={styles.messageLabel}>Their message:</Text>
                            <Text style={styles.messageText}>"{interest.message}"</Text>
                        </View>
                    )}

                    {/* Response section */}
                    <View style={styles.responseSection}>
                        <Text style={styles.responseLabel}>Your response (optional):</Text>
                        <TextInput
                            value={responseMessage}
                            onChangeText={setResponseMessage}
                            placeholder="Thanks for your interest! I'd love to chat more about..."
                            multiline
                            numberOfLines={3}
                            maxLength={500}
                        />
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actions}>
                        <Button
                            title="Accept & Connect"
                            onPress={handleAccept}
                            loading={isResponding}
                            fullWidth
                            icon={<Ionicons name="checkmark-circle" size={20} color={colors.white} />}
                        />
                        <Button
                            title="Decline"
                            onPress={handleDecline}
                            variant="ghost"
                            fullWidth
                            style={styles.declineButton}
                            textStyle={{ color: colors.text.secondary }}
                        />
                    </View>

                    <Text style={styles.hint}>
                        💡 Accepting will create a chat with this investor
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
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        ...typography.styles.body,
        color: colors.text.secondary,
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
    celebrationCard: {
        marginBottom: spacing[4],
    },
    celebrationGradient: {
        alignItems: 'center',
        padding: spacing[6],
        borderRadius: borderRadius.xl,
    },
    celebrationEmoji: {
        fontSize: 48,
        marginBottom: spacing[3],
    },
    celebrationTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
    },
    celebrationSubtitle: {
        ...typography.styles.body,
        color: colors.text.secondary,
        marginTop: spacing[1],
    },
    investorCard: {
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        padding: spacing[4],
        marginBottom: spacing[4],
    },
    investorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    investorAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    investorInfo: {
        flex: 1,
    },
    investorName: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    investorTitle: {
        ...typography.styles.small,
        color: colors.text.secondary,
        marginTop: spacing[1],
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.success.main + '20',
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.full,
        gap: spacing[1],
    },
    verifiedText: {
        ...typography.styles.caption,
        color: colors.success.main,
    },
    thesisSection: {
        marginTop: spacing[4],
        paddingTop: spacing[4],
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    thesisLabel: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginBottom: spacing[2],
    },
    thesisText: {
        ...typography.styles.body,
        color: colors.text.secondary,
    },
    privateCard: {
        alignItems: 'center',
        backgroundColor: colors.background.secondary,
        borderRadius: borderRadius.xl,
        padding: spacing[6],
        marginBottom: spacing[4],
    },
    privateTitle: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginTop: spacing[3],
    },
    privateText: {
        ...typography.styles.small,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing[2],
    },
    videoContext: {
        marginBottom: spacing[4],
    },
    contextLabel: {
        ...typography.styles.small,
        color: colors.text.tertiary,
        marginBottom: spacing[2],
    },
    videoPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.lg,
        padding: spacing[3],
    },
    videoThumbnail: {
        width: 60,
        height: 80,
        borderRadius: borderRadius.md,
        marginRight: spacing[3],
    },
    videoPlaceholder: {
        width: 60,
        height: 80,
        borderRadius: borderRadius.md,
        backgroundColor: colors.secondary[700],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    videoCaption: {
        ...typography.styles.body,
        color: colors.text.primary,
        flex: 1,
    },
    messageCard: {
        backgroundColor: colors.primary[500] + '15',
        borderRadius: borderRadius.lg,
        padding: spacing[4],
        marginBottom: spacing[4],
        borderLeftWidth: 4,
        borderLeftColor: colors.primary[500],
    },
    messageLabel: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginBottom: spacing[2],
    },
    messageText: {
        ...typography.styles.body,
        color: colors.text.primary,
        fontStyle: 'italic',
    },
    responseSection: {
        marginBottom: spacing[4],
    },
    responseLabel: {
        ...typography.styles.small,
        color: colors.text.secondary,
        marginBottom: spacing[2],
    },
    actions: {
        gap: spacing[2],
    },
    declineButton: {
        marginTop: spacing[1],
    },
    hint: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        textAlign: 'center',
        marginTop: spacing[4],
    },
});

export default ExpressInterestScreen;
