import React from 'react';
import {
  Activity,
  Layers,
  BarChart3,
  FileSpreadsheet,
  Plus,
  LogOut,
  User,
  ShieldCheck,
  CheckCircle2,
  History
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  onOpenNewLote,
  onLogout,
  totalLotes = 0
}) {
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const userRole = user?.role || 'Farmacéutico';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-[#D8E4F5] shadow-card no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo y Nombre del Sistema */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#94B2FF] p-2.5 flex items-center justify-center shadow-md">
              <Activity className="w-full h-full text-[#1E3A5F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#1E3A5F]">
                  Pharma<span className="text-[#3867D6]">Trace</span>
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#94FFEA] text-[#0D6E58] border border-[#7EFBE2]">
                  Farmacia & Lotes
                </span>
              </div>
              <p className="text-[11px] text-[#456586] font-medium hidden sm:block">
                Control de Caducidades & Trazabilidad
              </p>
            </div>
          </div>

          {/* Pestañas de Navegación Principal en Pastillero Flotante */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#EEF4FF] p-1.5 rounded-full border border-[#D8E4F5]">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'inventory'
                  ? 'bg-[#94B2FF] text-[#1E3A5F] shadow-sm'
                  : 'text-[#456586] hover:text-[#1E3A5F] hover:bg-[#D8E5FF]/60'
              }`}
            >
              <Layers className="w-4 h-4 text-[#1E3A5F]" />
              <span>Inventario</span>
              {totalLotes > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#94FFEA] text-[#0D6E58]">
                  {totalLotes}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'movements'
                  ? 'bg-[#94B2FF] text-[#1E3A5F] shadow-sm'
                  : 'text-[#456586] hover:text-[#1E3A5F] hover:bg-[#D8E5FF]/60'
              }`}
            >
              <History className="w-4 h-4 text-[#1E3A5F]" />
              <span>Historial</span>
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'metrics'
                  ? 'bg-[#94B2FF] text-[#1E3A5F] shadow-sm'
                  : 'text-[#456586] hover:text-[#1E3A5F] hover:bg-[#D8E5FF]/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#1E3A5F]" />
              <span>Métricas</span>
              <span className="w-2 h-2 rounded-full bg-[#94FFEA] animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'reports'
                  ? 'bg-[#94B2FF] text-[#1E3A5F] shadow-sm'
                  : 'text-[#456586] hover:text-[#1E3A5F] hover:bg-[#D8E5FF]/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#1E3A5F]" />
              <span>Reportes</span>
            </button>
          </nav>

          {/* Acciones Rápidas y Perfil del Usuario */}
          <div className="flex items-center gap-3">

            {/* Botón rápido para registrar lote en color sólido #94FFEA */}
            <button
              onClick={onOpenNewLote}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold bg-[#94FFEA] hover:bg-[#7EFBE2] text-[#0D6E58] border border-[#7EFBE2] shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 text-[#0D6E58]" />
              <span>Nuevo Lote</span>
            </button>

            {/* Chip del Usuario Activo */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#F4F8FD] rounded-full border border-[#D8E4F5]">
              <div className="w-8 h-8 rounded-full bg-[#94B2FF] flex items-center justify-center text-[#1E3A5F] font-black text-xs shadow-sm">
                {userInitial}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-[#1E3A5F] leading-tight max-w-[130px] truncate">
                  {user?.email || 'Administrador'}
                </div>
                <div className="text-[10px] text-[#456586] font-medium leading-none">
                  {userRole}
                </div>
              </div>
            </div>

            {/* Botón de Cerrar Sesión */}
            <button
              onClick={onLogout}
              className="p-2 rounded-full bg-[#FFEAEA] hover:bg-[#FFD6D6] text-[#A82828] border border-[#FFBFBF] transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Barra de navegación móvil */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-[#D8E4F5]">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              activeTab === 'inventory'
                ? 'bg-[#94B2FF] text-[#1E3A5F]'
                : 'text-[#456586]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Inventario</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              activeTab === 'movements'
                ? 'bg-[#94B2FF] text-[#1E3A5F]'
                : 'text-[#456586]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              activeTab === 'metrics'
                ? 'bg-[#94B2FF] text-[#1E3A5F]'
                : 'text-[#456586]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Métricas</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              activeTab === 'reports'
                ? 'bg-[#94B2FF] text-[#1E3A5F]'
                : 'text-[#456586]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Reportes</span>
          </button>
        </div>

      </div>
    </header>
  );
}
