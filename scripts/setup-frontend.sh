#!/usr/bin/env bash
set -e

BACKEND_IP="$1"
if [ -z "$BACKEND_IP" ]; then
    read -p "Ingresa la IP Pública de la máquina de Backend (Instancia 2): " BACKEND_IP
fi

# Sanitizar entrada de BACKEND_IP (remover http://, https://, espacios y puertos como :4000)
BACKEND_IP=$(echo "$BACKEND_IP" | tr -d ' \r\n' | sed -e 's#^https\?://##' -e 's#:.*$##' -e 's#/.*$##')

if [ -z "$BACKEND_IP" ]; then
    echo "Error: La IP del backend es requerida."
    exit 1
fi

echo ""
echo "=== Configurando Memoria Virtual (Swap) en AWS ==="
sudo apt clean 2>/dev/null || true
TOTAL_SWAP=$(free -m 2>/dev/null | awk '/^Swap:/{print $2}')
if [ -z "$TOTAL_SWAP" ] || [ "$TOTAL_SWAP" -lt 512 ]; then
    echo "Configurando Swap ligero de 512 MB..."
    if [ ! -f /swapfile ]; then
        sudo fallocate -l 512M /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=512
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
    fi
    sudo swapon /swapfile 2>/dev/null || true
    if ! grep -q '/swapfile' /etc/fstab 2>/dev/null; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo "Swap activado con éxito."
fi

echo ""
echo "=== [1/3] Instalando Node.js 22 LTS ==="
sudo apt update -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential

# Permitir puerto 5173 en el firewall de Ubuntu si ufw está activo
sudo ufw allow 5173/tcp 2>/dev/null || true

echo "=== [2/3] Instalando dependencias de Frontend ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

cd "$FRONTEND_DIR"
npm install
# Librería para el lector de código de barras
npm install html5-qrcode@2.3.8

echo "=== [3/3] Configurando conexión hacia el Backend ==="
# Generar archivo .env para Vite
cat <<EOF > .env
VITE_API_URL=http://$BACKEND_IP:4000/api
EOF

# Asegurar que axiosClient use la variable de entorno de Vite
if [ -f "src/api/axiosClient.js" ]; then
    sed -i "s|baseURL: 'http://localhost:4000/api'|baseURL: import.meta.env.VITE_API_URL \|\| 'http://localhost:4000/api'|g" src/api/axiosClient.js
fi

PUB_IP=$(curl -s -m 2 https://checkip.amazonaws.com 2>/dev/null || curl -s -m 2 https://api.ipify.org 2>/dev/null || curl -s -m 2 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
PUB_IP=$(echo "$PUB_IP" | tr -d ' \r\n')

echo ""
echo "=========================================================="
echo "✅ Frontend configurado con éxito!"
echo "   Conectado al Backend en: http://$BACKEND_IP:4000/api"
echo ""
echo "👉 Abre en tu navegador:"
echo "   http://$PUB_IP:5173"
echo ""
echo "Datos para iniciar sesión en el Sistema de Farmacia:"
echo "   Usuario:    admin@farmacia.com"
echo "   Contraseña: admin123"
echo "=========================================================="
echo ""
echo "Iniciando servidor Frontend en puerto 5173..."
echo "Presiona Ctrl+C para detener."
echo ""

npm run dev -- --host 0.0.0.0 --port 5173
