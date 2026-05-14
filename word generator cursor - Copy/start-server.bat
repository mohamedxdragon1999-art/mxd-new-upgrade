@echo off
cd /d "%~dp0"
echo Starting MXD AI Suite server...
echo.
echo Open your browser and go to:
echo http://localhost:8080/index.html
echo.
echo Press Ctrl+C to stop the server
echo.
python serve.py