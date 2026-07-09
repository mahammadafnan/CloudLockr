const mongoose = require('mongoose');

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudlockr';
  let retries = 5;

  while (retries) {
    try {
      const conn = await mongoose.connect(connUri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 2000,
      });

      console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}`);
      break;
    } catch (err) {
      console.error(`[Database] Error connecting to MongoDB: ${err.message}`);
      retries -= 1;
      console.log(`[Database] Retries remaining: ${retries}. Waiting 5 seconds before trying again...`);
      if (retries === 0) {
        console.error('[Database] All connection attempts failed. Continuing server execution in offline database mode.');
      }
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
};

module.exports = connectDB;
