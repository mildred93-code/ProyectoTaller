#!/usr/bin/env bash
set -e

DB_HOST="$1"
if [ -z "$DB_HOST" ]; then
    read -p "Ingresa la IP de la máquina de Base de Datos (Instancia 1): " DB_HOST
fi

# Sanitizar entrada de DB_HOST
DB_HOST=$(echo "$DB_HOST" | tr -d ' \r\n' | sed -e 's#^https\?://##' -e 's#:.*$##' -e 's#/.*$##')
if [ -z "$DB_HOST" ]; then
    echo "Error: La IP de la base de datos es requerida."
    exit 1
fi

echo ""
echo "=== [1/3] Instalando Node.js 22 LTS ==="
sudo apt update -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential
sudo apt clean 2>/dev/null || true

# Habilitar puerto 4000 en el firewall si ufw está activo
sudo ufw allow 4000/tcp 2>/dev/null || true

echo "=== [2/3] Instalando dependencias del Backend ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

cd "$BACKEND_DIR"
npm install

# Corregir enlace simbólico de nodemon en Linux si es necesario
if [ -f "node_modules/nodemon/bin/nodemon.js" ] && [ ! -L "node_modules/.bin/nodemon" ]; then
    ln -sf ../nodemon/bin/nodemon.js node_modules/.bin/nodemon 2>/dev/null || true
fi

echo "=== [3/3] Generando archivo .env del Backend ==="
cat <<EOF > .env
PORT=4000
DB_HOST=$DB_HOST
DB_USER=farmacia_user
DB_PASSWORD=admin123
DB_NAME=farmacia_inventario
DB_PORT=5432
JWT_SECRET=tu_clave_secreta_super_segura_2026
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=sandbox_user
EMAIL_PASS=sandbox_pass
EMAIL_FROM=no-reply@farmacia.com
EMAIL_ADMIN=admin@farmacia.com
EOF

PUB_IP=$(curl -s -m 2 https://checkip.amazonaws.com 2>/dev/null || curl -s -m 2 https://api.ipify.org 2>/dev/null || curl -s -m 2 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
PUB_IP=$(echo "$PUB_IP" | tr -d ' \r\n')

echo ""
echo "=========================================================="
echo "✅ Backend configurado con éxito!"
echo ""
echo "1. Base de Datos conectada: $DB_HOST:5432 (farmacia_inventario)"
echo "2. Backend API disponible:   http://$PUB_IP:4000"
echo ""
echo "👉 COPIA ESTA IP PARA LA INSTANCIA 3 (Frontend):"
echo "   IP Pública de Backend: $PUB_IP"
echo ""
echo "Iniciando servidor Express en puerto 4000..."
echo "Presiona Ctrl+C para detener."
echo "=========================================================="

npm run dev
