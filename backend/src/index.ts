import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// --- Routen & Middleware importieren ---
import dashboardRouter from './app/routes/dashboard.ts';
import errorHandler from './app/middleware/error-handler.ts';

// --- ES-Module Workaround für __dirname ---
// Notwendig, da __dirname in ES-Modulen nicht standardmäßig verfügbar ist
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Express App Initialisierung ---
const app = express();
const port = process.env.PORT || 8080;

// --- Globale Middlewares ---
// Erlaubt das Parsen von JSON-Bodies in Requests
app.use(express.json());

// --- CORS für lokale Entwicklung ---
// Erlaubt dem Frontend (auf localhost:5173) mit dem Backend (auf localhost:8080) zu kommunizieren
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');

        // Pre-Flight-Request für CORS abfangen
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }

        next();
    });
}

// --- API-Routen registrieren ---
// Alle Anfragen an /api/dashboard werden an den dashboardRouter weitergeleitet
app.use('/api/dashboard', dashboardRouter);

// Beispiel-Routen für Health-Check und Test
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from backend!" });
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

// --- Production: Statisches Frontend servieren ---
// Dieser Block wird nur ausgeführt, wenn die App auf App Engine läuft (NODE_ENV=production)
if (process.env.NODE_ENV === 'production') {
    // Pfad zum 'public' Ordner, wo das gebaute Frontend liegt
    const publicPath = join(__dirname, "../public");
    console.log(`Serving frontend from: ${publicPath}`);

    // Alle Dateien im public-Ordner statisch servieren (z.B. CSS, JS, Bilder)
    app.use(express.static(publicPath));

    // SPA Catch-All: Alle anderen Anfragen (die nicht /api sind) leiten auf die index.html
    // Das ist notwendig, damit Client-Side-Routing (React Router) funktioniert
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(join(publicPath, "index.html"));
    });
}

// --- Zentraler Error Handler ---
// Muss NACH allen Routen registriert werden, um Fehler abzufangen
app.use(errorHandler);

// --- Server starten ---
// Startet den Server und lauscht auf dem definierten Port
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
