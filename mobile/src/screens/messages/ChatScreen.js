import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput as RNTextInput,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { messagesAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const ChatScreen = ({ navigation, route }) => {
    const { conversationId } = route.params || {};
    const { user } = useAuthStore();
    const flatListRef = useRef(null);

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        loadConversation();
        const interval = setInterval(loadConversation, 5000); // Poll for new messages
        return () => clearInterval(interval);
    }, [conversationId]);

    const loadConversation = async () => {
        try {
            const response = await messagesAPI.getConversation(conversationId);
            setConversation(response.data.conversation);
            setMessages(response.data.messages || []);
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
        setIsLoading(false);
    };

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const response = await messagesAPI.sendMessage(conversationId, {
                content: newMessage.trim()
            });
            setMessages([...messages, response.data.message]);
            setNewMessage('');
            flatListRef.current?.scrollToEnd({ animated: true });
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to send message');
        }
        setIsSending(false);
    };

    const getOtherParticipant = () => {
        if (!conversation) return null;
        return conversation.participant1Id === user.id
            ? conversation.participant2
            : conversation.participant1;
    };

    const otherParticipant = getOtherParticipant();
    const isPrivate = otherParticipant?.isPrivate;

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString();
    };

    const renderMessage = ({ item, index }) => {
        const isOwn = item.senderId === user.id;
        const showDate = index === 0 ||
            formatDate(item.createdAt) !== formatDate(messages[index - 1].createdAt);

        return (
            <>
                {showDate && (
                    <View style={styles.dateHeader}>
                        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    </View>
                )}
                <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
                    <View style={[
                        styles.messageBubble,
                        isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther
                    ]}>
                        <Text style={[
                            styles.messageText,
                            isOwn && styles.messageTextOwn
                        ]}>
                            {item.content}
                        </Text>
                        <Text style={[
                            styles.messageTime,
                            isOwn && styles.messageTimeOwn
                        ]}>
                            {formatTime(item.createdAt)}
                        </Text>
                    </View>
                </View>
            </>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.headerUser}
                        onPress={() => !isPrivate && navigation.navigate('Profile', { userId: otherParticipant?.id })}
                    >
                        {isPrivate ? (
                            <View style={styles.privateAvatar}>
                                <Ionicons name="person" size={20} color={colors.text.tertiary} />
                            </View>
                        ) : otherParticipant?.profile?.avatar ? (
                            <Image
                                source={{ uri: otherParticipant.profile.avatar }}
                                style={styles.avatar}
                            />
                        ) : (
                            <LinearGradient
                                colors={[colors.primary[500], colors.primary[600]]}
                                style={styles.avatar}
                            >
                                <Text style={styles.avatarText}>
                                    {otherParticipant?.email?.[0]?.toUpperCase() || '?'}
                                </Text>
                            </LinearGradient>
                        )}

                        <View style={styles.headerInfo}>
                            <Text style={styles.headerName}>
                                {isPrivate ? 'Private Investor' : (
                                    otherParticipant?.profile?.bio?.split('\n')[0] ||
                                    otherParticipant?.email?.split('@')[0]
                                )}
                            </Text>
                            {otherParticipant?.accountType && (
                                <Text style={styles.headerType}>
                                    {otherParticipant.accountType.charAt(0) + otherParticipant.accountType.slice(1).toLowerCase()}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={48} color={colors.text.tertiary} />
                            <Text style={styles.emptyText}>Start the conversation!</Text>
                        </View>
                    }
                />

                {/* Input */}
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.inputContainer}>
                        <RNTextInput
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Type a message..."
                            placeholderTextColor={colors.text.tertiary}
                            style={styles.input}
                            multiline
                            maxLength={1000}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            style={[styles.sendButton, (!newMessage.trim() || isSending) && styles.sendButtonDisabled]}
                            disabled={!newMessage.trim() || isSending}
                        >
                            <Ionicons
                                name="send"
                                size={20}
                                color={newMessage.trim() && !isSending ? colors.white : colors.text.tertiary}
                            />
                        </TouchableOpacity>
                    </View>
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
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
    },
    backButton: {
        marginRight: spacing[3],
    },
    headerUser: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    avatarText: {
        ...typography.styles.bodyMedium,
        color: colors.white,
    },
    privateAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing[3],
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        ...typography.styles.bodyMedium,
        color: colors.text.primary,
    },
    headerType: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
    },
    moreButton: {
        padding: spacing[2],
    },
    messagesList: {
        padding: spacing[4],
        flexGrow: 1,
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: spacing[4],
    },
    dateText: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        backgroundColor: colors.background.secondary,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: borderRadius.full,
    },
    messageRow: {
        marginBottom: spacing[2],
        maxWidth: '80%',
    },
    messageRowOwn: {
        alignSelf: 'flex-end',
    },
    messageBubble: {
        padding: spacing[3],
        borderRadius: borderRadius.lg,
    },
    messageBubbleOwn: {
        backgroundColor: colors.primary[500],
        borderBottomRightRadius: 4,
    },
    messageBubbleOther: {
        backgroundColor: colors.background.tertiary,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        ...typography.styles.body,
        color: colors.text.primary,
    },
    messageTextOwn: {
        color: colors.white,
    },
    messageTime: {
        ...typography.styles.caption,
        color: colors.text.tertiary,
        marginTop: spacing[1],
        alignSelf: 'flex-end',
    },
    messageTimeOwn: {
        color: 'rgba(255,255,255,0.7)',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing[20],
    },
    emptyText: {
        ...typography.styles.body,
        color: colors.text.tertiary,
        marginTop: spacing[3],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: spacing[4],
        backgroundColor: colors.background.secondary,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
    },
    input: {
        flex: 1,
        ...typography.styles.body,
        color: colors.text.primary,
        backgroundColor: colors.background.tertiary,
        borderRadius: borderRadius.xl,
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        marginRight: spacing[2],
        maxHeight: 120,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary[500],
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: colors.background.tertiary,
    },
});

export default ChatScreen;
