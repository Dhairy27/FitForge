const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Load .env variables manually if not already present
if (fs.existsSync('.env')) {
  const envText = fs.readFileSync('.env', 'utf-8');
  envText.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

// Log requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Serve presets and images directly
app.use('/images', express.static(path.join(__dirname, 'images')));

// API routes loader
app.all('/api/*apiPath', async (req, res) => {
  const paramPath = req.params.apiPath;
  const apiPath = Array.isArray(paramPath) ? paramPath.join('/') : (paramPath || '');
  let localFile = path.join(__dirname, 'api', apiPath);
  if (!localFile.endsWith('.js')) {
    localFile += '.js';
  }

  if (!fs.existsSync(localFile)) {
    const dirFile = path.join(__dirname, 'api', apiPath, 'index.js');
    if (fs.existsSync(dirFile)) {
      localFile = dirFile;
    } else {
      console.warn(`[API 404] No API handler at ${localFile}`);
      return res.status(404).json({ error: `API route /api/${apiPath} not found.` });
    }
  }

  try {
    // Clear require cache for development hot reloading
    delete require.cache[require.resolve(localFile)];
    const handler = require(localFile);
    await handler(req, res);
  } catch (err) {
    console.error(`[API 500 ERROR] in ${localFile}:`, err);
    res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve other static assets
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`HealthVerse AI Server started on http://localhost:${PORT}`);
  console.log(`===============================================`);
});
