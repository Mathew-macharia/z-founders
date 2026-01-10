import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useVideoStore } from '../../store/videoStore';
import Button from '../../components/common/Button';
import TextInput from '../../components/common/TextInput';

const { width, height } = Dimensions.get('window');
const MAX_DURATION = 90; // 90 seconds max

const VIDEO_TYPES = [
    { id: 'PITCH', label: '📍 Pitch', description: 'Your main startup pitch' },
    { id: 'UPDATE', label: '📈 Update', description: 'Share progress & milestones' },
    { id: 'ASK', label: '🙋 Ask', description: 'Request help or advice' },
    { id: 'WIN_LOSS', label: '🎯 Win/Loss', description: 'Celebrate or share learnings' },
];

const VISIBILITY_OPTIONS = [
    { id: 'PUBLIC', label: '🌍 Public', description: 'Everyone can see' },
    { id: 'COMMUNITY', label: '👥 Community', description: 'Founders & Builders only' },
    { id: 'INVESTORS_ONLY', label: '💼 Investors Only', description: 'Verified investors only' },
];

const RecordScreen = ({ navigation }) => {
    const { user } = useAuthStore();
    const { uploadVideo, isLoading } = useVideoStore();

    const cameraRef = useRef(null);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
    const [cameraType, setCameraType] = useState('front');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordedVideo, setRecordedVideo] = useState(null);

    // Upload form state
    const [step, setStep] = useState('record'); // record, preview, details
    const [videoType, setVideoType] = useState('UPDATE');
    const [visibility, setVisibility] = useState('PUBLIC');
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        requestPermissions();
    }, []);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration(prev => {
                    if (prev >= MAX_DURATION) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const requestPermissions = async () => {
        if (!cameraPermission?.granted) {
            await requestCameraPermission();
        }
        if (!microphonePermission?.granted) {
            await requestMicrophonePermission();
        }
    };

    const startRecording = async () => {
        if (!cameraRef.current) return;

        try {
            setIsRecording(true);
            setRecordingDuration(0);
            const video = await cameraRef.current.recordAsync({
                maxDuration: MAX_DURATION,
                quality: '720p',
            });
            setRecordedVideo(video);
            setStep('preview');
        } catch (error) {
            console.error('Recording failed:', error);
            Alert.alert('Error', 'Failed to record video');
        }
        setIsRecording(false);
    };

    const stopRecording = async () => {
        if (cameraRef.current && isRecording) {
            cameraRef.current.stopRecording();
        }
    };

    const pickVideo = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                aspect: [9, 16],
                quality: 1,
                videoMaxDuration: MAX_DURATION,
            });

            if (!result.canceled && result.assets[0]) {
                setRecordedVideo({ uri: result.assets[0].uri });
                setStep('preview');
            }
        } catch (error) {
            console.error('Pick video failed:', error);
        }
    };

    const retakeVideo = () => {
        setRecordedVideo(null);
        setStep('record');
        setRecordingDuration(0);
    };

    const handleUpload = async () => {
        if (!recordedVideo) return;

        // In production, upload to S3/Cloudflare first
        const videoUrl = recordedVideo.uri;

        const result = await uploadVideo({
            videoUrl,
            thumbnailUrl: null, // Generate thumbnail in production
            type: videoType,
            visibility,
            caption,
            duration: recordingDuration || 30,
            tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t),
            isPinned: isPinned && videoType === 'PITCH'
        });

        if (result.success) {
            Alert.alert('Success!', 'Your video has been uploaded', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } else {
            Alert.alert('Error', result.error || 'Upload failed');
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const canPostType = (type) => {
        if (type === 'PITCH') return user?.accountType === 'FOUNDER';
        return true;
    };

    if (!cameraPermission || !microphonePermission) {
        // Still loading permissions
        return (
            <View style={styles.permissionContainer}>
                <ActivityIndicator color={colors.primary[500]} size="large" />
            </View>
        );
    }

    if (!cameraPermission.granted || !microphonePermission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Ionicons name="videocam-off" size={64} color={colors.text.tertiary} />
                <Text style={styles.permissionTitle}>Camera Access Required</Text>
                <Text style={styles.permissionText}>
                    Please enable camera and microphone access in settings
                </Text>
                <Button title="Open Settings" onPress={requestPermissions} />
            </View>
        );
    }

    // Details step
    if (step === 'details') {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => setStep('preview')}>
                                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Post Details</Text>
                            <TouchableOpacity onPress={handleUpload}>
                                <Text style={styles.nextButton}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.detailsContent}
                            contentContainerStyle={styles.detailsScrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Video Type */}
                            <Text style={styles.sectionLabel}>What type of content is this?</Text>
                            <View style={styles.typeOptions}>
                                {VIDEO_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type.id}
                                        style={[
                                            styles.typeOption,
                                            videoType === type.id && styles.typeOptionActive,
                                            !canPostType(type.id) && styles.typeOptionDisabled
                                        ]}
                                        onPress={() => canPostType(type.id) && setVideoType(type.id)}
                                        disabled={!canPostType(type.id)}
                                    >
                                        <Text style={[
                                            styles.typeOptionLabel,
                                            videoType === type.id && styles.typeOptionLabelActive
                                        ]}>
                                            {type.label}
                                        </Text>
                                        <Text style={styles.typeOptionDesc}>{type.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Visibility */}
                            <Text style={styles.sectionLabel}>Who can see this?</Text>
                            <View style={styles.visibilityOptions}>
                                {VISIBILITY_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        style={[
                                            styles.visibilityOption,
                                            visibility === opt.id && styles.visibilityOptionActive
                                        ]}
                                        onPress={() => setVisibility(opt.id)}
                                    >
                                        <Text style={[
                                            styles.visibilityLabel,
                                            visibility === opt.id && styles.visibilityLabelActive
                                        ]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Caption */}
                            <TextInput
                                label="Caption"
                                value={caption}
                                onChangeText={setCaption}
                                placeholder="What's this video about?"
                                multiline
                                numberOfLines={3}
                                maxLength={500}
                            />

                            {/* Tags */}
                            <TextInput
                                label="Tags (comma-separated)"
                                value={tags}
                                onChangeText={setTags}
                                placeholder="fintech, ai, saas"
                            />

                            {/* Pin option for pitches */}
                            {videoType === 'PITCH' && user?.accountType === 'FOUNDER' && (
                                <TouchableOpacity
                                    style={styles.pinOption}
                                    onPress={() => setIsPinned(!isPinned)}
                                >
                                    <Ionicons
                                        name={isPinned ? "checkbox" : "square-outline"}
                                        size={24}
                                        color={colors.primary[500]}
                                    />
                                    <View style={styles.pinOptionText}>
                                        <Text style={styles.pinLabel}>Pin as main pitch</Text>
                                        <Text style={styles.pinDesc}>This will be shown first on your profile</Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            <Button
                                title="Post Video"
                                onPress={handleUpload}
                                loading={isLoading}
                                fullWidth
                                style={styles.uploadButton}
                            />
                        </ScrollView>
                    </SafeAreaView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        );
    }

    // Preview step
    if (step === 'preview' && recordedVideo) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={retakeVideo}>
                            <Ionicons name="close" size={28} color={colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Preview</Text>
                        <TouchableOpacity onPress={() => setStep('details')}>
                            <Text style={styles.nextButton}>Next</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.previewContainer}>
                        <Video
                            source={{ uri: recordedVideo.uri }}
                            style={styles.previewVideo}
                            resizeMode={ResizeMode.COVER}
                            shouldPlay
                            isLooping
                            useNativeControls
                        />
                    </View>

                    <View style={styles.previewActions}>
                        <Button
                            title="Retake"
                            variant="outline"
                            onPress={retakeVideo}
                            icon={<Ionicons name="refresh" size={20} color={colors.primary[500]} />}
                        />
                        <Button
                            title="Continue"
                            onPress={() => setStep('details')}
                            icon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
                            iconPosition="right"
                        />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // Record step
    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={cameraType}
                mode="video"
            />
            <SafeAreaView style={styles.cameraOverlay}>
                {/* Header */}
                <View style={styles.cameraHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={28} color={colors.white} />
                    </TouchableOpacity>

                    {isRecording && (
                        <View style={styles.recordingIndicator}>
                            <View style={styles.recordingDot} />
                            <Text style={styles.recordingTime}>
                                {formatDuration(recordingDuration)} / {formatDuration(MAX_DURATION)}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => setCameraType(
                            cameraType === 'front' ? 'back' : 'front'
                        )}
                    >
                        <Ionicons name="camera-reverse" size={28} color={colors.white} />
                    </TouchableOpacity>
                </View>

                {/* Progress bar */}
                {isRecording && (
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${(recordingDuration / MAX_DURATION) * 100}%` }
                            ]}
                        />
                    </View>
                )}

                {/* Controls */}
                <View style={styles.cameraControls}>
                    <TouchableOpacity style={styles.galleryButton} onPress={pickVideo}>
                        <Ionicons name="images" size={28} color={colors.white} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.recordButton}
                        onPress={isRecording ? stopRecording : startRecording}
                    >
                        <LinearGradient
                            colors={isRecording ? [colors.error.main, colors.error.dark] : [colors.white, colors.white]}
                            style={styles.recordButtonInner}
                        >
                            {isRecording ? (
                                <View style={styles.stopIcon} />
                            ) : null}
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ width: 50 }} />
                </View>

                {/* Tips */}
                {!isRecording && (
                    <View style={styles.tips}>
                        <Text style={styles.tipText}>💡 Tips for a great pitch:</Text>
                        <Text style={styles.tipText}>• Keep it under 90 seconds</Text>
                        <Text style={styles.tipText}>• State the problem & solution clearly</Text>
                        <Text style={styles.tipText}>• Show your personality!</Text>
                    </View>
                )}
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
    permissionContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[6],
    },
    permissionTitle: {
        ...typography.styles.h4,
        color: colors.text.primary,
        marginTop: spacing[4],
        marginBottom: spacing[2],
    },
    permissionText: {
        ...typography.styles.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing[6],
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
    nextButton: {
        ...typography.styles.bodyMedium,
        color: colors.primary[500],
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing[4],
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: borderRadius.full,
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.error.main,
        marginRight: spacing[2],
    },
    recordingTime: {
        ...typography.styles.small,
        color: colors.white,
        fontFamily: typography.fontFamily.semiBold,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: spacing[4],
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary[500],
    },
    cameraControls: {
        position: 'absolute',
        bottom: spacing[10],
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    galleryButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: colors.white,
        padding: 4,
    },
    recordButtonInner: {
        flex: 1,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopIcon: {
        width: 28,
        height: 28,
        borderRadius: 4,
        backgroundColor: colors.white,
    },
    tips: {
        position: 'absolute',
        bottom: spacing[24],
        left: spacing[6],
        right: spacing[6],
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: spacing[4],
        borderRadius: borderRadius.lg,
    },
    tipText: {
        ...typography.styles.small,
        color: colors.white,
        marginBottom: spacing[1],
    },
    previewContainer: {
        flex: 1,
        backgroundColor: colors.black,
    },
    previewVideo: {
        flex: 1,
    },
    previewActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: spacing[6],
        paddingHorizontal: spacing[4],
    },
    detailsContent: {
        flex: 1,
    },
    detailsScrollContent: {
        padding: spacing[4],
        paddingBottom: spacing[24], // Extra padding for bottom button/safe area
    },
    sectionLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
        marginBottom: spacing[3],
        marginTop: spacing[4],
    },
    typeOptions: {
        gap: spacing[2],
    },
    typeOption: {
        backgroundColor: colors.background.tertiary,
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeOptionActive: {
        borderColor: colors.primary[500],
        backgroundColor: colors.primary[500] + '15',
    },
    typeOptionDisabled: {
        opacity: 0.4,
    },
    typeOptionLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    typeOptionLabelActive: {
        color: colors.primary[500],
    },
    typeOptionDesc: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
    },
    visibilityOptions: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    visibilityOption: {
        flex: 1,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[2],
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    visibilityOptionActive: {
        borderColor: colors.primary[500],
        backgroundColor: colors.primary[500] + '15',
    },
    visibilityLabel: {
        ...typography.styles.small,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    visibilityLabelActive: {
        color: colors.primary[500],
    },
    pinOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.tertiary,
        padding: spacing[4],
        borderRadius: borderRadius.lg,
        marginTop: spacing[4],
    },
    pinOptionText: {
        marginLeft: spacing[3],
    },
    pinLabel: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    pinDesc: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
    },
    uploadButton: {
        marginTop: spacing[6],
    },
});

export default RecordScreen;
