# express-easy-logger 🚀

> A beginner-friendly, zero-dependency HTTP request logger for Express with beautiful console colors, automatic file logging, sensitive data masking, and a built-in real-time web dashboard.

---

## 🌟 Why express-easy-logger?

- **One-line setup:** Just `app.use(logger())` and you are ready.
- **Color-coded statuses:** Instantly spot errors in the terminal (2xx Green, 3xx Cyan, 4xx Yellow, 5xx Red).
- **Automatic file saving:** Saves clean, uncolored logs to disk without crashing your app.
- **Built-in Web Dashboard:** View the last 100 requests in a clean HTML table that auto-refreshes every 5 seconds.
- **Safe by default:** Automatically hides sensitive fields like `password`, `token`, and `authorization` if body logging is enabled.
- **Zero heavy dependencies:** Built using pure Node.js standard modules (`fs`, `path`).

---

## 📦 Installation

```bash
npm install express-easy-logger
```

*(Express 4.x or 5.x is required as a peer dependency)*

---

## ⚡ 1-Line Quick Start

```javascript
const express = require('express');
const logger = require('express-easy-logger');

const app = express();

// 1. Add the logger middleware (that's it!)
app.use(logger());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
```

### Terminal Output Preview:
```text
[2026-11-22 10:30:15] GET /users 200 12ms
[2026-11-22 10:30:18] GET /redirect 302 2ms
[2026-11-22 10:30:20] GET /missing 404 1ms
[2026-11-22 10:30:25] GET /crash 500 15ms
```

---

## ⚙️ Options Reference

You can pass an optional options object to `logger(options)`:

```javascript
app.use(
  logger({
    colors: true,
    file: './logs/app.log',
    format: 'simple',
    skip: ['/favicon.ico'],
    showBody: false,
  })
);
```

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `colors` | `boolean` | `true` | Enables color-coded status codes in terminal output. |
| `file` | `string` or `null` | `null` | Path to log file. If set, logs are appended to this file. Folders are created automatically. |
| `format` | `'simple'` \| `'json'` | `'simple'` | Log format. `'simple'` writes plain text lines; `'json'` writes structured JSON. |
| `skip` | `Array<string\|RegExp>` | `[]` | List of URL paths or regex patterns to ignore (e.g. `['/favicon.ico', '/health']`). |
| `showBody` | `boolean` | `false` | When `true`, logs the incoming `req.body` with sensitive fields masked. |

---

## 🛡️ Sensitive Data Protection

When `showBody: true` is enabled, `express-easy-logger` automatically scans the request body and replaces sensitive values with `***`:

- `password`
- `token`
- `authorization`

```javascript
// Example request body:
// { "username": "alice", "password": "supersecret123", "token": "jwt-token-here" }

// Logged output:
// [2026-11-22 10:30:15] POST /login 200 5ms - Body: {"username":"alice","password":"***","token":"***"}
```

---

## 📊 Built-in Web Log Viewer

Want a graphical dashboard to view your application logs in real time? `express-easy-logger` includes an interactive HTML viewer out of the box!

```javascript
const express = require('express');
const logger = require('express-easy-logger');

const app = express();

// Log to file
app.use(logger({ file: './logs/app.log' }));

// Mount the live log viewer at /logs
app.use('/logs', logger.viewer({ file: './logs/app.log' }));

app.listen(3000);
```

### Dashboard Features:
1. **Live Table:** Shows the last 100 requests (Timestamp, Method, URL, Status, Response Time).
2. **Auto-Refresh:** Updates every 5 seconds with a visual countdown and Pause/Resume controls.
3. **Instant Filter:** Live search by Method (`GET`, `POST`, etc.), Status (`200`, `404`, `500`), or URL.
4. **Zero Configuration:** Self-contained HTML and CSS, no external CDNs or databases needed.

---

## 💻 Full Example App

Check out the [`example/server.js`](file:///Users/adityayadav/npm_package%20/example/server.js) file included in this repository:

```javascript
const express = require('express');
const logger = require('express-easy-logger');

const app = express();

app.use(express.json());

// Logger configuration
app.use(
  logger({
    colors: true,
    file: './logs/app.log',
    showBody: true,
    skip: ['/favicon.ico'],
  })
);

// Built-in dashboard
app.use('/logs', logger.viewer({ file: './logs/app.log' }));

// Routes
app.get('/', (req, res) => res.send('Welcome! Visit /logs to see the viewer.'));
app.get('/users', (req, res) => res.json([{ id: 1, name: 'Student' }]));
app.get('/error', (req, res) => res.status(500).send('Error'));
app.post('/login', (req, res) => res.json({ status: 'ok' }));

app.listen(3000, () => {
  console.log('App running on http://localhost:3000');
  console.log('Viewer running on http://localhost:3000/logs');
});
```

---

## 🧪 Testing

We use Node's built-in native test runner (`node --test`). No external test packages required!

```bash
npm test
```

---

## 📄 License

MIT ©
