const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use your Atlas URI if you have one, otherwise default to local
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cookingApp';

    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;