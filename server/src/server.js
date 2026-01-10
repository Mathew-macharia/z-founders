require('dotenv').config();
const express = require('express');
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 Z Founders API Server                               ║
║                                                          ║
║   Server running on port ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║                                                          ║
║   Endpoints:                                             ║
║   - POST /api/auth/register                              ║
║   - POST /api/auth/login                                 ║
║   - GET  /api/users/:id                                  ║
║   - GET  /api/videos                                     ║
║   - GET  /api/feed/:type                                 ║
║   - GET  /api/messages                                   ║
║   - POST /api/express-interest                           ║
║   - GET  /api/search                                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

module.exports = server;
