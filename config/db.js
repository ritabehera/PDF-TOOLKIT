const mongoose = require('mongoose');
const config = require('./default');

// In-Memory Data Store Fallback for Standalone Execution
const memoryStore = {
  users: [],
  files: [],
  history: [],
  favorites: [],
  aiLogs: []
};

let isMongoConnected = false;

const connectDB = async () => {
  if (config.mongoURI) {
    try {
      await mongoose.connect(config.mongoURI);
      isMongoConnected = true;
      console.log('MongoDB Connected successfully.');
    } catch (err) {
      console.warn('MongoDB connection failed. Falling back to Standalone In-Memory Storage:', err.message);
      isMongoConnected = false;
    }
  } else {
    console.log('No MONGODB_URI configured. Running in Standalone In-Memory Mode.');
  }
};

const getStore = () => memoryStore;
const isConnected = () => isMongoConnected;

module.exports = {
  connectDB,
  getStore,
  isConnected
};
