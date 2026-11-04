import React, { useEffect, useState, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import LoteForm from '../components/LoteForm';
import ExpirationBadge from '../components/ExpirationBadge';
import MetricsDashboard from '../components/MetricsDashboard';
import AnalyticsReports from '../components/AnalyticsReports';
import {
  Layers,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowUpDown,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Usuario activo en sesión
  const [currentUser, setCurrentUser] = useState(null);

  // Pestaña activa ('inventory' | 'metrics' | 'reports')
  const [activeTab, setActiveTab] = useState('inventory');

  // Visibilidad del formulario de nuevo lote
  const [showLoteForm, setShowLoteForm] = useState(false);

  // Filtros de la tabla de inventario
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'VIGENTE' | 'POR_VENCER' | 'CADUCADO'
  const [sortBy, setSortBy] = useState('expirationDate'); // 'expirationDate' | 'name' | 'stock'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error('Error al leer el usuario:', e);
      }
    }

    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setRefreshing(true);
    setError('');
    try {
      const response = await axiosClient.get('/products');
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('No se pudo conectar con el servicio de base de datos. Verifique que el backend esté encendido.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const medicamentosExistentes = useMemo(() => {
    return [...new Set(products.map((p) => p.name))].sort();
  }, [products]);

  const quickCounts = useMemo(() => {
    let vigentes = 0;
    let porVencer = 0;
    let caducados = 0;
    let totalStock = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    products.forEach((p) => {
      totalStock += Number(p.stock) || 0;
      const status = p.status ? p.status.toUpperCase() : '';
      const expDate = new Date(p.expirationDate);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

      if (status === 'CADUCADO' || diffDays < 0) {
        caducados++;
      } else if (status === 'POR_VENCER' || diffDays <= 90) {
        porVencer++;
      } else {
        vigentes++;
      }
    });

    return {
      total: products.length,
      totalStock,
      vigentes,
      porVencer,
      caducados
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        const status = item.status ? item.status.toUpperCase() : 'VIGENTE';
        if (filterStatus !== 'ALL') {
          if (filterStatus === 'CADUCADO' && status !== 'CADUCADO') return false;
          if (filterStatus === 'POR_VENCER' && status !== 'POR_VENCER') return false;
          if (filterStatus === 'VIGENTE' && status !== 'VIGENTE') return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchBatch = item.batchNumber.toLowerCase().includes(q);
          if (!matchName && !matchBatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA, valB;
        if (sortBy === 'expirationDate') {
          valA = new Date(a.expirationDate).getTime();
          valB = new Date(b.expirationDate).getTime();
        } else if (sortBy === 'stock') {
          valA = Number(a.stock);
          valB = Number(b.stock);
        } else {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [products, filterStatus, searchQuery, sortBy, sortDirection]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FD] text-[#1E3A5F] flex flex-col relative overflow-x-hidden">
      
      {/* Elementos orgánicos y patrones de puntos en el fondo */}
      <div className="absolute top-20 right-0 w-80 h-80 bg-[#94FFEA] blob-shape-1 opacity-25 pointer-events-none -mr-20 -z-0" />
      <div className="absolute top-96 left-0 w-96 h-96 bg-[#94B2FF] blob-shape-2 opacity-25 pointer-events-none -ml-28 -z-0" />
      <div className="absolute top-32 right-12 w-28 h-28 dot-pattern-blue opacity-40 pointer-events-none -z-0 hidden md:block" />
      <div className="absolute bottom-40 left-10 w-32 h-32 dot-pattern-mint opacity-50 pointer-events-none -z-0 hidden md:block" />

      {/* Barra de Navegación Institucional */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onOpenNewLote={() => {
          setActiveTab('inventory');
          setShowLoteForm(true);
        }}
        onLogout={handleLogout}
        totalLotes={products.length}
      />

      {/* Banner superior con información de usuario y estado operativo */}
      <div className="bg-white border-b-2 border-[#D8E4F5] px-4 sm:px-6 lg:px-8 py-3.5 no-print relative z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4FF] font-bold text-[#1E3A5F] border border-[#D8E4F5]">
              <Building2 className="w-3.5 h-3.5 text-[#94B2FF]" />
              <strong>Sede:</strong> Farmacia Central & Almacén
            </span>
            <span className="text-[#B4CCFE] hidden sm:inline">•</span>
            <span className="text-[#456586]">
              Operador: <strong className="text-[#1E3A5F]">{currentUser?.email || 'Encargado General'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[#456586] font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#94B2FF]" />
              {new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            <button
              onClick={fetchProducts}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4FF] hover:bg-[#D8E5FF] text-[#1E3A5F] font-bold border border-[#D8E4F5] transition-colors"
              title="Sincronizar inventario"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#3867D6] ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full relative z-10">
        
        {/* Alerta de error si el servidor no responde */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FFEAEA] border border-[#FFBFBF] text-[#A82828] text-sm flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-[#C43232] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Error de conexión al almacén de datos</strong>
              <span className="text-xs">{error}</span>
            </div>
          </div>
        )}

        {/* ========================================================
            PESTAÑA 1: INVENTARIO Y GESTIÓN DE LOTES
        ======================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            
            {/* Formulario de registro desplegable */}
            {showLoteForm && (
              <LoteForm
                medicamentos={medicamentosExistentes}
                onCreated={async () => {
                  await fetchProducts();
                  setShowLoteForm(false);
                }}
                onCancel={() => setShowLoteForm(false)}
              />
            )}

            {/* Tarjetas interactivas de resumen rápido de lotes (Estilo Editorial con colores sólidos) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Tarjeta: Todos los Lotes */}
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`p-5 rounded-[2rem] border-2 text-left transition-all duration-200 ${
                  filterStatus === 'ALL'
                    ? 'bg-[#94B2FF] text-[#1E3A5F] border-[#7CA0FF] shadow-card scale-[1.02]'
                    : 'bg-white text-[#1E3A5F] border-[#D8E4F5] hover:border-[#94B2FF] shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-extrabold uppercase tracking-wider text-[11px]">Todos los Lotes</span>
                  <div className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5 text-[#1E3A5F]" />
                  </div>
                </div>
                <div className="text-3xl font-black">{quickCounts.total}</div>
                <div className="text-xs font-semibold opacity-80 mt-1">
                  {quickCounts.totalStock.toLocaleString()} unidades totales
                </div>
              </button>

              {/* Tarjeta: Vigentes (Color Sólido #94FFEA) */}
              <button
                type="button"
                onClick={() => setFilterStatus('VIGENTE')}
                className={`p-5 rounded-[2rem] border-2 text-left transition-all duration-200 ${
                  filterStatus === 'VIGENTE'
                    ? 'bg-[#94FFEA] text-[#0D6E58] border-[#7EFBE2] shadow-card scale-[1.02]'
                    : 'bg-white text-[#1E3A5F] border-[#D8E4F5] hover:border-[#94FFEA] shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#0D6E58]">Vigentes</span>
                  <div className="w-7 h-7 rounded-full bg-[#D9FFF7] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D6E58]" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#0D6E58]">{quickCounts.vigentes}</div>
                <div className="text-xs font-semibold text-[#0D6E58]/80 mt-1">&gt; 90 días útiles</div>
              </button>

              {/* Tarjeta: Por Vencer */}
              <button
                type="button"
                onClick={() => setFilterStatus('POR_VENCER')}
                className={`p-5 rounded-[2rem] border-2 text-left transition-all duration-200 ${
                  filterStatus === 'POR_VENCER'
                    ? 'bg-[#FFF2D6] text-[#995C00] border-[#FFE0A3] shadow-card scale-[1.02]'
                    : 'bg-white text-[#1E3A5F] border-[#D8E4F5] hover:border-[#FFE0A3] shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#995C00]">Por Vencer</span>
                  <div className="w-7 h-7 rounded-full bg-[#FFE7B8] flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#995C00]" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#995C00]">{quickCounts.porVencer}</div>
                <div className="text-xs font-semibold text-[#995C00]/80 mt-1">≤ 90 días (FEFO)</div>
              </button>

              {/* Tarjeta: Caducados */}
              <button
                type="button"
                onClick={() => setFilterStatus('CADUCADO')}
                className={`p-5 rounded-[2rem] border-2 text-left transition-all duration-200 ${
                  filterStatus === 'CADUCADO'
                    ? 'bg-[#FFEAEA] text-[#A82828] border-[#FFBFBF] shadow-card scale-[1.02]'
                    : 'bg-white text-[#1E3A5F] border-[#D8E4F5] hover:border-[#FFBFBF] shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#A82828]">Caducados</span>
                  <div className="w-7 h-7 rounded-full bg-[#FFD6D6] flex items-center justify-center">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#A82828]" />
                  </div>
                </div>
                <div className="text-3xl font-black text-[#A82828]">{quickCounts.caducados}</div>
                <div className="text-xs font-semibold text-[#A82828]/80 mt-1">Retiro de anaquel</div>
              </button>

            </div>

            {/* Barra de Búsqueda y Botón para agregar lote */}
            <div className="bg-white rounded-[2rem] p-5 shadow-card border-2 border-[#D8E4F5] flex flex-col md:flex-row items-center justify-between gap-4">
              
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-[#94B2FF] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar medicamento o número de lote..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-xs text-[#1E3A5F] font-semibold placeholder-[#8DA7C4] focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#456586] font-bold hidden sm:inline">Filtrar:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-xs text-[#1E3A5F] font-bold focus:outline-none focus:border-[#94B2FF]"
                  >
                    <option value="ALL">Todos los lotes</option>
                    <option value="VIGENTE">Solo Vigentes</option>
                    <option value="POR_VENCER">Solo Por Vencer</option>
                    <option value="CADUCADO">Solo Caducados</option>
                  </select>
                </div>

                {!showLoteForm && (
                  <button
                    onClick={() => setShowLoteForm(true)}
                    className="px-5 py-2.5 rounded-full text-xs font-extrabold text-[#0D6E58] bg-[#94FFEA] hover:bg-[#7EFBE2] border border-[#7EFBE2] transition-all shadow-sm hover:shadow-card hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 text-[#0D6E58]" />
                    <span>Registrar Nuevo Lote</span>
                  </button>
                )}
              </div>

            </div>

            {/* Tabla Principal de Lotes */}
            <div className="bg-white rounded-[2rem] shadow-card border-2 border-[#D8E4F5] overflow-hidden">
              <div className="px-6 py-5 bg-[#EEF4FF] border-b-2 border-[#D8E4F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-[#1E3A5F] tracking-tight">
                    Catálogo de Lotes y Semaforización
                  </h3>
                  <p className="text-xs text-[#456586] mt-0.5 font-medium">
                    Mostrando {filteredProducts.length} de {products.length} lotes registrados
                  </p>
                </div>

                <div className="text-xs text-[#456586] bg-white px-3.5 py-1.5 rounded-full border border-[#D8E4F5] font-semibold">
                  Orden: <span className="font-extrabold text-[#1E3A5F] capitalize">{sortBy}</span> ({sortDirection})
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFD] text-[#38577A] uppercase text-[10px] font-black border-b-2 border-[#D8E4F5]">
                      
                      <th className="p-4 cursor-pointer hover:bg-[#EEF4FF] transition-colors" onClick={() => toggleSort('name')}>
                        <div className="flex items-center gap-1.5">
                          <span>Medicamento</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#94B2FF]" />
                        </div>
                      </th>

                      <th className="p-4">
                        <span>No. de Lote</span>
                      </th>

                      <th className="p-4 cursor-pointer hover:bg-[#EEF4FF] transition-colors" onClick={() => toggleSort('stock')}>
                        <div className="flex items-center gap-1.5">
                          <span>Stock en Almacén</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#94B2FF]" />
                        </div>
                      </th>

                      <th className="p-4 cursor-pointer hover:bg-[#EEF4FF] transition-colors" onClick={() => toggleSort('expirationDate')}>
                        <div className="flex items-center gap-1.5">
                          <span>Fecha Caducidad</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#94B2FF]" />
                        </div>
                      </th>

                      <th className="p-4">
                        <span>Semáforo Regulatorio</span>
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#D8E4F5] text-[#1E3A5F]">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="p-10 text-center text-[#456586]">
                          <div className="flex items-center justify-center gap-2.5">
                            <div className="w-5 h-5 border-3 border-[#94B2FF] border-t-transparent rounded-full animate-spin" />
                            <span className="font-bold">Cargando inventario farmacéutico...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center">
                          <div className="max-w-sm mx-auto">
                            <div className="w-14 h-14 rounded-2xl bg-[#EEF4FF] flex items-center justify-center mx-auto mb-3.5 text-[#94B2FF]">
                              <Layers className="w-7 h-7" />
                            </div>
                            <h4 className="text-base font-extrabold text-[#1E3A5F]">No se encontraron lotes</h4>
                            <p className="text-xs text-[#456586] mt-1 mb-5">
                              {searchQuery || filterStatus !== 'ALL'
                                ? 'No hay registros que coincidan con los filtros aplicados.'
                                : 'Aún no se han registrado lotes en el sistema de farmacia.'}
                            </p>
                            {!showLoteForm && (
                              <button
                                onClick={() => setShowLoteForm(true)}
                                className="px-5 py-2.5 rounded-full text-xs font-bold text-[#0D6E58] bg-[#94FFEA] hover:bg-[#7EFBE2] border border-[#7EFBE2] shadow-sm"
                              >
                                Ingresar Primer Lote
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F0F6FF] transition-colors">
                          <td className="p-4 font-bold text-[#1E3A5F]">
                            {item.name}
                          </td>
                          <td className="p-4 font-mono font-semibold text-[#38577A]">
                            {item.batchNumber}
                          </td>
                          <td className="p-4 font-mono font-black text-[#1E3A5F]">
                            {item.stock} <span className="font-normal text-[#6B8BAA] text-[11px]">uds</span>
                          </td>
                          <td className="p-4 font-mono text-[#456586]">
                            {new Date(item.expirationDate).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="p-4">
                            <ExpirationBadge
                              status={item.status}
                              expirationDate={item.expirationDate}
                              showDays={true}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pie de tabla con información explicativa */}
              <div className="px-6 py-4 bg-[#EEF4FF] border-t-2 border-[#D8E4F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#456586]">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#94FFEA] border border-[#0D6E58]"></span>
                    Vigente: &gt; 90 días
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFE7B8] border border-[#995C00]"></span>
                    Por vencer: ≤ 90 días
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFD6D6] border border-[#A82828]"></span>
                    Caducado: vencido
                  </span>
                </div>

                <span className="font-semibold text-[#1E3A5F]">Políticas de Trazabilidad Sanitaria NOM-072</span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            PESTAÑA 2: DASHBOARD DE MÉTRICAS & RIESGO
        ======================================================== */}
        {activeTab === 'metrics' && (
          <MetricsDashboard
            products={products}
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* ========================================================
            PESTAÑA 3: SISTEMA DE REPORTES ANALÍTICOS
        ======================================================== */}
        {activeTab === 'reports' && (
          <AnalyticsReports
            products={products}
            user={currentUser}
          />
        )}

      </main>

      {/* Pie de página institucional */}
      <footer className="bg-white border-t-2 border-[#D8E4F5] mt-16 py-6 text-center text-xs text-[#456586] no-print relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-[#1E3A5F]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#94FFEA] border border-[#0D6E58]" />
            <span>PharmaTrace — Sistema Integral de Farmacia & Trazabilidad</span>
          </div>
          <div className="text-[11px] text-[#6B8BAA] font-medium">
            Colores sólidos institucionales: #94B2FF y #94FFEA • Sin color negro
          </div>
        </div>
      </footer>

    </div>
  );
}
