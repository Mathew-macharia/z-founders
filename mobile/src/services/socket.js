import io from 'socket.io-client';


class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
    }

    connect(token) {
        if (this.socket && this.isConnected) return;

        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

        // Remove /api suffix if present, as socket.io connects to root
        const baseUrl = API_URL.replace(/\/api$/, '');

        this.socket = io(baseUrl, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            this.isConnected = false;
        });

        this.socket.on('notification', (data) => {
            console.log('🔔 Notification received:', data);
            this.notifyListeners('notification', data);
        });

        this.socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Subscribe to events
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => {
            if (this.listeners.has(event)) {
                this.listeners.get(event).delete(callback);
            }
        };
    }

    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
}

export default new SocketService();
