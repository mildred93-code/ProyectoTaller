import React, { useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { History, Search, RefreshCw, Plus, Minus, AlertCircle } from 'lucide-react';

const formatDateTime = (value) =>
  new Date(value).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// refreshToken: cualquier valor que cambie cuando el inventario se actualiza (por ejemplo, la lista de lotes).
// Cuando cambia, el historial se vuelve a pedir al servidor.
export default function MovementsHistory({ refreshToken }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'ENTRADA' | 'SALIDA'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMovements = async () => {
    setRefreshing(true);
    setError('');
    try {
      const response = await axiosClient.get('/movements');
      if (response.data.success) {
        setMovements(response.data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar el historial:', err);
      setError('No se pudo cargar el historial de movimientos. Verifique que el backend esté encendido.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [refreshToken]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return movements.filter((m) => {
      if (typeFilter !== 'ALL' && m.type !== typeFilter) return false;
      if (!q) return true;
      return (
        String(m.name).toLowerCase().includes(q) ||
        String(m.batchNumber).toLowerCase().includes(q) ||
        String(m.userEmail || '').toLowerCase().includes(q)
      );
    });
  }, [movements, typeFilter, searchQuery]);

  const totals = useMemo(() => {
    let entradas = 0;
    let salidas = 0;
    filtered.forEach((m) => {
      if (m.type === 'ENTRADA') entradas += Number(m.quantity) || 0;
      if (m.type === 'SALIDA') salidas += Number(m.quantity) || 0;
    });
    return { entradas, salidas };
  }, [filtered]);

  const renderType = (type) => {
    if (type === 'ENTRADA') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#94FFEA] text-[#0D6E58] border border-[#7EFBE2] font-extrabold text-[11px]">
          <Plus className="w-3 h-3" />
          Entrada
        </span>
      );
    }
    if (type === 'SALIDA') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D8E5FF] text-[#1E3A5F] border border-[#94B2FF] font-extrabold text-[11px]">
          <Minus className="w-3 h-3" />
          Salida
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#EEF4FF] text-[#456586] border border-[#D8E4F5] font-extrabold text-[11px]">
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-[#FFEAEA] border border-[#FFBFBF] text-[#A82828] text-sm flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-[#C43232] flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">Error al cargar el historial</strong>
            <span className="text-xs">{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] p-5 shadow-card border-2 border-[#D8E4F5] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#94B2FF] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Buscar en el historial"
            placeholder="Buscar medicamento, lote o usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-xs text-[#1E3A5F] font-semibold placeholder-[#8DA7C4] focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#456586] font-bold hidden sm:inline">Tipo:</span>
            <select
              aria-label="Filtrar por tipo de movimiento"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-xs text-[#1E3A5F] font-bold focus:outline-none focus:border-[#94B2FF]"
            >
              <option value="ALL">Todos</option>
              <option value="ENTRADA">Solo entradas</option>
              <option value="SALIDA">Solo salidas</option>
            </select>
          </div>
          <button
            type="button"
            onClick={fetchMovements}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#EEF4FF] hover:bg-[#D8E5FF] text-[#1E3A5F] text-xs font-bold border border-[#D8E4F5] transition-colors"
            title="Actualizar historial"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#3867D6] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-card border-2 border-[#D8E4F5] overflow-hidden">
        <div className="px-6 py-5 bg-[#EEF4FF] border-b-2 border-[#D8E4F5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#94B2FF] flex items-center justify-center shadow-sm">
              <History className="w-4.5 h-4.5 text-[#1E3A5F]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1E3A5F] tracking-tight">
                Historial de movimientos
              </h3>
              <p className="text-xs text-[#456586] mt-0.5 font-medium">
                Mostrando {filtered.length} de {movements.length} movimientos (los más recientes primero)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-extrabold">
            <span className="px-3 py-1.5 rounded-full bg-[#94FFEA] text-[#0D6E58] border border-[#7EFBE2]">
              Entradas: +{totals.entradas.toLocaleString()} uds
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#D8E5FF] text-[#1E3A5F] border border-[#94B2FF]">
              Salidas: −{totals.salidas.toLocaleString()} uds
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFD] text-[#38577A] uppercase text-[10px] font-black border-b-2 border-[#D8E4F5]">
                <th className="p-4">Fecha y hora</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Medicamento</th>
                <th className="p-4">No. de Lote</th>
                <th className="p-4">Cantidad</th>
                <th className="p-4">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E4F5] text-[#1E3A5F]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-[#456586] font-bold">
                    Cargando historial...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <h4 className="text-base font-extrabold text-[#1E3A5F]">No hay movimientos</h4>
                    <p className="text-xs text-[#456586] mt-1">
                      {searchQuery || typeFilter !== 'ALL'
                        ? 'No hay registros que coincidan con los filtros aplicados.'
                        : 'Aún no se han registrado entradas ni salidas.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F0F6FF] transition-colors">
                    <td className="p-4 font-mono text-[#456586]">{formatDateTime(m.date)}</td>
                    <td className="p-4">{renderType(m.type)}</td>
                    <td className="p-4 font-bold text-[#1E3A5F]">{m.name}</td>
                    <td className="p-4 font-mono font-semibold text-[#38577A]">{m.batchNumber}</td>
                    <td className="p-4 font-mono font-black text-[#1E3A5F]">
                      {m.type === 'ENTRADA' ? '+' : m.type === 'SALIDA' ? '−' : ''}
                      {m.quantity} <span className="font-normal text-[#6B8BAA] text-[11px]">uds</span>
                    </td>
                    <td className="p-4 text-[#456586] font-semibold">
                      {m.userEmail || <span className="italic text-[#8DA7C4]">Sin registro</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
