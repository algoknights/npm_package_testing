/**
 * src/viewer.js
 * Built-in log viewer dashboard serving a clean HTML + CSS table.
 */

const { readLastLogs } = require('./fileWriter');

/**
 * Escapes HTML special characters to prevent any XSS issues.
 * @param {string} str - Raw string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates the CSS badge class for HTTP status codes.
 * @param {number} status - HTTP status code
 * @returns {string} CSS class name
 */
function getStatusClass(status) {
  if (status >= 200 && status < 300) return 'status-2xx';
  if (status >= 300 && status < 400) return 'status-3xx';
  if (status >= 400 && status < 500) return 'status-4xx';
  if (status >= 500) return 'status-5xx';
  return 'status-other';
}

/**
 * Generates the full HTML markup for the log viewer dashboard.
 * @param {Array<object>} logs - Array of parsed log objects
 * @param {string} dataUrl - URL endpoint to fetch JSON logs
 * @returns {string} HTML page string
 */
function renderHtml(logs, dataUrl) {
  const rowsHtml = logs.length === 0
    ? `<tr class="empty-row"><td colspan="6">No logs recorded yet. Make some requests to your app and they will show up here!</td></tr>`
    : logs.map((log, index) => {
      const statusClass = getStatusClass(log.status);
      const methodClass = `method-${(log.method || 'GET').toLowerCase()}`;
      const bodyHtml = log.body ? `<span class="log-body" title="${escapeHtml(log.body)}">${escapeHtml(log.body)}</span>` : '<span class="text-muted">-</span>';

      return `
        <tr data-method="${escapeHtml(log.method)}" data-status="${escapeHtml(String(log.status))}" data-url="${escapeHtml(log.url)}">
          <td class="text-muted">#${logs.length - index}</td>
          <td class="font-mono">${escapeHtml(log.timestamp)}</td>
          <td><span class="badge ${methodClass}">${escapeHtml(log.method)}</span></td>
          <td class="font-mono text-url">${escapeHtml(log.url)}</td>
          <td><span class="badge ${statusClass}">${escapeHtml(String(log.status))}</span></td>
          <td class="font-mono text-duration">${escapeHtml(log.duration)}</td>
          <td>${bodyHtml}</td>
        </tr>
      `;
    }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Express Easy Logger - Viewer</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --green-bg: #064e3b;
      --green-text: #34d399;
      --cyan-bg: #164e63;
      --cyan-text: #22d3ee;
      --yellow-bg: #78350f;
      --yellow-text: #fbbf24;
      --red-bg: #7f1d1d;
      --red-text: #f87171;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      background-color: var(--bg);
      color: var(--text);
      padding: 24px;
      line-height: 1.5;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .title-group h1 {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .title-group h1 span.pill {
      font-size: 12px;
      background: #0284c7;
      color: white;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 500;
    }

    .title-group p {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .controls-panel {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      background: var(--card-bg);
      padding: 14px 18px;
      border-radius: 8px;
      border: 1px solid var(--border);
      margin-bottom: 20px;
    }

    .search-input {
      flex: 1;
      min-width: 220px;
      background: #0f172a;
      border: 1px solid var(--border);
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--primary);
    }

    select {
      background: #0f172a;
      border: 1px solid var(--border);
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }

    .btn {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .btn:hover { background: #1d4ed8; }

    .btn-secondary {
      background: #334155;
    }
    .btn-secondary:hover { background: #475569; }

    .refresh-status {
      font-size: 12px;
      color: var(--text-muted);
      margin-left: auto;
    }

    .table-card {
      background: var(--card-bg);
      border-radius: 8px;
      border: 1px solid var(--border);
      overflow-x: auto;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }

    th {
      background: #1e293b;
      padding: 12px 16px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
    }

    td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: rgba(255, 255, 255, 0.02); }

    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; }
    .text-muted { color: var(--text-muted); }
    .text-url { color: #e2e8f0; font-weight: 500; }
    .text-duration { color: #cbd5e1; }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
      font-family: ui-monospace, monospace;
    }

    .status-2xx { background: var(--green-bg); color: var(--green-text); border: 1px solid #047857; }
    .status-3xx { background: var(--cyan-bg); color: var(--cyan-text); border: 1px solid #0891b2; }
    .status-4xx { background: var(--yellow-bg); color: var(--yellow-text); border: 1px solid #d97706; }
    .status-5xx { background: var(--red-bg); color: var(--red-text); border: 1px solid #dc2626; }
    .status-other { background: #374151; color: #d1d5db; }

    .method-get { background: #1e3a8a; color: #93c5fd; }
    .method-post { background: #14532d; color: #86efac; }
    .method-put { background: #713f12; color: #fde047; }
    .method-delete { background: #7f1d1d; color: #fca5a5; }
    .method-patch { background: #581c87; color: #d8b4fe; }

    .log-body {
      display: inline-block;
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #cbd5e1;
      font-family: monospace;
      font-size: 11px;
      background: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #334155;
    }

    .empty-row td {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="title-group">
        <h1>Express Easy Logger <span class="pill">Live Viewer</span></h1>
        <p>Showing the last 100 HTTP requests in real-time (auto-refreshes every 5s)</p>
      </div>
      <div>
        <button id="refreshBtn" class="btn">🔄 Refresh Now</button>
        <button id="toggleAutoBtn" class="btn btn-secondary">⏸ Pause Auto-Refresh</button>
      </div>
    </header>

    <div class="controls-panel">
      <input type="text" id="filterInput" class="search-input" placeholder="🔍 Filter by method, status (e.g. 200, 404), or URL...">
      
      <select id="methodFilter">
        <option value="">All Methods</option>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
      </select>

      <select id="statusFilter">
        <option value="">All Statuses</option>
        <option value="2">2xx (Success)</option>
        <option value="3">3xx (Redirect)</option>
        <option value="4">4xx (Client Error)</option>
        <option value="5">5xx (Server Error)</option>
      </select>

      <span class="refresh-status" id="refreshStatus">Next update in: 5s</span>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">#</th>
            <th style="width: 170px;">Timestamp</th>
            <th style="width: 90px;">Method</th>
            <th>URL</th>
            <th style="width: 90px;">Status</th>
            <th style="width: 110px;">Response Time</th>
            <th>Body / Details</th>
          </tr>
        </thead>
        <tbody id="logsBody">
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  </div>

  <script>
    const dataEndpoint = ${JSON.stringify(dataUrl)};
    let autoRefreshActive = true;
    let countdown = 5;
    let timerId = null;

    const filterInput = document.getElementById('filterInput');
    const methodFilter = document.getElementById('methodFilter');
    const statusFilter = document.getElementById('statusFilter');
    const logsBody = document.getElementById('logsBody');
    const refreshStatus = document.getElementById('refreshStatus');
    const refreshBtn = document.getElementById('refreshBtn');
    const toggleAutoBtn = document.getElementById('toggleAutoBtn');

    // Filter table rows based on user input
    function applyFilters() {
      const query = filterInput.value.toLowerCase().trim();
      const method = methodFilter.value.toUpperCase();
      const statusGroup = statusFilter.value;

      const rows = logsBody.querySelectorAll('tr:not(.empty-row)');
      let visibleCount = 0;

      rows.forEach(row => {
        const rowMethod = (row.dataset.method || '').toUpperCase();
        const rowStatus = String(row.dataset.status || '');
        const rowUrl = (row.dataset.url || '').toLowerCase();
        const rowText = row.innerText.toLowerCase();

        const matchesQuery = !query || rowText.includes(query) || rowUrl.includes(query) || rowStatus.includes(query);
        const matchesMethod = !method || rowMethod === method;
        const matchesStatus = !statusGroup || rowStatus.startsWith(statusGroup);

        if (matchesQuery && matchesMethod && matchesStatus) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });
    }

    filterInput.addEventListener('input', applyFilters);
    methodFilter.addEventListener('change', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    function getStatusClass(status) {
      if (status >= 200 && status < 300) return 'status-2xx';
      if (status >= 300 && status < 400) return 'status-3xx';
      if (status >= 400 && status < 500) return 'status-4xx';
      if (status >= 500) return 'status-5xx';
      return 'status-other';
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Fetch latest logs and update table in-place
    async function fetchLogs() {
      try {
        const res = await fetch(dataEndpoint, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        const logs = data.logs || [];

        if (logs.length === 0) {
          logsBody.innerHTML = '<tr class="empty-row"><td colspan="6">No logs recorded yet. Make some requests to your app and they will show up here!</td></tr>';
          return;
        }

        const rowsHtml = logs.map((log, index) => {
          const statusClass = getStatusClass(log.status);
          const methodClass = 'method-' + (log.method || 'GET').toLowerCase();
          const bodyHtml = log.body ? '<span class="log-body" title="' + escapeHtml(log.body) + '">' + escapeHtml(log.body) + '</span>' : '<span class="text-muted">-</span>';

          return '<tr data-method="' + escapeHtml(log.method) + '" data-status="' + escapeHtml(String(log.status)) + '" data-url="' + escapeHtml(log.url) + '">' +
            '<td class="text-muted">#' + (logs.length - index) + '</td>' +
            '<td class="font-mono">' + escapeHtml(log.timestamp) + '</td>' +
            '<td><span class="badge ' + methodClass + '">' + escapeHtml(log.method) + '</span></td>' +
            '<td class="font-mono text-url">' + escapeHtml(log.url) + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + escapeHtml(String(log.status)) + '</span></td>' +
            '<td class="font-mono text-duration">' + escapeHtml(log.duration) + '</td>' +
            '<td>' + bodyHtml + '</td>' +
          '</tr>';
        }).join('');

        logsBody.innerHTML = rowsHtml;
        applyFilters();
      } catch (err) {
        // Ignore network glitches
      }
    }

    // Auto-refresh countdown loop
    setInterval(() => {
      if (!autoRefreshActive) return;
      countdown--;
      if (countdown <= 0) {
        countdown = 5;
        fetchLogs();
      }
      refreshStatus.textContent = 'Next update in: ' + countdown + 's';
    }, 1000);

    refreshBtn.addEventListener('click', () => {
      countdown = 5;
      refreshStatus.textContent = 'Refreshing...';
      fetchLogs().then(() => {
        refreshStatus.textContent = 'Next update in: 5s';
      });
    });

    toggleAutoBtn.addEventListener('click', () => {
      autoRefreshActive = !autoRefreshActive;
      if (autoRefreshActive) {
        toggleAutoBtn.textContent = '⏸ Pause Auto-Refresh';
        toggleAutoBtn.classList.remove('btn-secondary');
        refreshStatus.textContent = 'Next update in: ' + countdown + 's';
      } else {
        toggleAutoBtn.textContent = '▶ Resume Auto-Refresh';
        toggleAutoBtn.classList.add('btn-secondary');
        refreshStatus.textContent = 'Auto-refresh paused';
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Creates the Express middleware/route handler for the log viewer dashboard.
 *
 * @param {object} [options]
 * @param {string} [options.file='./logs/app.log'] - Path to log file
 * @returns {Function} Express middleware (req, res, next)
 */
function viewer(options = {}) {
  const filePath = options.file || './logs/app.log';

  return function viewerMiddleware(req, res, next) {
    try {
      const isJsonRequest =
        req.query && req.query.format === 'json' ||
        (req.url && (req.url === '/data' || req.url.endsWith('/data'))) ||
        (req.headers.accept && req.headers.accept.includes('application/json'));

      // Return JSON data
      if (isJsonRequest) {
        const logs = readLastLogs(filePath, 100);
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ logs }));
      }

      // Serve HTML dashboard
      const logs = readLastLogs(filePath, 100);
      
      // Determine the proper relative JSON URL based on how the middleware is mounted
      let baseUrl = req.baseUrl || req.originalUrl.split('?')[0];
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      const dataUrl = `${baseUrl}?format=json`;

      const html = renderHtml(logs, dataUrl);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.end(html);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = viewer;
