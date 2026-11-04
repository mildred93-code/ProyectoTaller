import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import {
  ShieldCheck,
  Activity,
  Layers,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Pill,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Si ya tiene sesión activa, redirigir al dashboard
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed?.email) {
          navigate('/dashboard', { replace: true });
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'No se pudo conectar con el servidor. Verifica tus credenciales o el estado de la API.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@farmacia.com');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F4F8FD] flex flex-col justify-center relative overflow-hidden px-4 py-8">
      
      {/* ========================================================
          ELEMENTOS DECORATIVOS ORGÁNICOS (INSPIRADOS EN IMÁGENES)
      ======================================================== */}
      {/* Gran forma orgánica superior izquierda en color sólido #94B2FF */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 bg-[#94B2FF] blob-shape-1 opacity-50 pointer-events-none transform -rotate-12"
      />
      {/* Forma orgánica inferior derecha en color sólido #94FFEA */}
      <div 
        className="absolute -bottom-36 -right-32 w-[30rem] h-[30rem] bg-[#94FFEA] blob-shape-2 opacity-55 pointer-events-none transform rotate-45"
      />
      {/* Círculo de acento en #94B2FF en la parte media */}
      <div 
        className="absolute top-1/4 -right-16 w-56 h-56 rounded-full bg-[#94B2FF] opacity-35 pointer-events-none"
      />

      {/* Matriz de puntos decorativa (Dot Grids) como en la referencia */}
      <div className="absolute top-8 left-12 w-28 h-28 dot-pattern-blue opacity-70 pointer-events-none" />
      <div className="absolute bottom-10 right-16 w-36 h-28 dot-pattern-mint opacity-80 pointer-events-none" />
      <div className="absolute top-1/2 left-8 w-20 h-32 dot-pattern-soft opacity-60 pointer-events-none hidden md:block" />

      {/* ========================================================
          TARJETA PRINCIPAL DE LOGIN (ESTILO EDITORIAL Y MODERNO)
      ======================================================== */}
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-12 bg-white rounded-[2.5rem] shadow-float overflow-hidden border-2 border-[#D8E4F5]">
          
          {/* LADO IZQUIERDO: Presentación de Farmacia con bloque pastel y formas orgánicas */}
          <div className="lg:col-span-5 bg-[#EEF4FF] p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#D8E4F5]">
            
            {/* Mancha orgánica interna en color sólido #94FFEA */}
            <div className="absolute -top-16 -right-16 w-60 h-60 bg-[#94FFEA] blob-shape-3 opacity-60 pointer-events-none" />
            <div className="absolute bottom-4 -left-12 w-44 h-44 bg-[#94B2FF] rounded-full opacity-30 pointer-events-none" />
            <div className="absolute top-1/3 right-4 w-16 h-20 dot-pattern-blue opacity-50 pointer-events-none" />

            <div className="relative z-10">
              {/* Logo e Identidad de Marca */}
              <div className="flex items-center gap-3.5 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#94B2FF] p-2.5 flex items-center justify-center shadow-md">
                  <Activity className="w-full h-full text-[#1E3A5F]" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#1E3A5F] flex items-center gap-1">
                    Pharma<span className="text-[#3867D6]">Trace</span>
                  </h1>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#94FFEA] text-[#0D6E58]">
                    Control & Analítica de Lotes
                  </span>
                </div>
              </div>

              {/* Título de Bienvenida Editorial */}
              <div className="space-y-3 mt-6">
                <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1E3A5F] leading-tight">
                  Gestión Inteligente de Inventario y Caducidades
                </h2>
                <p className="text-sm text-[#456586] leading-relaxed">
                  Plataforma médica y farmacéutica de alta precisión para el registro de lotes, semaforización preventiva y auditorías sanitarias.
                </p>
              </div>

              {/* Tarjetas de Beneficios en estilo limpio (Blanco sobre pastel) */}
              <div className="mt-8 space-y-3">
                
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-[#D8E4F5] shadow-card">
                  <div className="w-9 h-9 rounded-xl bg-[#94FFEA] flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#0D6E58]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E3A5F]">Semaforización Preventiva</h4>
                    <p className="text-[11px] text-[#456586] mt-0.5">Control de riesgo a 90 días para evitar mermas por caducidad.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-[#D8E4F5] shadow-card">
                  <div className="w-9 h-9 rounded-xl bg-[#94B2FF] flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-[#1E3A5F]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E3A5F]">Estrategia FEFO Automatizada</h4>
                    <p className="text-[11px] text-[#456586] mt-0.5">Prioridad de salida a medicamentos con fecha más cercana.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white border border-[#D8E4F5] shadow-card">
                  <div className="w-9 h-9 rounded-xl bg-[#D8E5FF] flex items-center justify-center flex-shrink-0">
                    <Pill className="w-5 h-5 text-[#1E3A5F]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E3A5F]">Normativa Farmacéutica</h4>
                    <p className="text-[11px] text-[#456586] mt-0.5">Trazabilidad completa con arquitectura hexagonal limpia.</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Pie institucional */}
            <div className="pt-8 border-t border-[#D8E4F5] flex items-center justify-between text-xs text-[#456586] relative z-10 mt-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#94FFEA] text-[#0D6E58] font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#0D6E58] animate-pulse"></span>
                Servidor Activo
              </span>
              <span className="font-semibold text-[#38577A]">v2.4 Farmacia</span>
            </div>
          </div>

          {/* LADO DERECHO: Formulario de Autenticación */}
          <div className="lg:col-span-7 p-8 lg:p-14 flex flex-col justify-center bg-white relative">
            <div className="max-w-md mx-auto w-full">
              
              <div className="mb-8">
                {/* Pastilla superior de estado */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#94FFEA] text-[#0D6E58] mb-3 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-[#0D6E58]" />
                  Acceso Seguro al Sistema
                </div>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-[#1E3A5F] tracking-tight">
                  Iniciar Sesión
                </h3>
                <p className="text-sm text-[#456586] mt-1.5">
                  Ingresa las credenciales autorizadas por la administración farmacéutica.
                </p>
              </div>

              {/* Mensaje de error (en tonos pastel suaves, sin color negro) */}
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-[#FFEAEA] border border-[#FFBFBF] text-[#A82828] text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#C43232] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Error de autenticación</strong>
                    <span className="text-xs leading-relaxed">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3A5F] mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94B2FF]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="admin@farmacia.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-[#F4F8FD] border-2 border-[#D8E4F5] rounded-2xl text-sm text-[#1E3A5F] font-medium placeholder-[#8DA7C4] focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1E3A5F] mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94B2FF]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 bg-[#F4F8FD] border-2 border-[#D8E4F5] rounded-2xl text-sm text-[#1E3A5F] font-medium placeholder-[#8DA7C4] focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#6B8BAA] hover:text-[#1E3A5F] focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botón de Entrada Principal con color sólido #94B2FF */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3.5 px-6 rounded-2xl font-extrabold text-[#1E3A5F] bg-[#94B2FF] hover:bg-[#82A5FF] transition-all duration-200 flex items-center justify-center gap-2 shadow-card hover:shadow-float hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none disabled:transform-none border border-[#82A5FF]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
                      <span>Validando credenciales...</span>
                    </div>
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <ArrowRight className="w-4 h-4 text-[#1E3A5F]" />
                    </>
                  )}
                </button>
              </form>

              {/* Botón rápido para pruebas (autollenado demo en color sólido #94FFEA) */}
              <div className="mt-8 pt-6 border-t border-[#D8E4F5] text-center">
                <p className="text-xs text-[#456586] mb-2 font-medium">¿Deseas probar con la cuenta precargada?</p>
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="text-xs font-bold text-[#0D6E58] bg-[#94FFEA] hover:bg-[#7EFBE2] px-4 py-2 rounded-full border border-[#7EFBE2] transition-all shadow-sm inline-flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0D6E58]" />
                  <span>Cargar datos de Encargado (admin@farmacia.com)</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
