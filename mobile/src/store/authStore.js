import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const LINKED_ACCOUNTS_KEY = 'linked_accounts';

export const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
    linkedAccounts: [], // Array of {id, email, avatar, accountType, token}

    // Initialize auth state from storage
    initialize: async () => {
        try {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);
            const userData = await SecureStore.getItemAsync(USER_KEY);
            const linkedAccountsData = await SecureStore.getItemAsync(LINKED_ACCOUNTS_KEY);

            const linkedAccounts = linkedAccountsData ? JSON.parse(linkedAccountsData) : [];

            if (token && userData) {
                const user = JSON.parse(userData);
                api.setAuthToken(token);
                set({
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    linkedAccounts
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
                set({ isLoading: false, linkedAccounts });
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

            // Add to linked accounts
            await get().addToLinkedAccounts(user, token);

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

            // Add to linked accounts
            await get().addToLinkedAccounts(user, token);

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

    // Add account to linked accounts list
    addToLinkedAccounts: async (user, token) => {
        const { linkedAccounts } = get();
        const existingIndex = linkedAccounts.findIndex(acc => acc.id === user.id);

        const accountData = {
            id: user.id,
            email: user.email,
            avatar: user.profile?.avatar || null,
            accountType: user.accountType,
            token: token
        };

        let updatedAccounts;
        if (existingIndex >= 0) {
            // Update existing account
            updatedAccounts = [...linkedAccounts];
            updatedAccounts[existingIndex] = accountData;
        } else {
            // Add new account
            updatedAccounts = [...linkedAccounts, accountData];
        }

        await SecureStore.setItemAsync(LINKED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
        set({ linkedAccounts: updatedAccounts });
    },

    // Add another account via login (does NOT switch to it)
    addAccountWithCredentials: async (email, password) => {
        const { token: currentToken, linkedAccounts } = get();

        // Check if already linked
        const alreadyLinked = linkedAccounts.find(acc => acc.email === email);
        if (alreadyLinked) {
            return { success: false, error: 'This account is already linked' };
        }

        set({ isLoading: true, error: null });

        try {
            // Login to the new account
            const response = await api.post('/auth/login', { email, password });
            const { token: newToken, user: newUser } = response.data;

            // Add the new account to linked accounts
            const accountData = {
                id: newUser.id,
                email: newUser.email,
                avatar: newUser.profile?.avatar || null,
                accountType: newUser.accountType,
                token: newToken
            };

            const updatedAccounts = [...linkedAccounts, accountData];
            await SecureStore.setItemAsync(LINKED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

            // IMPORTANT: Restore the original token so current session is not affected
            api.setAuthToken(currentToken);

            set({ linkedAccounts: updatedAccounts, isLoading: false });

            return { success: true, addedAccount: accountData };
        } catch (error) {
            // Restore original token on failure
            api.setAuthToken(currentToken);

            const errorMessage = error.response?.data?.error || 'Failed to add account';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    },

    // Register a new account (does NOT switch to it)
    registerNewAccount: async (email, password, accountType) => {
        const { token: currentToken, linkedAccounts } = get();

        // Check if already linked
        const alreadyLinked = linkedAccounts.find(acc => acc.email === email);
        if (alreadyLinked) {
            return { success: false, error: 'This email is already linked' };
        }

        set({ isLoading: true, error: null });

        try {
            // Register the new account
            const response = await api.post('/auth/register', {
                email,
                password,
                accountType,
            });

            const { token: newToken, user: newUser, requiresVerification } = response.data;

            // Add the new account to linked accounts
            const accountData = {
                id: newUser.id,
                email: newUser.email,
                avatar: newUser.profile?.avatar || null,
                accountType: newUser.accountType,
                token: newToken
            };

            const updatedAccounts = [...linkedAccounts, accountData];
            await SecureStore.setItemAsync(LINKED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

            // IMPORTANT: Restore the original token so current session is not affected
            api.setAuthToken(currentToken);

            set({ linkedAccounts: updatedAccounts, isLoading: false });

            return { success: true, addedAccount: accountData, requiresVerification };
        } catch (error) {
            // Restore original token on failure
            api.setAuthToken(currentToken);

            const errorMessage = error.response?.data?.error || 'Failed to register account';
            set({ isLoading: false, error: errorMessage });
            return { success: false, error: errorMessage };
        }
    },

    // Switch to a different linked account
    switchToAccount: async (accountId) => {
        const { linkedAccounts } = get();
        const account = linkedAccounts.find(acc => acc.id === accountId);

        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        set({ isLoading: true });

        try {
            // Set the token and fetch fresh user data
            api.setAuthToken(account.token);

            const response = await api.get('/auth/me');
            const user = response.data.user;

            await SecureStore.setItemAsync(TOKEN_KEY, account.token);
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

            // Update linked account with fresh data
            await get().addToLinkedAccounts(user, account.token);

            set({
                token: account.token,
                user,
                isAuthenticated: true,
                isLoading: false,
            });

            return { success: true };
        } catch (error) {
            // Token might be expired, remove from linked accounts
            if (error.response?.status === 401) {
                await get().removeLinkedAccount(accountId);
                set({ isLoading: false });
                return { success: false, error: 'Session expired. Please log in again.' };
            }
            set({ isLoading: false });
            return { success: false, error: 'Switch failed' };
        }
    },

    // Remove account from linked accounts
    removeLinkedAccount: async (accountId) => {
        const { linkedAccounts, user } = get();
        const updatedAccounts = linkedAccounts.filter(acc => acc.id !== accountId);

        await SecureStore.setItemAsync(LINKED_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
        set({ linkedAccounts: updatedAccounts });

        // If removing current account, switch to another or log out
        if (user?.id === accountId) {
            if (updatedAccounts.length > 0) {
                await get().switchToAccount(updatedAccounts[0].id);
            } else {
                await get().logout();
            }
        }
    },

    // Logout current account (keeps linked accounts)
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

    // Full logout - clears all linked accounts
    logoutAll: async () => {
        await get().logout();
        await SecureStore.deleteItemAsync(LINKED_ACCOUNTS_KEY);
        set({ linkedAccounts: [] });
    },

    // Update user data
    updateUser: async (updates) => {
        try {
            const response = await api.patch(`/users/${get().user.id}`, updates);
            const updatedUser = response.data.user;

            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
            set({ user: updatedUser });

            // Update linked accounts with new data
            await get().addToLinkedAccounts(updatedUser, get().token);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Update failed' };
        }
    },

    // Switch account type (for Lurker upgrade)
    switchAccountType: async (newType) => {
        try {
            const response = await api.post('/users/switch-type', { newType });

            // Refresh user data
            const userResponse = await api.get('/auth/me');
            const updatedUser = userResponse.data.user;

            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
            set({ user: updatedUser });

            // Update linked accounts
            await get().addToLinkedAccounts(updatedUser, get().token);

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

