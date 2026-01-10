import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,

    // Initialize auth state from storage
    initialize: async () => {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            const userData = await SecureStore.getItemAsync(USER_KEY);

            if (token && userData) {
                const user = JSON.parse(userData);
                api.setAuthToken(token);
                set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false
                });

                // Refresh user data from server
                try {
                    const response = await api.get('/auth/me');
                    set({ user: response.data.user });
                    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data.user));
                } catch (error) {
                    // Token might be expired
                    if (error.response?.status === 401) {
                        await get().logout();
                    }
                }
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ isLoading: false, error: error.message });
        }
    },

    // Register new user
    register: async (email, password, accountType) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/register', {
                email,
                password,
                accountType,
            });

            const { token, user, requiresVerification } = response.data;

            api.setAuthToken(token);
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

            set({
                token,
                user,
                isAuthenticated: true,
                isLoading: false,
            });

            return { success: true, requiresVerification };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Registration failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    },

    // Login existing user
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            const { token, user } = response.data;

            api.setAuthToken(token);
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

            set({
                token,
                user,
                isAuthenticated: true,
                isLoading: false,
            });

            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Login failed';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    },

    // Logout
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Ignore logout errors
        }

        api.setAuthToken(null);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);

        set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
        });
    },

    // Update user data
    updateUser: async (updates) => {
        try {
            const response = await api.patch(`/users/${get().user.id}`, updates);
            const updatedUser = response.data.user;

            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
            set({ user: updatedUser });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Update failed' };
        }
    },

    // Switch account type
    switchAccountType: async (newType) => {
        try {
            const response = await api.post('/users/switch-type', { newType });

            // Refresh user data
            const userResponse = await api.get('/auth/me');
            const updatedUser = userResponse.data.user;

            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
            set({ user: updatedUser });

            return {
                success: true,
                requiresVerification: response.data.requiresVerification
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Switch failed'
            };
        }
    },

    // Clear error
    clearError: () => set({ error: null }),
}));
