require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const videoRoutes = require('./routes/video.routes');
const feedRoutes = require('./routes/feed.routes');
const messageRoutes = require('./routes/message.routes');
const searchRoutes = require('./routes/search.routes');
const notificationRoutes = require('./routes/notification.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const moderationRoutes = require('./routes/moderation.routes');

// Import middleware
const { errorHandler } = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/logger.middleware');

// Import services
const socketService = require('./services/socket.service');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketService.initialize(server);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/express-interest', require('./routes/expressInterest.routes'));
app.use('/api/reports', require('./routes/report.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Z Founders API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.io enabled`);
});

module.exports = app;
