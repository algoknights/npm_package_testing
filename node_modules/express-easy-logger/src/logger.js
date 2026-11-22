/**
 * src/logger.js
 * Express middleware that logs every incoming HTTP request.
 */

const { getTimestamp, formatLog } = require('./formatter');
const { writeLog } = require('./fileWriter');

/**
 * Creates the express-easy-logger middleware.
 *
 * @param {object} [options]
 * @param {boolean} [options.colors=true] - Enable colored terminal output
 * @param {string|null} [options.file=null] - File path to save logs (e.g. './logs/app.log')
 * @param {'simple'|'json'} [options.format='simple'] - Output format
 * @param {Array<string|RegExp>} [options.skip=[]] - Routes or patterns to ignore (e.g. ['/favicon.ico'])
 * @param {boolean} [options.showBody=false] - Log request body (sensitive keys automatically masked)
 * @returns {Function} Express middleware (req, res, next)
 */
function createLogger(options = {}) {
  // Merge user options with sensible defaults
  const config = {
    colors: options.colors !== undefined ? Boolean(options.colors) : true,
    file: typeof options.file === 'string' ? options.file : null,
    format: options.format === 'json' ? 'json' : 'simple',
    skip: Array.isArray(options.skip) ? options.skip : [],
    showBody: Boolean(options.showBody),
  };

  return function easyLoggerMiddleware(req, res, next) {
    try {
      const requestUrl = req.originalUrl || req.url || '/';

      // Check if this request URL should be skipped
      const shouldSkip = config.skip.some((pattern) => {
        if (typeof pattern === 'string') {
          return requestUrl === pattern || req.path === pattern;
        }
        if (pattern instanceof RegExp) {
          return pattern.test(requestUrl);
        }
        return false;
      });

      if (shouldSkip) {
        return next();
      }

      // Record request start timestamp for response time calculation
      const startTime = Date.now();

      // Listen for when the response finishes sending to client
      res.on('finish', () => {
        try {
          const duration = Math.max(0, Date.now() - startTime);

          const logData = {
            timestamp: getTimestamp(),
            method: req.method || 'GET',
            url: requestUrl,
            status: res.statusCode || 200,
            duration,
            body: config.showBody ? req.body : null,
          };

          const formatted = formatLog(logData, config);

          // 1. Output to console
          console.log(formatted.consoleOutput);

          // 2. Append to log file if a file path is configured
          if (config.file) {
            writeLog(config.file, formatted.fileOutput);
          }
        } catch (innerError) {
          // Never crash the application if logging encounters an issue
        }
      });
    } catch (outerError) {
      // Never crash the application if middleware setup fails
    }

    next();
  };
}

module.exports = createLogger;
