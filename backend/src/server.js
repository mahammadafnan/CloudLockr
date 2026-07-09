const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    const server = app.listen(PORT, () => {
      console.log(`[Server] CloudLockr Backend is listening on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle clean shutdowns
    const shutdown = (signal) => {
      console.log(`[Server] ${signal} signal received. Shutting down gracefully...`);
      server.close(async () => {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('[Server] Graceful shutdown complete. Exiting.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error(`[Server] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
