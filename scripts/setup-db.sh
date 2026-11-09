#!/usr/bin/env bash
set -e

echo "=== [1/4] Instalando PostgreSQL ==="
sudo apt update -y
sudo apt install -y postgresql postgresql-contrib

# Permitir puerto 5432 en el firewall de Ubuntu si ufw está activo
sudo ufw allow 5432/tcp 2>/dev/null || true

echo "=== [2/4] Configurando Base de Datos (farmacia_inventario) y Usuarios ==="
# Terminar conexiones activas antes de recrear para evitar errores de base en uso
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'farmacia_inventario' AND pid <> pg_backend_pid();" 2>/dev/null || true
sudo -u postgres psql -c "DROP DATABASE IF EXISTS farmacia_inventario WITH (FORCE);" 2>/dev/null || sudo -u postgres psql -c "DROP DATABASE IF EXISTS farmacia_inventario;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE farmacia_inventario;"

# Crear usuario farmacia_user y asegurar permisos
sudo -u postgres psql -c "DROP USER IF EXISTS farmacia_user;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER farmacia_user WITH ENCRYPTED PASSWORD 'admin123';"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'admin123';" 2>/dev/null || true

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE farmacia_inventario TO farmacia_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE farmacia_inventario TO postgres;"
sudo -u postgres psql -d farmacia_inventario -c "GRANT ALL ON SCHEMA public TO farmacia_user;"
sudo -u postgres psql -d farmacia_inventario -c "GRANT ALL ON SCHEMA public TO postgres;"

echo "=== [3/4] Habilitando conexiones remotas en PostgreSQL ==="
PG_CONF=$(sudo find /etc/postgresql -name "postgresql.conf" 2>/dev/null | head -n 1)
PG_HBA=$(sudo find /etc/postgresql -name "pg_hba.conf" 2>/dev/null | head -n 1)

# Habilitar escucha en todas las interfaces de red
if [ -n "$PG_CONF" ] && [ -f "$PG_CONF" ]; then
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
    sudo sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
    if ! sudo grep -q "listen_addresses = '\*'" "$PG_CONF"; then
        echo "listen_addresses = '*'" | sudo tee -a "$PG_CONF"
    fi
fi

# Permitir conexiones remotas (soportando scram-sha-256 y md5)
if [ -n "$PG_HBA" ] && [ -f "$PG_HBA" ]; then
    if ! sudo grep -q "0.0.0.0/0" "$PG_HBA"; then
        echo "host    all             all             0.0.0.0/0               scram-sha-256" | sudo tee -a "$PG_HBA"
        echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a "$PG_HBA"
    fi
fi

sudo systemctl restart postgresql

echo "=== [4/4] Ejecutando scripts SQL de Farmacia ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BD_DIR="$SCRIPT_DIR/../backend/bd"

# 1. Esquema base y datos iniciales
if [ -f "$BD_DIR/tablas_farmacia.sql" ]; then
    echo "-> Ejecutando tablas_farmacia.sql..."
    cat "$BD_DIR/tablas_farmacia.sql" | sudo -u postgres psql -d farmacia_inventario
else
    echo "Error: No se encontró $BD_DIR/tablas_farmacia.sql"
    exit 1
fi

# 2. Migración 02: Lotes y validaciones
if [ -f "$BD_DIR/migracion_02_lotes.sql" ]; then
    echo "-> Ejecutando migracion_02_lotes.sql..."
    cat "$BD_DIR/migracion_02_lotes.sql" | sudo -u postgres psql -d farmacia_inventario
fi

# 3. Migración 03: Código de barras
if [ -f "$BD_DIR/migracion_03_codigo_barras.sql" ]; then
    echo "-> Ejecutando migracion_03_codigo_barras.sql..."
    cat "$BD_DIR/migracion_03_codigo_barras.sql" | sudo -u postgres psql -d farmacia_inventario
fi

# Asignar permisos sobre todas las tablas y secuencias creadas
sudo -u postgres psql -d farmacia_inventario -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO farmacia_user;"
sudo -u postgres psql -d farmacia_inventario -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO farmacia_user;"
sudo -u postgres psql -d farmacia_inventario -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO farmacia_user;"
sudo -u postgres psql -d farmacia_inventario -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO farmacia_user;"

sudo -u postgres psql -d farmacia_inventario -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;"
sudo -u postgres psql -d farmacia_inventario -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;"

# Transferir la propiedad de las tablas a farmacia_use
sudo -u postgres psql -d farmacia_inventario <<'SQL'
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I OWNER TO farmacia_user', r.tablename);
    END LOOP;

    FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER SEQUENCE public.%I OWNER TO farmacia_user', r.sequencename);
    END LOOP;
END $$;
SQL

echo "Tablas y permisos configurados exitosamente."

PRIV_IP=$(hostname -I | awk '{print $1}')
PUB_IP=$(curl -s -m 2 https://checkip.amazonaws.com 2>/dev/null || curl -s -m 2 https://api.ipify.org 2>/dev/null || curl -s -m 2 ifconfig.me 2>/dev/null || echo "$PRIV_IP")
PUB_IP=$(echo "$PUB_IP" | tr -d ' \r\n')

echo ""
echo "=========================================================="
echo "✅ Base de datos 'farmacia_inventario' configurada con éxito."
echo ""
echo "👉 COPIA ESTA IP PARA CONFIGURAR LA INSTANCIA 2 (Backend):"
echo "   IP Privada (Recomendada en AWS si están en la misma VPC): $PRIV_IP"
if [ "$PUB_IP" != "$PRIV_IP" ] && [ -n "$PUB_IP" ]; then
echo "   IP Pública (Alternativa si están en redes separadas):    $PUB_IP"
fi
echo "=========================================================="
