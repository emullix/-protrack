# Instrucciones para ejecutar ProTrack

Este proyecto ahora cuenta con un backend en Node.js/Express y una base de datos SQLite.

## Prerrequisitos
- Node.js instalado (v18 o superior recomendado)

## Configuración del Backend

1. Abre una terminal y navega a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor del backend:
   ```bash
   npm start
   ```
   El backend correrá en `http://localhost:3001`.

## Configuración del Frontend

1. Abre **otra** terminal en la raíz del proyecto.
2. Asegúrate de que las dependencias estén instaladas:
   ```bash
   npm install
   ```
3. Inicia el frontend en modo desarrollo:
   ```bash
   npm run dev
   ```
   El frontend correrá en `http://localhost:3000`.

## Notas Importantes
- El frontend está configurado para redirigir las peticiones `/api/*` al backend (`http://localhost:3001`).
- La base de datos es un archivo local llamado `protrack.db` dentro de la carpeta `backend`.
- Se usa JWT para la autenticación. El secreto se encuentra en `backend/.env`.

## Endpoints Disponibles

### Autenticación
- `POST /auth/register`
- `POST /auth/login`

### Proyectos (Requieren Token)
- `GET /projects`
- `POST /projects`
- `PUT /projects/:id`
- `DELETE /projects/:id`

### Tareas (Requieren Token)
- `GET /tasks`
- `POST /tasks`
- `PUT /tasks/:id`
- `DELETE /tasks/:id`
