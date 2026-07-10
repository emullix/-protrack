# Guía de Despliegue en Oracle Cloud - ProTrack

Esta guía contiene los pasos que seguimos para subir la aplicación y abrir los puertos. Úsala como referencia para futuros proyectos.

## 1. Puertos y Firewall (Crucial)
Para que una app sea visible en internet, debe tener el puerto abierto en dos lugares:

### A. En la Consola de Oracle Cloud (Externo)
1. Ve a **Networking** > **Virtual Cloud Networks**.
2. Selecciona tu VCN (`vcn-20260416-0032`).
3. En el menú lateral elige **Security Lists**.
4. Entra en la **Default Security List**.
5. Botón **Add Ingress Rules**:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: `TCP`
   - Destination Port Range: `3001` (o el puerto de tu app).

### B. En la Terminal del Servidor (Interno)
Ejecuta estos comandos para que el sistema operativo no bloquee el tráfico:
```bash
sudo iptables -I INPUT 1 -p tcp --dport 3001 -j ACCEPT
sudo netfilter-persistent save
```

---

## 2. Gestión de la App con PM2
PM2 mantiene tu aplicación encendida 24/7.

- **Ver estado**: `pm2 list`
- **Ver errores/logs**: `pm2 logs protrack-backend`
- **Reiniciar**: `pm2 restart protrack-backend`
- **Detener**: `pm2 stop protrack-backend`
- **Guardar configuración**: `pm2 save` (haz esto después de cualquier cambio para que se inicie solo tras un reinicio del servidor).

---

## 3. Actualizar el código (Cuando hagas cambios en tu PC)
Si modificas algo en tu computadora local y quieres que se vea en el servidor:

1. **En tu PC**:
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push origin main
   ```

2. **En el Servidor de Oracle**:
   ```bash
   cd ~/-protrack
   git pull origin main
   npm install      # (Solo si añadiste librerías nuevas)
   npm run build    # (Para actualizar la parte visual)
   pm2 restart protrack-backend
   ```

---

## 4. Archivos importantes
- **Base de Datos**: Se encuentra en `backend/protrack.db`. Usa WinSCP para respaldarla o subir una nueva.
- **Configuración**: El archivo `backend/.env` contiene el puerto y otras variables secretas.
