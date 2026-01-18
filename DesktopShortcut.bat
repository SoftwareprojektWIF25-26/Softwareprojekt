@echo off
echo Erstelle Desktop-Verknuepfung...

set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"

powershell -ExecutionPolicy Bypass -Command "$WScriptShell = New-Object -ComObject WScript.Shell; $Shortcut = $WScriptShell.CreateShortcut('%DESKTOP%\Softwareprojekt.lnk'); $Shortcut.TargetPath = '%SCRIPT_DIR%start-app.bat'; $Shortcut.WorkingDirectory = '%SCRIPT_DIR%'; $Shortcut.IconLocation = 'C:\Windows\System32\shell32.dll,27'; $Shortcut.Save()"

if errorlevel 1 (
    echo [FEHLER] Verknuepfung konnte nicht erstellt werden!
    pause
    exit /b 1
)

echo.
echo Verknuepfung erfolgreich erstellt!
echo Sie finden "Softwareprojekt.lnk" auf Ihrem Desktop.
echo.
pause
