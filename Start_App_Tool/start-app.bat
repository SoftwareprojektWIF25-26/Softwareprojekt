@echo off
title Softwareprojekt Starter
color 0A

echo ========================================
echo   Softwareprojekt wird gestartet...
echo ========================================
echo.

REM Setze Projektpfad
set "START_TOOL_PATH=%~dp0"
set "PROJECT_ROOT=%~dp0..\"
set "BACKEND_PATH=%PROJECT_ROOT%backend"
set "FRONTEND_PATH=%PROJECT_ROOT%frontend"

REM Pruefe ob Node.js installiert ist
where node >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Node.js ist nicht installiert!
    echo Bitte installiere Node.js von https://nodejs.org/
    pause
    exit /b 1
)

REM Pruefe ob Docker Desktop installiert ist
where docker >nul 2>&1
if errorlevel 1 (
    echo [FEHLER] Docker ist nicht installiert!
    echo Bitte installiere Docker Desktop von https://www.docker.com/
    pause
    exit /b 1
)

echo [1/6] Pruefe Docker Status...
docker info >nul 2>&1
if errorlevel 1 (
    echo    Docker Desktop ist nicht aktiv.
    echo    Starte Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    timeout /t 10 /nobreak >nul

    echo [2/6] Warte auf Docker Engine...
    :waitfordocker
    docker info >nul 2>&1
    if errorlevel 1 (
        echo    Docker startet noch... Bitte warten.
        timeout /t 3 /nobreak >nul
        goto :waitfordocker
    )
    echo    Docker ist jetzt bereit!
) else (
    echo    Docker Desktop laeuft bereits!
)


echo [2/6] Warte auf Docker Engine...
:waitfordocker
docker info >nul 2>&1
if errorlevel 1 (
    echo    Docker startet noch...
    timeout /t 3 /nobreak >nul
    goto :waitfordocker
)
echo    Docker ist bereit!

echo [3/6] Starte PostgreSQL Datenbank...
cd /d "%BACKEND_PATH%"
docker-compose up -d
if errorlevel 1 (
    echo [FEHLER] Datenbank konnte nicht gestartet werden!
    pause
    exit /b 1
)

REM Warte bis Datenbank bereit ist
echo    Warte auf Datenbank...
timeout /t 5 /nobreak >nul

echo [4/6] Starte Backend (Port 8080)...
cd /d "%BACKEND_PATH%"
if not exist "node_modules\" (
    echo    Installiere Backend Dependencies...
    call npm install
)
start "Backend - Port 8080" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

echo [5/6] Starte Frontend (Vite)...
cd /d "%FRONTEND_PATH%"
if not exist "node_modules\" (
    echo    Installiere Frontend Dependencies...
    call npm install
)
start "Frontend - Vite Dev Server" cmd /k "npm run dev"

echo [6/6] Warte auf Vite Dev Server...
timeout /t 8 /nobreak >nul

echo    Oeffne Browser...
start "" http://localhost:5173

echo.
echo ========================================
echo   Alle Dienste gestartet!
echo ========================================
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8080
echo   Datenbank: PostgreSQL auf Port 5432
echo ========================================
echo.
echo Der Browser wurde automatisch geoeffnet.
echo Zum Beenden alle Fenster schliessen.
timeout /t 5
exit
