/**
 * src/formatter.js
 * Formats log messages, handles ANSI colors, and sanitizes sensitive data.
 */

// ANSI color escape codes (standard terminal colors)
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',  // 2xx Success
  cyan: '\x1b[36m',   // 3xx Redirection
  yellow: '\x1b[33m', // 4xx Client Error
  red: '\x1b[31m',    // 5xx Server Error
  dim: '\x1b[90m',    // Dim / Gray
  bold: '\x1b[1m',
};

// Sensitive field names to automatically mask
const SENSITIVE_KEYS = new Set(['password', 'token', 'authorization']);

/**
 * Returns the current timestamp in 'YYYY-MM-DD HH:mm:ss' format.
 * @param {Date} [date] - Optional Date object
 * @returns {string} Formatted timestamp
 */
function getTimestamp(date = new Date()) {
  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Returns the ANSI color code matching the HTTP status code.
 * 2xx = Green, 3xx = Cyan, 4xx = Yellow, 5xx = Red
 * @param {number} status - HTTP status code
 * @returns {string} ANSI color code
 */
function getStatusColor(status) {
  if (status >= 200 && status < 300) return COLORS.green;
  if (status >= 300 && status < 400) return COLORS.cyan;
  if (status >= 400 && status < 500) return COLORS.yellow;
  if (status >= 500) return COLORS.red;
  return COLORS.reset;
}

/**
 * Recursively masks sensitive fields (password, token, authorization) in request body.
 * @param {any} data - Request body
 * @returns {any} Cleaned data with sensitive keys replaced by '***'
 */
function sanitizeBody(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeBody(item));
  }

  // Handle objects
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Formats request details into console and file strings.
 * @param {object} info - Request info: { timestamp, method, url, status, duration, body }
 * @param {object} options - User options: { colors, format, showBody }
 * @returns {{ consoleOutput: string, fileOutput: string }}
 */
function formatLog(info, options = {}) {
  const {
    timestamp = getTimestamp(),
    method = 'GET',
    url = '/',
    status = 200,
    duration = 0,
    body = null,
  } = info;

  const {
    colors = true,
    format = 'simple',
    showBody = false,
  } = options;

  // JSON format
  if (format === 'json') {
    const logObject = {
      timestamp,
      method,
      url,
      status,
      duration: `${duration}ms`,
    };

    if (showBody && body && Object.keys(body).length > 0) {
      logObject.body = sanitizeBody(body);
    }

    const jsonString = JSON.stringify(logObject);
    return {
      consoleOutput: jsonString,
      fileOutput: jsonString,
    };
  }

  // Simple format: [YYYY-MM-DD HH:mm:ss] METHOD URL STATUS DURATIONms
  let bodyPart = '';
  if (showBody && body && Object.keys(body).length > 0) {
    const cleanBody = sanitizeBody(body);
    bodyPart = ` - Body: ${JSON.stringify(cleanBody)}`;
  }

  // Plain text (used for log files so no ugly ANSI characters are written)
  const plainText = `[${timestamp}] ${method} ${url} ${status} ${duration}ms${bodyPart}`;

  // Colored text for terminal console output
  let consoleOutput = plainText;
  if (colors) {
    const statusColor = getStatusColor(status);
    consoleOutput = `[${timestamp}] ${method} ${url} ${statusColor}${status}${COLORS.reset} ${duration}ms${bodyPart}`;
  }

  return {
    consoleOutput,
    fileOutput: plainText,
  };
}

module.exports = {
  COLORS,
  getTimestamp,
  getStatusColor,
  sanitizeBody,
  formatLog,
};
