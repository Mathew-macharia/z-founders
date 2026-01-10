import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Token is set via setAuthToken
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle common errors
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    // Token expired or invalid - logout will be handled by auth store
                    break;
                case 403:
                    console.error('Access denied:', data.error);
                    break;
                case 429:
                    console.error('Rate limit exceeded');
                    break;
                case 500:
                    console.error('Server error');
                    break;
            }
        } else if (error.request) {
            console.error('Network error - no response received');
        }

        return Promise.reject(error);
    }
);

// Set auth token
api.setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

export default api;

// API helper functions for specific endpoints
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
};

export const usersAPI = {
    getUser: (id) => api.get(`/users/${id}`),
    updateUser: (id, data) => api.patch(`/users/${id}`, data),
    follow: (id) => api.post(`/users/${id}/follow`),
    unfollow: (id) => api.delete(`/users/${id}/follow`),
    getFollowers: (id, params) => api.get(`/users/${id}/followers`, { params }),
    getFollowing: (id, params) => api.get(`/users/${id}/following`, { params }),
};

export const videosAPI = {
    upload: (data) => api.post('/videos', data),
    get: (id) => api.get(`/videos/${id}`),
    update: (id, data) => api.patch(`/videos/${id}`, data),
    delete: (id) => api.delete(`/videos/${id}`),
    pin: (id) => api.post(`/videos/${id}/pin`),
    like: (id) => api.post(`/videos/${id}/like`),
    unlike: (id) => api.delete(`/videos/${id}/like`),
    save: (id) => api.post(`/videos/${id}/save`),
    unsave: (id) => api.delete(`/videos/${id}/save`),
    comment: (id, data) => api.post(`/videos/${id}/comment`, data),
    getComments: (id, params) => api.get(`/videos/${id}/comments`, { params }),
    getAnalytics: (id) => api.get(`/videos/${id}/analytics`),
};

export const feedAPI = {
    home: (params) => api.get('/feed/home', { params }),
    pitches: (params) => api.get('/feed/pitches', { params }),
    following: (params) => api.get('/feed/following', { params }),
    trending: (params) => api.get('/feed/trending', { params }),
    forYou: (params) => api.get('/feed/for-you', { params }),
};

export const messagesAPI = {
    getConversations: (params) => api.get('/conversations', { params }),
    getRequests: () => api.get('/conversations/requests'),
    getConversation: (id, params) => api.get(`/conversations/${id}`, { params }),
    sendMessage: (id, data) => api.post(`/conversations/${id}/messages`, data),
    startConversation: (data) => api.post('/messages', data),
    acceptRequest: (id) => api.patch(`/conversations/${id}/accept`),
    declineRequest: (id) => api.patch(`/conversations/${id}/decline`),
};

export const expressInterestAPI = {
    send: (data) => api.post('/express-interest', data),
    getReceived: (params) => api.get('/express-interest', { params }),
    getSent: () => api.get('/express-interest/sent'),
    respond: (id, action) => api.patch(`/express-interest/${id}`, { action }),
};

export const searchAPI = {
    quick: (params) => api.get('/search', { params }),
    advanced: (params) => api.get('/search/advanced', { params }),
    history: () => api.get('/search/history'),
    clearHistory: () => api.delete('/search/history'),
};

export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
    getPreferences: () => api.get('/notifications/preferences'),
    updatePreferences: (data) => api.patch('/notifications/preferences', data),
};

export const subscriptionsAPI = {
    getPlans: () => api.get('/subscriptions/plans'),
    getStatus: () => api.get('/subscriptions/status'),
    subscribe: (data) => api.post('/subscriptions', data),
    cancel: () => api.delete('/subscriptions'),
};
