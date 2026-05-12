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

# 2. Preparar carpeta de datos y limpiar DB si se desea empezar de cero
mkdir -p $DB_DIR
if [ -f "$DB_FILE" ]; then
    echo "🗑️ Eliminando base de datos antigua ($DB_FILE)..."
    rm "$DB_FILE"
fi

# 3. Instalar dependencias locales (necesario para el seed inicial)
echo "📦 Instalando dependencias locales..."
npm install

# 4. Sembrar datos iniciales (crear usuarios)
echo "🌱 Sembrando datos iniciales (irving/viridiana)..."
DATABASE_URL=$DB_FILE node seed.js

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

echo "✅ Despliegue completado con éxito!"
echo "📍 La app está corriendo en: http://localhost:$PORT"
echo "👤 Usuarios: irving / viridiana | Password: familia123"
