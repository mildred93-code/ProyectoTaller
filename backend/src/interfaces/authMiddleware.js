const jwt = require('jsonwebtoken');

// Nombres de rol que cuentan como administrador (sin importar mayúsculas)
const ADMIN_ROLES = ['admin', 'administrador'];

const normalize = (role) => String(role || '').trim().toLowerCase();

// Exige un token válido en el encabezado "Authorization: Bearer <token>".
// Si es válido, deja los datos del usuario en req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Debes iniciar sesión' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'La sesión expiró, inicia sesión de nuevo'
        : 'Sesión inválida, inicia sesión de nuevo';
    return res.status(401).json({ success: false, message });
  }
}

// Exige que el usuario (ya autenticado) tenga uno de los roles indicados.
// Para administradores acepta "admin" y "administrador".
function requireRole(...allowed) {
  const allowedNormalized = allowed.map(normalize);
  return (req, res, next) => {
    const role = normalize(req.user && req.user.role);
    const ok = allowedNormalized.includes(role) ||
      (allowedNormalized.some((r) => ADMIN_ROLES.includes(r)) && ADMIN_ROLES.includes(role));
    if (!ok) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para esta acción' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
