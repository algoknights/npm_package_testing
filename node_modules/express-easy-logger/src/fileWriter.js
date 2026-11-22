/**
 * src/fileWriter.js
 * Safely writes logs to files and reads recent entries for the viewer.
 */

const fs = require('fs');
const path = require('path');

/**
 * Appends a log line to the specified file.
 * Automatically creates any missing parent folders.
 * Uses try/catch to ensure logging errors never crash the user's application.
 *
 * @param {string} filePath - Path to the log file (e.g. './logs/app.log')
 * @param {string} logLine - Plain text log entry to append
 */
function writeLog(filePath, logLine) {
  if (!filePath || typeof filePath !== 'string') return;

  try {
    const resolvedPath = path.resolve(filePath);
    const directory = path.dirname(resolvedPath);

    // Create the directory recursively if it doesn't exist
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Append log line with a newline character
    fs.appendFileSync(resolvedPath, logLine + '\n', 'utf8');
  } catch (error) {
    // Fail silently so the main Express application is never disrupted
  }
}

/**
 * Parses a single raw log string into structured components.
 * Supports both standard simple format and JSON format.
 *
 * @param {string} line - A single line from the log file
 * @returns {object} Parsed log entry
 */
function parseLogLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Attempt to parse as JSON first
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      return {
        timestamp: obj.timestamp || '-',
        method: obj.method || 'GET',
        url: obj.url || '/',
        status: obj.status ? Number(obj.status) : 200,
        duration: obj.duration || '-',
        body: obj.body ? JSON.stringify(obj.body) : '',
        raw: trimmed,
      };
    } catch (_) {
      // Fall through to simple text parser
    }
  }

  // Parse simple format: [2026-11-22 10:30:15] GET /users 200 12ms - Body: {...}
  const simpleRegex = /^\[([^\]]+)\]\s+([A-Z]+)\s+([^\s]+)\s+(\d{3})\s+([^\s]+)(?:\s+-\s+Body:\s+(.*))?$/;
  const match = trimmed.match(simpleRegex);

  if (match) {
    return {
      timestamp: match[1],
      method: match[2],
      url: match[3],
      status: Number(match[4]),
      duration: match[5],
      body: match[6] || '',
      raw: trimmed,
    };
  }

  // Fallback for unstructured log entries
  return {
    timestamp: '-',
    method: 'LOG',
    url: trimmed,
    status: 200,
    duration: '-',
    body: '',
    raw: trimmed,
  };
}

/**
 * Reads the last N logs from a file.
 * Returns an empty array if the file doesn't exist yet.
 *
 * @param {string} filePath - Path to log file
 * @param {number} [maxCount=100] - Maximum number of lines to return
 * @returns {Array<object>} Array of parsed log objects (most recent first)
 */
function readLastLogs(filePath, maxCount = 100) {
  if (!filePath || typeof filePath !== 'string') return [];

  try {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      return [];
    }

    const content = fs.readFileSync(resolvedPath, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);

    // Get the last `maxCount` lines and reverse them so the newest logs appear first
    const recentLines = lines.slice(-maxCount).reverse();

    return recentLines
      .map((line) => parseLogLine(line))
      .filter(Boolean);
  } catch (error) {
    // Return empty list if reading fails
    return [];
  }
}

module.exports = {
  writeLog,
  parseLogLine,
  readLastLogs,
};
