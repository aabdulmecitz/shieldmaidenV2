const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');

    const connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shieldmaiden';

    // Mask password for logging
    const maskedUri = connectionString.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔗 Connection URI: ${maskedUri}`);

    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    return conn;

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    // We don't exit here to allow for retry logic or health checks to report failure
    return null;
  }
};

const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase
};
