@echo off
title ProTrack Stopper
echo ==========================================
echo   Deteniendo Servidores de ProTrack...
echo ==========================================

:: Cerrar las ventanas del backend y frontend
echo Deteniendo proceso de Backend...
taskkill /FI "WINDOWTITLE eq ProTrack Backend" /F /T >nul 2>&1

:: Adicionalmente matar por puerto 3001 por seguridad
for /f "tokens=5" %%a in ('netstat -aon ^| findstr 3001') do taskkill /F /PID %%a >nul 2>&1

echo Deteniendo proceso de Frontend...
taskkill /FI "WINDOWTITLE eq ProTrack Frontend" /F /T >nul 2>&1

:: Adicionalmente matar por puerto 3000 por seguridad
for /f "tokens=5" %%a in ('netstat -aon ^| findstr 3000') do taskkill /F /PID %%a >nul 2>&1

echo ==========================================
echo   Todos los servicios han sido detenidos.
echo ==========================================
timeout /t 3
