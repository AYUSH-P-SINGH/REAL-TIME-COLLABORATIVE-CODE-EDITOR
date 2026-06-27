// Backend Test Setup & Configuration
const request = require('supertest');
const app = require('../app');
const { connectDB, closeDB } = require('../config/db');


beforeAll(async () => {
  await connectDB();
});

// Cleanup after tests
afterAll(async () => {
  await closeDB();
});

module.exports = { request, app };
