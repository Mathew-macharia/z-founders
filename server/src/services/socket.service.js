const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

class SocketService {
    constructor() {
        this.io = null;
    }

    initialize(server) {
        this.io = socketIo(server, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        // Middleware for authentication
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.id;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`🔌 User connected: ${socket.userId}`);

            // Join user to their own private room
            socket.join(socket.userId);

            socket.on('disconnect', () => {
                console.log(`🔌 User disconnected: ${socket.userId}`);
            });
        });

        console.log('✅ Socket.io initialized');
    }

    // Send notification to specific user
    emitNotification(userId, notification) {
        if (!this.io) return;
        this.io.to(userId).emit('notification', notification);
    }
}

module.exports = new SocketService();
