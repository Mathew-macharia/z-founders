import { create } from 'zustand';
import { messagesAPI, expressInterestAPI } from '../services/api';

export const useMessageStore = create((set, get) => ({
    // State
    conversations: [],
    currentConversation: null,
    messages: [],
    interests: [],
    isLoading: false,
    error: null,

    // Actions
    fetchConversations: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await messagesAPI.getConversations();
            set({
                conversations: response.data.conversations || [],
                isLoading: false
            });
            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error || 'Failed to fetch conversations' });
            return { success: false };
        }
    },

    fetchConversation: async (conversationId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await messagesAPI.getConversation(conversationId);
            set({
                currentConversation: response.data.conversation,
                messages: response.data.messages || [],
                isLoading: false
            });
            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error || 'Failed to fetch conversation' });
            return { success: false };
        }
    },

    sendMessage: async (conversationId, content) => {
        try {
            const response = await messagesAPI.sendMessage(conversationId, { content });
            const newMessage = response.data.message;

            set((state) => ({
                messages: [...state.messages, newMessage]
            }));

            return { success: true, message: newMessage };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    startConversation: async (userId) => {
        try {
            const response = await messagesAPI.startConversation(userId);
            return { success: true, conversation: response.data.conversation };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    acceptRequest: async (conversationId) => {
        try {
            await messagesAPI.acceptRequest(conversationId);
            set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === conversationId ? { ...c, status: 'ACTIVE' } : c
                )
            }));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    // Express Interest
    fetchReceivedInterests: async () => {
        try {
            const response = await expressInterestAPI.getReceived();
            set({ interests: response.data.interests || [] });
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    },

    sendInterest: async (founderId, videoId, message) => {
        try {
            const response = await expressInterestAPI.send({
                founderId,
                videoId,
                message
            });
            return { success: true, interest: response.data.interest };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    respondToInterest: async (interestId, accept, message) => {
        try {
            const response = await expressInterestAPI.respond(interestId, { accept, message });

            set((state) => ({
                interests: state.interests.filter(i => i.id !== interestId)
            }));

            return {
                success: true,
                conversationId: response.data.conversationId
            };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    clearMessages: () => set({ messages: [], currentConversation: null }),
    clearError: () => set({ error: null }),
}));
