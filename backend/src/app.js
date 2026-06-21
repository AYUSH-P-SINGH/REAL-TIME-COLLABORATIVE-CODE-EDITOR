const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Set CORS policies and Parse payload sizes
app.use(cors({ origin: '*' })); // Refine client origin in prod environments
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Master Routing Gateway
app.use('/api', routes);

// Custom Global Error Middleware
app.use(errorHandler);

module.exports = app;