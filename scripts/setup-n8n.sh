#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "   Configuración de Instancia 4: n8n + ngrok (Telegram)   "
echo "=========================================================="
echo ""

DB_HOST="$1"
if [ -z "$DB_HOST" ]; then
    read -p "Ingresa la IP de la máquina de Base de Datos (Instancia 1): " DB_HOST
fi
DB_HOST=$(echo "$DB_HOST" | tr -d ' \r\n' | sed -e 's#^https\?://##' -e 's#:.*$##' -e 's#/.*$##')

echo ""
read -p "Ingresa tu Authtoken de ngrok (Enter si ya lo tienes configurado): " NGROK_TOKEN
read -p "Ingresa tu dominio de ngrok [Enter para 'splendor-satisfied-extent.ngrok-free.dev']: " NGROK_DOMAIN
NGROK_DOMAIN=$(echo "$NGROK_DOMAIN" | tr -d ' \r\n' | sed -e 's#^https\?://##' -e 's#/.*$##')
NGROK_DOMAIN=${NGROK_DOMAIN:-splendor-satisfied-extent.ngrok-free.dev}

echo ""
echo "=== [1/5] Optimizando Espacio en Disco y Memoria Virtual (Swap) ==="
# Limpieza de temporales y cachés
sudo swapoff -a 2>/dev/null || true
sudo rm -f /swapfile* 2>/dev/null || true
sudo apt clean 2>/dev/null || true
sudo rm -rf /root/.npm /home/ubuntu/.npm /tmp/* /var/tmp/* 2>/dev/null || true
sudo journalctl --vacuum-size=20M 2>/dev/null || true

# Crear Swap equilibrado de 1 GB (evita que el kernel mate el instalador de n8n)
echo "Configurando 1 GB de Swap..."
sudo fallocate -l 1G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile 2>/dev/null || true

if ! grep -q '/swapfile' /etc/fstab 2>/dev/null; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "Memoria y Disco disponibles:"
free -h
df -h /

echo ""
echo "=== [2/5] Instalando Node.js 22 LTS ==="
sudo apt update -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential
sudo apt clean 2>/dev/null || true

echo "=== [3/5] Instalando n8n y herramientas ==="
# Limpieza de paquetes corruptos previos si los hubiera
sudo rm -rf /usr/lib/node_modules/n8n* /usr/local/lib/node_modules/n8n* 2>/dev/null || true

echo "Instalando n8n y concurrently globalmente..."
sudo npm install -g n8n concurrently --no-fund --no-audit
sudo npm cache clean --force 2>/dev/null || true
sudo rm -rf /root/.npm /tmp/* 2>/dev/null || true

echo "=== [4/5] Instalando y Configurando ngrok ==="
if ! command -v ngrok &> /dev/null; then
    echo "Descargando binario oficial de ngrok..."
    curl -sSL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz | sudo tar -xz -C /usr/local/bin
fi

if [ -n "$NGROK_TOKEN" ]; then
    ngrok config add-authtoken "$NGROK_TOKEN" || true
fi

# Habilitar puerto 5678 en firewall
sudo ufw allow 5678/tcp 2>/dev/null || true

# Importar flujo de Farmacia si existe en el repositorio
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW_FILE="$SCRIPT_DIR/../FlujoN8N/My workflow Farmacia.json"
if [ -f "$WORKFLOW_FILE" ]; then
    echo "Importando flujo 'My workflow Farmacia' a n8n..."
    n8n import:workflow --input="$WORKFLOW_FILE" 2>/dev/null || true
fi

PUB_IP=$(curl -s -m 2 https://checkip.amazonaws.com 2>/dev/null || curl -s -m 2 https://api.ipify.org 2>/dev/null || curl -s -m 2 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
PUB_IP=$(echo "$PUB_IP" | tr -d ' \r\n')

echo ""
echo "=========================================================="
echo "✅ n8n y ngrok configurados con éxito!"
echo ""
echo "1. Panel de n8n Web:               http://$PUB_IP:5678"
echo "2. Túnel público ngrok (Telegram): https://$NGROK_DOMAIN"
echo ""
echo "👉 DATOS PARA EL NODO DE POSTGRES EN n8n:"
echo "   Host:     $DB_HOST"
echo "   Puerto:   5432"
echo "   Database: farmacia_inventario"
echo "   Usuario:  farmacia_user"
echo "   Password: admin123"
echo ""
echo "Iniciando n8n (5678) y ngrok (5678)..."
echo "Presiona Ctrl+C en cualquier momento para detener los servicios."
echo "=========================================================="

if [ -n "$NGROK_DOMAIN" ]; then
    NGROK_CMD="ngrok http 5678 --url=$NGROK_DOMAIN --log=stdout"
    N8N_CMD="WEBHOOK_URL=https://$NGROK_DOMAIN/ n8n start"
else
    NGROK_CMD="ngrok http 5678 --log=stdout"
    N8N_CMD="n8n start"
fi

concurrently -k -n "N8N,NGROK" -c "green,magenta" \
    "$N8N_CMD" \
    "$NGROK_CMD"

