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
echo "=== Configuración de ngrok para Telegram y n8n ==="
read -p "Ingresa tu Authtoken de ngrok (Enter si ya lo tienes configurado): " NGROK_TOKEN
read -p "Ingresa tu dominio estático de ngrok [Enter para usar 'splendor-satisfied-extent.ngrok-free.dev']: " NGROK_DOMAIN
NGROK_DOMAIN=$(echo "$NGROK_DOMAIN" | tr -d ' \r\n' | sed -e 's#^https\?://##' -e 's#/.*$##')
NGROK_DOMAIN=${NGROK_DOMAIN:-splendor-satisfied-extent.ngrok-free.dev}

echo ""
echo "=== [1/6] Configurando Memoria Virtual (Swap) en AWS ==="
# Las instancias t2.micro/t3.micro de AWS tienen solo 1GB de RAM y 0 de Swap.
# Sin Swap, la instalación de n8n consume toda la RAM y el kernel de Linux la detiene (Killed).
TOTAL_SWAP=$(free -m 2>/dev/null | awk '/^Swap:/{print $2}')
if [ -z "$TOTAL_SWAP" ] || [ "$TOTAL_SWAP" -lt 1024 ]; then
    echo "Configurando 2.5 GB de Swap para evitar que el instalador de n8n se quede sin memoria..."
    if [ ! -f /swapfile ]; then
        sudo fallocate -l 2.5G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2560
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
    fi
    sudo swapon /swapfile 2>/dev/null || true
    if ! grep -q '/swapfile' /etc/fstab 2>/dev/null; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo "Swap activado con éxito:"
    free -h
fi

echo ""
echo "=== [2/6] Instalando Node.js 20 LTS ==="
sudo apt update -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential

echo "=== [3/6] Instalando n8n y ngrok ==="
# Instalar n8n globalmente
if ! command -v n8n &> /dev/null; then
    echo "Instalando n8n globalmente..."
    sudo npm install -g n8n
fi

# Instalar ngrok
if ! command -v ngrok &> /dev/null; then
    echo "Descargando e instalando ngrok..."
    curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | sudo tar -xz -C /usr/local/bin
fi

# Configurar token de ngrok si se proporcionó
if [ -n "$NGROK_TOKEN" ]; then
    ngrok config add-authtoken "$NGROK_TOKEN" || true
fi

# Habilitar puertos en el firewall si ufw está activo
sudo ufw allow 4000/tcp 2>/dev/null || true
sudo ufw allow 5678/tcp 2>/dev/null || true

# Importar flujo de n8n si existe en el repositorio
WORKFLOW_FILE="$SCRIPT_DIR/../FlujoN8N/My workflow Farmacia.json"
if [ -f "$WORKFLOW_FILE" ]; then
    echo "Importando automáticamente el flujo de Farmacia a n8n..."
    n8n import:workflow --input="$WORKFLOW_FILE" 2>/dev/null || true
fi

echo "=== [4/6] Instalando dependencias del Backend ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

cd "$BACKEND_DIR"
npm install

# Corregir enlace simbólico de nodemon en Linux si es necesario
if [ -f "node_modules/nodemon/bin/nodemon.js" ] && [ ! -L "node_modules/.bin/nodemon" ]; then
    ln -sf ../nodemon/bin/nodemon.js node_modules/.bin/nodemon 2>/dev/null || true
fi

echo "=== [5/6] Generando archivo .env del Backend ==="
cat <<EOF > .env
PORT=4000
DB_HOST=$DB_HOST
DB_USER=farmacia_use
DB_PASSWORD=admin123
DB_NAME=farmacia_inventario
DB_PORT=5432
JWT_SECRET=tu_clave_secreta_super_segura_2026
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=sandbox_use
EMAIL_PASS=sandbox_pass
EMAIL_FROM=no-reply@farmacia.com
EMAIL_ADMIN=admin@farmacia.com
WEBHOOK_URL=https://$NGROK_DOMAIN/
EOF

PUB_IP=$(curl -s -m 2 https://checkip.amazonaws.com 2>/dev/null || curl -s -m 2 https://api.ipify.org 2>/dev/null || curl -s -m 2 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
PUB_IP=$(echo "$PUB_IP" | tr -d ' \r\n')

echo ""
echo "=========================================================="
echo "✅ Backend, n8n y ngrok configurados con éxito!"
echo ""
echo "1. IP de la Base de Datos conectada: $DB_HOST"
echo "2. Backend API corriendo en:          http://$PUB_IP:4000"
echo "3. Interfaz de n8n corriendo en:     http://$PUB_IP:5678"
echo "4. Túnel ngrok (Telegram Webhook):   https://$NGROK_DOMAIN"
echo ""
echo "👉 COPIA ESTA IP PARA LA INSTANCIA 3 (Frontend):"
echo "   IP Pública de Backend: $PUB_IP"
echo ""
echo "Iniciando Backend (4000) + n8n (5678) + ngrok (5678)..."
echo "Presiona Ctrl+C en cualquier momento para detener los servicios."
echo "=========================================================="

# Comando para ngrok
if [ -n "$NGROK_DOMAIN" ]; then
    NGROK_CMD="ngrok http 5678 --url=$NGROK_DOMAIN --log=stdout"
    N8N_CMD="WEBHOOK_URL=https://$NGROK_DOMAIN/ n8n start"
else
    NGROK_CMD="ngrok http 5678 --log=stdout"
    N8N_CMD="n8n start"
fi

# Ejecutar Backend, n8n y ngrok simultáneamente
npx concurrently -k -n "BACKEND,N8N,NGROK" -c "blue,green,magenta" \
    "npm run dev" \
    "$N8N_CMD" \
    "$NGROK_CMD"
