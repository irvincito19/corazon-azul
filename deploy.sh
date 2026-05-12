#!/bin/bash

# --- CONFIGURACIÓN ---
CONTAINER_NAME="finanzas-app"
IMAGE_NAME="finanzas-personales"
PORT=4000
DB_DIR="data"
DB_FILE="$DB_DIR/local.db"
PROD_URL="https://corazonazul.irisvisual.com"

echo "🚀 Iniciando despliegue para $PROD_URL en puerto $PORT..."

# 1. Detener y eliminar contenedor/imagen previa si existen
echo "🧹 Limpiando versiones anteriores..."
docker stop $CONTAINER_NAME 2>/dev/null
docker rm $CONTAINER_NAME 2>/dev/null
docker rmi $IMAGE_NAME 2>/dev/null

# 2. Preparar carpeta de datos y limpiar DB
echo "🧹 Limpiando carpeta de datos..."
sudo rm -rf $DB_DIR
mkdir -p $DB_DIR
sudo chmod 777 $DB_DIR

# 3. Instalar dependencias locales (necesario para el seed inicial)
echo "📦 Instalando dependencias locales..."
npm install

# 4. Sembrar datos iniciales (crear usuarios)
echo "🌱 Sembrando datos iniciales en $DB_FILE..."
DATABASE_URL=$DB_FILE node seed.js
sudo chmod 666 $DB_FILE

# 5. Construir la imagen de Docker
echo "🏗️ Construyendo imagen de Docker..."
docker build -t $IMAGE_NAME .

# 6. Levantar el contenedor
echo "🏃 Levantando contenedor en puerto $PORT..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:3000 \
  -v $(pwd)/$DB_DIR:/app/data \
  -e DATABASE_URL=/app/data/local.db \
  -e ORIGIN=$PROD_URL \
  --restart unless-stopped \
  $IMAGE_NAME

echo "⏳ Esperando a que el contenedor inicie..."
sleep 5

echo "🔍 Verificando usuarios dentro del contenedor..."
docker exec $CONTAINER_NAME node -e "const Database = require('better-sqlite3'); const db = new Database('/app/data/local.db'); console.log('Usuarios en DB:', db.prepare('SELECT username FROM users').all());"

echo "✅ Despliegue completado con éxito!"
echo "📍 La app está corriendo en: $PROD_URL"
echo "👤 Usuarios: irving / viridiana | Password: familia123"
