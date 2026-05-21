@echo off
cd /d "%~dp0"
echo ======================================
echo   MXD AI Suite - Starting Server
echo ======================================
echo.
echo Open your browser and go to:
echo http://localhost:8080/index.html
echo.
echo Press Ctrl+C to stop the server
echo.
echo Starting server...
python serve.py
pause