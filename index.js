const express = require('express');
const logger = require('express-easy-logger');

const app = express();

app.use(express.json());

// Logger with colors, file logging, body logging, and skip favicon
app.use(
  logger({
    colors: true,
    file: './logs/app.log',
    showBody: true,
    skip: ['/favicon.ico'],
  })
);

// Built-in web dashboard at /logs
app.use('/logs', logger.viewer({ file: './logs/app.log' }));

// Routes
app.get('/', (req, res) => res.send('Hello World! Visit /logs for the dashboard.'));
app.get('/users', (req, res) => res.json([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]));
app.post('/login', (req, res) => res.json({ status: 'ok' }));
app.get('/error', (req, res) => res.status(500).send('Something broke!'));

app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📊 Log viewer at http://localhost:3000/logs');
});
