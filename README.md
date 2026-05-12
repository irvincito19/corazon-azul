# Corazón Azul. Finanzas personales

Aplicación familiar para controlar gastos por quincena, presupuesto inicial, recurrentes y distribución por usuario.

## Stack

- SvelteKit (Runes)
- TypeScript
- Tailwind CSS v4
- SQLite + Drizzle ORM
- Docker + Caddy
- deploy.sh (Script de despliegue automático)

## Desarrollo Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Crear usuarios iniciales:
   ```bash
   node seed.js
   ```

3. Iniciar servidor:
   ```bash
   npm run dev
   ```

## Usuarios
- **Usuario:** `irving` o `viridiana`
- **Contraseña:** `familia123`

---

## Producción en AWS con Caddy

Estas instrucciones asumen una instancia Ubuntu en AWS y el dominio `corazonazul.irisvisual.com`.

### 1. Preparar DNS
En el panel de `irisvisual.com`, crea un registro:
- **Tipo:** A
- **Nombre:** corazonazul
- **Valor:** IP pública de tu VPS

### 2. Despliegue con un solo comando
Una vez que el código esté en el servidor, simplemente ejecuta el script que automatiza la limpieza, el sembrado de datos y el levantamiento del contenedor:

```bash
chmod +x deploy.sh
./deploy.sh
```

El script configurará automáticamente la aplicación para responder en el puerto **4000** y bajo el origen `https://corazonazul.irisvisual.com`.

### 3. Configurar Caddy
Añade este bloque a tu `/etc/caddy/Caddyfile`:

```caddyfile
corazonazul.irisvisual.com {
    reverse_proxy localhost:4000
}
```

Luego recarga Caddy: `sudo systemctl reload caddy`.

### 4. Operación y Logs
- **Ver logs:** `docker logs -f finanzas-app`
- **Actualizar app:** `git pull && ./deploy.sh`

---

## Características
- **Presupuesto quincenal:** Control automático por fechas (1-15 y 16-fin de mes).
- **Gastos Recurrentes:** Plantillas con color que se pueden aplicar con un clic.
- **Seguridad:** Protección CSRF adaptada para puertos personalizados y proxies (ORIGIN variable).
- **Diseño:** Interfaz oscura, minimalista y responsiva con Tailwind 4.
