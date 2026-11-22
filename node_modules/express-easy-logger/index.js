/**
 * express-easy-logger
 * An easy-to-use, beginner-friendly request logger for Express applications.
 *
 * Usage:
 *   const express = require('express');
 *   const logger = require('express-easy-logger');
 *
 *   const app = express();
 *   app.use(logger());
 *   app.use('/logs', logger.viewer({ file: './logs/app.log' }));
 */

const createLogger = require('./src/logger');
const createViewer = require('./src/viewer');

// Attach the viewer function directly to the main logger function
createLogger.viewer = createViewer;

module.exports = createLogger;
