const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const env = require('../src/config/env');
const logger = require('../src/utils/logger');

beforeAll(async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000
      });
      logger.info('💾 Test Suite: MongoDB connected successfully.');
    }
  } catch (err) {
    logger.warn('⚠️ Test Suite: MongoDB not available, continuing in in-memory test mode.');
    mongoose.set('bufferCommands', false);
  }
}, 5000);

// Cleanup after tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  } catch (err) {
    // Ignore close errors
  }
});

module.exports = { request, app };
