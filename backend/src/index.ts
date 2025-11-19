// src/app/index.ts
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import startpageRoutes from './app/routes/startpageRoutes.js';
import dashboardRoutes from './app/routes/dashboardRoutes.js';
import estimationRoutes from './app/routes/calcRoutes.js';
import configRoutes from './app/routes/configRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// CORS
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') return res.sendStatus(200);
        next();
    });
}

// Basis-Health
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from backend!' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Routen montieren
app.use('/api/startpage', startpageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/estimation', estimationRoutes);
app.use('/api/estimation', configRoutes);

// Static Frontend für Production
if (process.env.NODE_ENV === 'production') {
    const publicPath = join(__dirname, '../public');
    app.use(express.static(publicPath));

    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(join(publicPath, 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
