import { create } from 'zustand';
import api, { usersAPI } from '../services/api';

export const useUserStore = create((set, get) => ({
    // State
    profiles: {},
    following: [],
    followers: [],
    isLoading: false,
    error: null,

    // Actions
    fetchProfile: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await usersAPI.getProfile(userId);
            const profile = response.data.user;

            set((state) => ({
                profiles: { ...state.profiles, [userId]: profile },
                isLoading: false
            }));

            return { success: true, profile };
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error || 'Failed to fetch profile' });
            return { success: false, error: error.response?.data?.error };
        }
    },

    updateProfile: async (updates) => {
        set({ isLoading: true, error: null });
        try {
            const response = await usersAPI.updateProfile(updates);
            const profile = response.data.user;

            set((state) => ({
                profiles: { ...state.profiles, [profile.id]: profile },
                isLoading: false
            }));

            return { success: true, profile };
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error || 'Failed to update profile' });
            return { success: false, error: error.response?.data?.error };
        }
    },

    follow: async (userId) => {
        try {
            await usersAPI.follow(userId);
            set((state) => ({
                following: [...state.following, userId]
            }));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    unfollow: async (userId) => {
        try {
            await usersAPI.unfollow(userId);
            set((state) => ({
                following: state.following.filter(id => id !== userId)
            }));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    isFollowing: (userId) => {
        return get().following.includes(userId);
    },

    switchAccountType: async (newType) => {
        set({ isLoading: true, error: null });
        try {
            const response = await usersAPI.switchAccountType(newType);
            return { success: true, user: response.data.user };
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error || 'Failed to switch account type' });
            return { success: false, error: error.response?.data?.error };
        }
    },

    clearError: () => set({ error: null }),
}));
