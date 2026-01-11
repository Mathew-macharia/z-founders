import { create } from 'zustand';
import api from '../services/api';

export const useVideoStore = create((set, get) => ({
    videos: [],
    currentVideo: null,
    isLoading: false,
    error: null,
    pagination: {
        page: 1,
        hasMore: true,
    },

    // Fetch videos for feed
    fetchFeed: async (feedType = 'home', page = 1, filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const params = { page, limit: 20, ...filters };
            const response = await api.get(`/feed/${feedType}`, { params });

            const newVideos = response.data.videos;

            set(state => ({
                videos: page === 1 ? newVideos : [...state.videos, ...newVideos],
                pagination: {
                    page,
                    hasMore: response.data.hasMore,
                },
                isLoading: false,
            }));

            return { success: true };
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error || 'Failed to load feed' });
            return { success: false };
        }
    },

    // Fetch single video
    fetchVideo: async (videoId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/videos/${videoId}`);
            set({ currentVideo: response.data, isLoading: false });
            return { success: true, video: response.data };
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error });
            return { success: false };
        }
    },

    // Upload video
    uploadVideo: async (videoData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/videos', videoData);
            // Add new video to beginning of local videos array
            set(state => ({
                isLoading: false,
                videos: [response.data.video, ...state.videos]
            }));
            return { success: true, video: response.data.video };
        } catch (error) {
            set({ isLoading: false, error: error.response?.data?.error });
            return { success: false, error: error.response?.data?.error };
        }
    },

    // Like/unlike video
    toggleLike: async (videoId, isLiked) => {
        try {
            if (isLiked) {
                await api.delete(`/videos/${videoId}/like`);
            } else {
                await api.post(`/videos/${videoId}/like`);
            }

            // Update local state
            set(state => ({
                videos: state.videos.map(v =>
                    v.id === videoId
                        ? {
                            ...v,
                            isLiked: !isLiked,
                            likeCount: isLiked ? v.likeCount - 1 : v.likeCount + 1
                        }
                        : v
                ),
                currentVideo: state.currentVideo?.id === videoId
                    ? {
                        ...state.currentVideo,
                        isLiked: !isLiked,
                        video: {
                            ...state.currentVideo.video,
                            likeCount: isLiked
                                ? state.currentVideo.video.likeCount - 1
                                : state.currentVideo.video.likeCount + 1
                        }
                    }
                    : state.currentVideo
            }));

            return { success: true };
        } catch (error) {
            return { success: false };
        }
    },

    // Save/unsave video
    toggleSave: async (videoId, isSaved) => {
        try {
            if (isSaved) {
                await api.delete(`/videos/${videoId}/save`);
            } else {
                await api.post(`/videos/${videoId}/save`);
            }

            set(state => ({
                videos: state.videos.map(v =>
                    v.id === videoId ? { ...v, isSaved: !isSaved } : v
                ),
                currentVideo: state.currentVideo?.id === videoId
                    ? { ...state.currentVideo, isSaved: !isSaved }
                    : state.currentVideo
            }));

            return { success: true };
        } catch (error) {
            return { success: false };
        }
    },

    // Pin video
    pinVideo: async (videoId) => {
        try {
            await api.post(`/videos/${videoId}/pin`);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    // Delete video
    deleteVideo: async (videoId) => {
        try {
            await api.delete(`/videos/${videoId}`);
            set(state => ({
                videos: state.videos.filter(v => v.id !== videoId)
            }));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    // Fetch analytics
    fetchAnalytics: async (videoId) => {
        try {
            const response = await api.get(`/videos/${videoId}/analytics`);
            return { success: true, analytics: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error };
        }
    },

    // Clear videos
    clearVideos: () => set({ videos: [], pagination: { page: 1, hasMore: true } }),

    // Clear error
    clearError: () => set({ error: null }),
}));
