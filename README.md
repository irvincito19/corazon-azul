# Corazón Azul. Finanzas personales

Aplicación familiar para controlar gastos por quincena, presupuesto inicial, recurrentes y distribución por usuario.

## Stack

- SvelteKit
- TypeScript
- Tailwind CSS v4
- SQLite + Drizzle ORM
- Docker

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

4. Abrir la URL local que indique Vite.

## Usuarios

- Usuario: `irving` o `viridiana`
- Contraseña inicial: `familia123`

El login solo permite esos dos usuarios.

## Producción en AWS Lightsail

Estas instrucciones asumen una instancia Ubuntu en AWS Lightsail y el dominio `corazonazul.irisvisual.com`.

### 1. Preparar DNS

En el panel donde administras `irisvisual.com`, crea un registro:

```txt
Tipo: A
Nombre: corazonazul
Valor: IP pública estática de Lightsail
TTL: automático o 300
```

En Lightsail conviene asignar una IP estática a la instancia para que no cambie al reiniciar.

### 2. Instalar dependencias del servidor

Conéctate por SSH a la instancia y ejecuta:

```bash
sudo apt update
sudo apt install -y git ca-certificates curl
```

Instala Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Cierra sesión SSH y vuelve a entrar para que el grupo `docker` tome efecto.

### 3. Subir o clonar el proyecto

Ejemplo usando Git:

```bash
git clone <URL_DEL_REPOSITORIO> corazon-azul
cd corazon-azul
```

Si lo subes manualmente, entra a la carpeta del proyecto en el servidor.

### 4. Crear base de datos, usuarios y levantar Docker

```bash
mkdir -p data
npm install
DATABASE_URL=data/local.db node seed.js
docker compose up -d --build
```

La app queda escuchando internamente en `http://127.0.0.1:4000`.

### 5. Configurar Caddy

Si ya tienes Caddy instalado y funcionando en el VPS, agrega este bloque a tu `Caddyfile`:

```bash
sudo nano /etc/caddy/Caddyfile
```

Contenido:

```caddyfile
corazonazul.irisvisual.com {
    encode gzip zstd
    reverse_proxy 127.0.0.1:4000
}
```

Caddy se encarga automáticamente del certificado HTTPS cuando el DNS ya apunta al VPS. Valida y recarga:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Si Caddy no está instalado todavía:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

### 6. Operación diaria

Ver estado:

```bash
docker compose ps
sudo systemctl status caddy
```

Ver logs:

```bash
docker compose logs -f app
```

Actualizar después de cambios:

```bash
git pull
docker compose up -d --build
```

Respaldar base de datos:

```bash
cp data/local.db data/local.db.backup-$(date +%Y%m%d-%H%M)
```

### Problemas de acceso

Si el login no deja entrar:

1. Asegura que estás entrando por `https://corazonazul.irisvisual.com`, no por `http://IP:4000`.
2. `docker-compose.yml` usa `ORIGIN=https://corazonazul.irisvisual.com`; SvelteKit bloquea los POST si la URL del navegador no coincide.
3. Repara usuarios iniciales en la base usada por Docker:

   ```bash
   DATABASE_URL=data/local.db node seed.js
   docker compose restart app
   ```

4. Las credenciales iniciales son:

   ```txt
   irving / familia123
   viridiana / familia123
   ```

## Características

- Presupuesto inicial editable por quincena.
- Gastos de la quincena con avance y disponible.
- Recurrentes con color, edición y bloqueo cuando ya se aplicaron.
- Usuarios permitidos: `irving` y `viridiana`.
- Sesión activa visible en el dashboard.
