@echo off
title ProTrack Starter
echo ==========================================
echo   Iniciando Servidores de ProTrack...
echo ==========================================

:: Iniciar el Backend en una ventana separada
echo [1/2] Iniciando Backend en puerto 3001...
start "ProTrack Backend" cmd /k "cd backend && npm start"

:: Esperar 2 segundos para dar tiempo al backend de inicializar la DB
timeout /t 2 /nobreak > nul

:: Iniciar el Frontend (Vite) en una ventana separada
echo [2/2] Iniciando Frontend en puerto 3000...
start "ProTrack Frontend" cmd /k "npm run dev"

echo ==========================================
echo   Servidores iniciados correctamente.
echo   Abre: http://localhost:3000
echo ==========================================
timeout /t 5
