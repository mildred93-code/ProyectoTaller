import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Componente para proteger rutas que requieren autenticación.
 * Redirige al inicio de sesión si no existe una sesión activa.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const storedUser = localStorage.getItem('user');

  if (!storedUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    if (!user || !user.email) {
      localStorage.removeItem('user');
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

