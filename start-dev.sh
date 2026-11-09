#!/usr/bin/env bash
# Script para iniciar Backend (Express), n8n y ngrok simultáneamente en WSL

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/backend"

echo "============================================================"
echo "🚀 Iniciando Backend (4000), n8n (5678) y ngrok (túnel 5678 para Telegram)..."
echo "Presiona Ctrl+C en cualquier momento para detener todos."
echo "============================================================"

npm run dev:all

