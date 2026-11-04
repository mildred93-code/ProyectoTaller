import React, { useMemo } from 'react';
import ExpirationBadge from './ExpirationBadge';
import {
  BarChart3,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  TrendingUp,
  Activity,
  Calendar,
  AlertOctagon,
  ArrowUpRight
} from 'lucide-react';

export default function MetricsDashboard({ products = [], onSelectTab }) {
  const analytics = useMemo(() => {
    const totalLotes = products.length;
    let totalStock = 0;
    let vigentesCount = 0;
    let vigentesStock = 0;
    let porVencerCount = 0;
    let porVencerStock = 0;
    let caducadosCount = 0;
    let caducadosStock = 0;

    let critico30 = 0;
    let alerta90 = 0;
    let seguro180 = 0;
    let prolongado = 0;

    const medicineMap = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    products.forEach((p) => {
      const stock = Number(p.stock) || 0;
      totalStock += stock;

      if (!medicineMap[p.name]) {
        medicineMap[p.name] = { name: p.name, stock: 0, lotesCount: 0 };
      }
      medicineMap[p.name].stock += stock;
      medicineMap[p.name].lotesCount += 1;

      const expDate = new Date(p.expirationDate);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

      const status = p.status ? p.status.toUpperCase() : '';
      if (status === 'CADUCADO' || diffDays < 0) {
        caducadosCount++;
        caducadosStock += stock;
      } else if (status === 'POR_VENCER' || diffDays <= 90) {
        porVencerCount++;
        porVencerStock += stock;
      } else {
        vigentesCount++;
        vigentesStock += stock;
      }

      if (diffDays >= 0 && diffDays <= 30) {
        critico30++;
      } else if (diffDays > 30 && diffDays <= 90) {
        alerta90++;
      } else if (diffDays > 90 && diffDays <= 180) {
        seguro180++;
      } else if (diffDays > 180) {
        prolongado++;
      }
    });

    const uniqueMedicinesCount = Object.keys(medicineMap).length;
    const topMedicines = Object.values(medicineMap)
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);

    const urgentLots = [...products]
      .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate))
      .slice(0, 5);

    const vigentesPct = totalLotes > 0 ? Math.round((vigentesCount / totalLotes) * 100) : 0;
    const porVencerPct = totalLotes > 0 ? Math.round((porVencerCount / totalLotes) * 100) : 0;
    const caducadosPct = totalLotes > 0 ? Math.round((caducadosCount / totalLotes) * 100) : 0;

    return {
      totalLotes,
      totalStock,
      vigentesCount,
      vigentesStock,
      vigentesPct,
      porVencerCount,
      porVencerStock,
      porVencerPct,
      caducadosCount,
      caducadosStock,
      caducadosPct,
      uniqueMedicinesCount,
      topMedicines,
      urgentLots,
      critico30,
      alerta90,
      seguro180,
      prolongado
    };
  }, [products]);

  return (
    <div className="space-y-6">
      
      {/* Encabezado del Dashboard */}
      <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-card border-2 border-[#D8E4F5] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#94FFEA] border border-[#0D6E58] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#456586]">
              Analítica de Inventario en Tiempo Real
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1E3A5F] tracking-tight flex items-center gap-2.5">
            Dashboard de Métricas & Control de Riesgo
          </h2>
          <p className="text-sm text-[#456586] mt-1 font-medium">
            Supervisión integral de caducidades, volumen de existencias y cumplimiento de rotación sanitaria FEFO.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-[#EEF4FF] border border-[#D8E4F5] text-left">
            <span className="text-[10px] uppercase font-bold text-[#456586] block">Total Medicamentos</span>
            <span className="text-lg font-black text-[#1E3A5F]">{analytics.uniqueMedicinesCount} catálogo</span>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-[#94B2FF] border border-[#82A5FF] text-left">
            <span className="text-[10px] uppercase font-extrabold text-[#1E3A5F]/80 block">Unidades Globales</span>
            <span className="text-lg font-black text-[#1E3A5F]">{analytics.totalStock.toLocaleString()} pzas</span>
          </div>
        </div>
      </div>

      {/* Tarjetas Principales de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Lotes */}
        <div className="bg-white rounded-[2rem] p-6 shadow-card border-2 border-[#D8E4F5] relative overflow-hidden group hover:border-[#94B2FF] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#456586]">
              Lotes Registrados
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#EEF4FF] flex items-center justify-center text-[#1E3A5F]">
              <Layers className="w-5 h-5 text-[#94B2FF]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1E3A5F]">{analytics.totalLotes}</span>
            <span className="text-xs text-[#6B8BAA] font-semibold">lotes activos</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#456586] pt-3 border-t border-[#EEF4FF]">
            <span>En {analytics.uniqueMedicinesCount} medicamentos</span>
            <span className="font-bold text-[#1E3A5F]">100% trazables</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#94B2FF]" />
        </div>

        {/* KPI 2: Lotes Vigentes (Verde/Menta #94FFEA) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-card border-2 border-[#D8E4F5] relative overflow-hidden group hover:border-[#94FFEA] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D6E58]">
              Lotes Vigentes
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#D9FFF7] flex items-center justify-center text-[#0D6E58]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0D6E58]">{analytics.vigentesCount}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#94FFEA] text-[#0D6E58]">
              {analytics.vigentesPct}%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#456586] pt-3 border-t border-[#EEF4FF]">
            <span>Stock vigente</span>
            <span className="font-bold text-[#0D6E58]">{analytics.vigentesStock.toLocaleString()} uds</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#94FFEA]" />
        </div>

        {/* KPI 3: Por Vencer (Amarillo <= 90 días) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-card border-2 border-[#D8E4F5] relative overflow-hidden group hover:border-[#FFE0A3] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#995C00]">
              Por Vencer (≤ 90d)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#FFF2D6] flex items-center justify-center text-[#995C00]">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#995C00]">{analytics.porVencerCount}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFE7B8] text-[#995C00]">
              {analytics.porVencerPct}%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#456586] pt-3 border-t border-[#EEF4FF]">
            <span>Prioridad FEFO</span>
            <span className="font-bold text-[#995C00]">{analytics.porVencerStock.toLocaleString()} uds</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#FFE0A3]" />
        </div>

        {/* KPI 4: Caducados (Rojo suave) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-card border-2 border-[#D8E4F5] relative overflow-hidden group hover:border-[#FFBFBF] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A82828]">
              Caducados (Retiro)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#FFEAEA] flex items-center justify-center text-[#A82828]">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#A82828]">{analytics.caducadosCount}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFD6D6] text-[#A82828]">
              {analytics.caducadosPct}%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[#456586] pt-3 border-t border-[#EEF4FF]">
            <span>Merma en riesgo</span>
            <span className="font-bold text-[#A82828]">{analytics.caducadosStock.toLocaleString()} uds</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#FFBFBF]" />
        </div>

      </div>

      {/* Barra de Distribución Global del Semáforo */}
      <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-card border-2 border-[#D8E4F5]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#1E3A5F] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#94B2FF]" />
              Distribución Proporcional de la Semaforización
            </h3>
            <p className="text-xs text-[#456586] mt-0.5">
              Balance porcentual de seguridad sanitaria del inventario activo
            </p>
          </div>
          <span className="text-xs text-[#456586] font-mono font-bold bg-[#EEF4FF] px-3 py-1 rounded-full border border-[#D8E4F5]">
            Total: {analytics.totalLotes} lotes evaluados
          </span>
        </div>

        {/* Barra dividida proporcional */}
        <div className="w-full h-6 bg-[#EEF4FF] rounded-full overflow-hidden flex shadow-inner p-1 border border-[#D8E4F5]">
          {analytics.vigentesCount > 0 && (
            <div
              style={{ width: `${analytics.vigentesPct}%` }}
              className="h-full bg-[#94FFEA] rounded-l-full transition-all duration-500"
              title={`Vigentes: ${analytics.vigentesCount} lotes (${analytics.vigentesPct}%)`}
            />
          )}
          {analytics.porVencerCount > 0 && (
            <div
              style={{ width: `${analytics.porVencerPct}%` }}
              className="h-full bg-[#FFE0A3] transition-all duration-500"
              title={`Por vencer: ${analytics.porVencerCount} lotes (${analytics.porVencerPct}%)`}
            />
          )}
          {analytics.caducadosCount > 0 && (
            <div
              style={{ width: `${analytics.caducadosPct}%` }}
              className="h-full bg-[#FFB8B8] rounded-r-full transition-all duration-500"
              title={`Caducados: ${analytics.caducadosCount} lotes (${analytics.caducadosPct}%)`}
            />
          )}
          {analytics.totalLotes === 0 && (
            <div className="w-full h-full bg-[#D8E4F5] flex items-center justify-center text-[10px] text-[#456586] font-bold">
              Sin datos registrados
            </div>
          )}
        </div>

        {/* Leyenda explicativa con pastillas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#EEF4FF]">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="w-3.5 h-3.5 rounded-full bg-[#94FFEA] border border-[#0D6E58] flex-shrink-0" />
            <span className="text-[#1E3A5F]">
              <strong>Vigente (Menta):</strong> {analytics.vigentesCount} lotes ({analytics.vigentesPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFE0A3] border border-[#995C00] flex-shrink-0" />
            <span className="text-[#1E3A5F]">
              <strong>Por Vencer (Ámbar):</strong> {analytics.porVencerCount} lotes ({analytics.porVencerPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFB8B8] border border-[#A82828] flex-shrink-0" />
            <span className="text-[#1E3A5F]">
              <strong>Caducado (Rojo):</strong> {analytics.caducadosCount} lotes ({analytics.caducadosPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Grid de 2 Columnas: Horizontes de Vencimiento & Top Medicamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Horizontes Temporales de Caducidad */}
        <div className="lg:col-span-6 bg-white rounded-[2rem] p-6 lg:p-8 shadow-card border-2 border-[#D8E4F5]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#1E3A5F] uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#94B2FF]" />
                Horizontes de Rotación & Caducidad
              </h3>
              <p className="text-xs text-[#456586] mt-0.5">
                Segmentación temporal de lotes vigentes hacia su fecha límite
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Crítico <30 días */}
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#D8E4F5]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#1E3A5F] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF8E8E]"></span>
                  Crítico (Menos de 30 días)
                </span>
                <span className="font-mono font-black text-[#A82828]">{analytics.critico30} lotes</span>
              </div>
              <div className="w-full bg-[#EEF4FF] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF8E8E] h-full rounded-full transition-all"
                  style={{
                    width: `${analytics.totalLotes > 0 ? (analytics.critico30 / analytics.totalLotes) * 100 : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-[#6B8BAA] mt-1.5 font-medium">
                Dispensar de inmediato. Descuentos o retiro inminente.
              </p>
            </div>

            {/* Alerta 31 - 90 días */}
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#D8E4F5]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#1E3A5F] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFD285]"></span>
                  Alerta Preventiva (31 a 90 días)
                </span>
                <span className="font-mono font-black text-[#995C00]">{analytics.alerta90} lotes</span>
              </div>
              <div className="w-full bg-[#EEF4FF] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FFD285] h-full rounded-full transition-all"
                  style={{
                    width: `${analytics.totalLotes > 0 ? (analytics.alerta90 / analytics.totalLotes) * 100 : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-[#6B8BAA] mt-1.5 font-medium">
                Priorizar en mostrador aplicando método FEFO.
              </p>
            </div>

            {/* Seguro 91 - 180 días */}
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#D8E4F5]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#1E3A5F] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94B2FF]"></span>
                  Inventario Estable (91 a 180 días)
                </span>
                <span className="font-mono font-black text-[#1E3A5F]">{analytics.seguro180} lotes</span>
              </div>
              <div className="w-full bg-[#EEF4FF] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#94B2FF] h-full rounded-full transition-all"
                  style={{
                    width: `${analytics.totalLotes > 0 ? (analytics.seguro180 / analytics.totalLotes) * 100 : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-[#6B8BAA] mt-1.5 font-medium">
                Stock con estabilidad y margen regular de consumo.
              </p>
            </div>

            {/* Prolongado >180 días */}
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#D8E4F5]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[#1E3A5F] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94FFEA] border border-[#0D6E58]"></span>
                  Reserva a Largo Plazo (&gt; 180 días)
                </span>
                <span className="font-mono font-black text-[#0D6E58]">{analytics.prolongado} lotes</span>
              </div>
              <div className="w-full bg-[#EEF4FF] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#94FFEA] h-full rounded-full transition-all"
                  style={{
                    width: `${analytics.totalLotes > 0 ? (analytics.prolongado / analytics.totalLotes) * 100 : 0}%`
                  }}
                />
              </div>
              <p className="text-[11px] text-[#6B8BAA] mt-1.5 font-medium">
                Lotes de reciente ingreso con vida útil óptima.
              </p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Concentración por Medicamento (Top 5) */}
        <div className="lg:col-span-6 bg-white rounded-[2rem] p-6 lg:p-8 shadow-card border-2 border-[#D8E4F5] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#1E3A5F] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#94B2FF]" />
                  Medicamentos con Mayor Existencia
                </h3>
                <p className="text-xs text-[#456586] mt-0.5">
                  Volumen concentrado de unidades físicas en almacén
                </p>
              </div>
            </div>

            {analytics.topMedicines.length === 0 ? (
              <p className="text-xs text-[#6B8BAA] text-center py-8">No hay registros de medicamentos aún.</p>
            ) : (
              <div className="space-y-4">
                {analytics.topMedicines.map((item, idx) => {
                  const pctOfTotal = analytics.totalStock > 0
                    ? Math.round((item.stock / analytics.totalStock) * 100)
                    : 0;

                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#EEF4FF] text-[#1E3A5F] font-mono text-[11px] font-black flex items-center justify-center border border-[#D8E4F5]">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-[#1E3A5F] truncate max-w-[200px]">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-[#1E3A5F] font-mono">
                            {item.stock.toLocaleString()} uds
                          </span>
                          <span className="text-[10px] text-[#6B8BAA] ml-1.5 font-semibold">
                            ({item.lotesCount} {item.lotesCount === 1 ? 'lote' : 'lotes'})
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-[#EEF4FF] h-2.5 rounded-full overflow-hidden border border-[#D8E4F5]">
                        <div
                          className="h-full rounded-full transition-all duration-300 bg-[#94B2FF]"
                          style={{
                            width: `${pctOfTotal}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#EEF4FF] flex items-center justify-between text-xs text-[#456586]">
            <span>¿Requieres el detalle de cada lote?</span>
            <button
              onClick={() => onSelectTab && onSelectTab('inventory')}
              className="text-[#1E3A5F] hover:text-[#3867D6] font-bold inline-flex items-center gap-1 hover:underline"
            >
              <span>Ver tabla de inventario</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#94B2FF]" />
            </button>
          </div>
        </div>

      </div>

      {/* Lotes de Atención Prioritaria (Próximos a Vencer o Caducados) */}
      <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-card border-2 border-[#D8E4F5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-extrabold text-[#1E3A5F] uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#995C00]" />
              Lotes con Mayor Prioridad de Gestión (FEFO)
            </h3>
            <p className="text-xs text-[#456586] mt-0.5">
              Lotes ordenados cronológicamente por caducidad más cercana
            </p>
          </div>

          <button
            onClick={() => onSelectTab && onSelectTab('reports')}
            className="text-xs font-bold text-[#1E3A5F] px-4 py-2 rounded-full bg-[#94B2FF] hover:bg-[#82A5FF] transition-colors inline-flex items-center gap-1.5 border border-[#82A5FF] shadow-sm self-start sm:self-auto"
          >
            <span>Generar Reporte Completo</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#1E3A5F]" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFD] text-[#38577A] uppercase text-[10px] font-black border-b-2 border-[#D8E4F5]">
                <th className="p-3.5">Medicamento</th>
                <th className="p-3.5">No. Lote</th>
                <th className="p-3.5">Stock</th>
                <th className="p-3.5">Fecha de Caducidad</th>
                <th className="p-3.5">Semáforo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E4F5]">
              {analytics.urgentLots.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-[#6B8BAA] font-medium">
                    No hay lotes en el inventario.
                  </td>
                </tr>
              ) : (
                analytics.urgentLots.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F0F6FF] transition-colors">
                    <td className="p-3.5 font-bold text-[#1E3A5F]">{item.name}</td>
                    <td className="p-3.5 font-mono text-[#38577A] font-semibold">{item.batchNumber}</td>
                    <td className="p-3.5 font-black text-[#1E3A5F]">{item.stock} uds</td>
                    <td className="p-3.5 text-[#456586] font-mono">
                      {new Date(item.expirationDate).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="p-3.5">
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
      </div>

    </div>
  );
}
