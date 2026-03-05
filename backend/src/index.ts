// src/PathRouting.ts
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import apiRoutes from './app/routes/index.js'; // Zentrale Route-Datei

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

// Health-Check Endpoints
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from backend!' });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

//  ALLE API-Routes zentral
app.use('/api', apiRoutes);

// Static Frontend für Production
if (process.env.NODE_ENV === 'production') {
    const publicPath = join(__dirname, '../public');
    app.use(express.static(publicPath));

    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(join(publicPath, 'index.html'));
    });
}

// Error Handler (NEU)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Interner Server-Fehler',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API: http://localhost:${port}/api`);
});