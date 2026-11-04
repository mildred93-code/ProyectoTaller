-- 1. Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT REFERENCES roles(id) ON DELETE SET NULL
);

-- 3. Tabla del Catálogo de Medicamentos
CREATE TABLE IF NOT EXISTS medicamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL
);

-- 4. Tabla de Lotes (Vital para el control de caducidad y semaforización)
CREATE TABLE IF NOT EXISTS lotes (
    id SERIAL PRIMARY KEY,
    medicamento_id INT REFERENCES medicamentos(id) ON DELETE CASCADE,
    numero_lote VARCHAR(50) NOT NULL,
    stock INT NOT NULL,
    fecha_caducidad DATE NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Movimientos / Auditoría de Inventario (Ideal para integraciones futuras con Node-RED / Lectores)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    lote_id INT REFERENCES lotes(id) ON DELETE CASCADE,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_movimiento VARCHAR(20) NOT NULL, -- 'ENTREGA', 'VENTA', 'MERMA_CADUCIDAD'
    cantidad INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- DATOS INICIALES DE PRUEBA
-- ==========================================

INSERT INTO roles (nombre) VALUES 
('Administrador'), 
('Farmaceutico')
ON CONFLICT (nombre) DO NOTHING;

-- Contraseña por defecto (hash para: admin123)
INSERT INTO usuarios (nombre, email, password_hash, rol_id) VALUES
('Encargado General', 'admin@farmacia.com', '$2a$10$iP9ic04xp1yfWKsiVmB9z.m6UJJPEB31wNTJRmVnDVMXqRWervZKy', 1)
ON CONFLICT (email) DO NOTHING;

INSERT INTO medicamentos (nombre, descripcion, precio) VALUES
('Paracetamol 500mg', 'Analgésico y antipirético en tabletas', 45.00),
('Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 60.50),
('Amoxicilina 500mg', 'Antibiótico de amplio espectro', 120.00);

INSERT INTO lotes (medicamento_id, numero_lote, stock, fecha_caducidad) VALUES
(1, 'LOT-PAR-2026A', 50, '2026-11-30'),
(2, 'LOT-IBU-2026B', 30, '2026-05-10'), -- Este ya estaría cerca/por vencer según la fecha actual
(3, 'LOT-AMX-2027C', 20, '2027-08-15');