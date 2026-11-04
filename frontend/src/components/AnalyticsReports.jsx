import React, { useState, useMemo } from 'react';
import ExpirationBadge from './ExpirationBadge';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileText,
  User,
  Clock,
  Sparkles
} from 'lucide-react';

function calculateDaysDiff(dateString) {
  if (!dateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(dateString);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
}

export default function AnalyticsReports({ products = [], user }) {
  const [reportType, setReportType] = useState('all'); // 'all', 'fefo', 'expired'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'VIGENTE', 'POR_VENCER', 'CADUCADO'

  const filteredData = useMemo(() => {
    return products.filter((item) => {
      const days = calculateDaysDiff(item.expirationDate);
      const status = item.status ? item.status.toUpperCase() : 'VIGENTE';

      if (reportType === 'fefo') {
        if (status !== 'POR_VENCER' && days > 90) return false;
      } else if (reportType === 'expired') {
        if (status !== 'CADUCADO' && days >= 0) return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'CADUCADO' && (status !== 'CADUCADO' && days >= 0)) return false;
        if (statusFilter === 'POR_VENCER' && (status !== 'POR_VENCER' || days < 0 || days > 90)) return false;
        if (statusFilter === 'VIGENTE' && (status !== 'VIGENTE' || days <= 90)) return false;
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBatch = item.batchNumber.toLowerCase().includes(query);
        if (!matchesName && !matchesBatch) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  }, [products, reportType, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    let unitsTotal = 0;
    let vigentes = 0;
    let porVencer = 0;
    let caducados = 0;

    filteredData.forEach((item) => {
      const stock = Number(item.stock) || 0;
      unitsTotal += stock;
      const days = calculateDaysDiff(item.expirationDate);
      const status = item.status ? item.status.toUpperCase() : '';

      if (status === 'CADUCADO' || days < 0) {
        caducados++;
      } else if (status === 'POR_VENCER' || days <= 90) {
        porVencer++;
      } else {
        vigentes++;
      }
    });

    return {
      totalRows: filteredData.length,
      unitsTotal,
      vigentes,
      porVencer,
      caducados
    };
  }, [filteredData]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No hay registros disponibles para exportar con los filtros seleccionados.');
      return;
    }

    const headers = [
      'Folio ID',
      'Medicamento',
      'Numero de Lote',
      'Existencia en Stock (Uds)',
      'Fecha de Caducidad',
      'Dias Restantes',
      'Estado Semaforico',
      'Fecha Emision Reporte'
    ];

    const todayLocal = new Date().toLocaleDateString('es-MX');
    const csvRows = [headers.join(',')];

    filteredData.forEach((row) => {
      const days = calculateDaysDiff(row.expirationDate);
      const formattedDate = new Date(row.expirationDate).toISOString().split('T')[0];
      const line = [
        `"${row.id || ''}"`,
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.batchNumber.replace(/"/g, '""')}"`,
        row.stock,
        `"${formattedDate}"`,
        days,
        `"${row.status || 'VIGENTE'}"`,
        `"${todayLocal}"`
      ];
      csvRows.push(line.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const typeLabel =
      reportType === 'fefo'
        ? 'Preventivo_FEFO'
        : reportType === 'expired'
        ? 'Mermas_Caducados'
        : 'General_Inventario';

    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Lotes_${typeLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentDateFormatted = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6">
      
      {/* Controles de Configuración del Reporte (Ocultos al imprimir) */}
      <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-card border-2 border-[#D8E4F5] no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-[#EEF4FF]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#94B2FF]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#456586]">
                Módulo Regulatorio de Auditoría
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1E3A5F] tracking-tight">
              Sistema de Reportes Analíticos
            </h2>
            <p className="text-sm text-[#456586] mt-1 font-medium">
              Genera auditorías oficiales de lotes, dictámenes de mermas y listas de rotación prioritaria FEFO.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-[#1E3A5F] bg-[#EEF4FF] hover:bg-[#D8E5FF] border border-[#D8E4F5] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-[#94B2FF]" />
              <span>Exportar CSV / Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-full text-xs font-black text-[#1E3A5F] bg-[#94B2FF] hover:bg-[#82A5FF] transition-all shadow-card hover:shadow-float flex items-center gap-2 border border-[#82A5FF]"
            >
              <Printer className="w-4 h-4 text-[#1E3A5F]" />
              <span>Imprimir Reporte Oficial</span>
            </button>
          </div>
        </div>

        {/* Selector de Tipo de Reporte */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <button
            type="button"
            onClick={() => setReportType('all')}
            className={`p-5 rounded-2xl text-left border-2 transition-all ${
              reportType === 'all'
                ? 'border-[#7CA0FF] bg-[#94B2FF] text-[#1E3A5F] shadow-card'
                : 'border-[#D8E4F5] bg-[#F8FAFD] hover:bg-[#EEF4FF] text-[#1E3A5F]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider">Reporte General</span>
              <Layers className="w-4 h-4" />
            </div>
            <p className="text-xs opacity-85 font-medium">
              Totalidad de lotes vigentes, por vencer y caducados.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setReportType('fefo')}
            className={`p-5 rounded-2xl text-left border-2 transition-all ${
              reportType === 'fefo'
                ? 'border-[#FFE0A3] bg-[#FFF2D6] text-[#995C00] shadow-card'
                : 'border-[#D8E4F5] bg-[#F8FAFD] hover:bg-[#EEF4FF] text-[#1E3A5F]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Rotación Preventiva FEFO
              </span>
              <AlertTriangle className="w-4 h-4 text-[#995C00]" />
            </div>
            <p className="text-xs opacity-85 font-medium">
              Lotes en semáforo amarillo (≤ 90 días) a rotar primero.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setReportType('expired')}
            className={`p-5 rounded-2xl text-left border-2 transition-all ${
              reportType === 'expired'
                ? 'border-[#FFBFBF] bg-[#FFEAEA] text-[#A82828] shadow-card'
                : 'border-[#D8E4F5] bg-[#F8FAFD] hover:bg-[#EEF4FF] text-[#1E3A5F]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Dictamen de Mermas
              </span>
              <ShieldAlert className="w-4 h-4 text-[#A82828]" />
            </div>
            <p className="text-xs opacity-85 font-medium">
              Lotes caducados para retiro de anaquel y destrucción.
            </p>
          </button>
        </div>

        {/* Barra de Filtros secundarios */}
        <div className="mt-6 pt-5 border-t border-[#EEF4FF] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#94B2FF] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por medicamento o lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-xs text-[#1E3A5F] font-semibold focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-[#456586] font-bold flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#94B2FF]" />
              Semáforo:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-xs text-[#1E3A5F] font-bold focus:outline-none focus:border-[#94B2FF]"
            >
              <option value="ALL">Todos los estados</option>
              <option value="VIGENTE">Solo Vigentes (Menta)</option>
              <option value="POR_VENCER">Solo Por Vencer (Ámbar)</option>
              <option value="CADUCADO">Solo Caducados (Rojo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ÁREA DEL REPORTE (Visible en pantalla y con formato de impresión para PDF/Papel) */}
      <div className="printable-report-area bg-white rounded-[2rem] shadow-card border-2 border-[#D8E4F5] p-8 lg:p-10">
        
        {/* Encabezado Institucional del Reporte */}
        <div className="border-b-2 border-[#94B2FF] pb-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#94B2FF] text-[#1E3A5F]">
                  Farmacia & Hospital
                </span>
                <span className="text-xs font-bold text-[#0D6E58] tracking-wider uppercase bg-[#94FFEA] px-2.5 py-0.5 rounded-full">
                  Control de Lotes Sanitarios
                </span>
              </div>
              <h1 className="text-xl lg:text-2xl font-black text-[#1E3A5F] uppercase tracking-tight">
                {reportType === 'fefo'
                  ? 'Reporte Preventivo de Rotación FEFO (Primeras Caducidades)'
                  : reportType === 'expired'
                  ? 'Acta y Dictamen Técnico de Mermas / Lotes Caducados'
                  : 'Reporte General de Inventario, Lotes y Trazabilidad'}
              </h1>
              <p className="text-xs text-[#456586] mt-1 font-medium">
                Conforme a la normativa de control de insumos médicos y semaforización de caducidades a 90 días.
              </p>
            </div>

            <div className="text-right text-xs text-[#456586] font-mono">
              <div className="font-extrabold text-[#1E3A5F]">FOLIO: RPT-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</div>
              <div>Emisión: {currentDateFormatted}</div>
              <div className="text-[#3867D6] font-bold">
                Responsable: {user?.email || 'Encargado General'} ({user?.role || 'Farmacéutico'})
              </div>
            </div>
          </div>

          {/* Resumen numérico en cajas del informe */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#D8E4F5] text-center">
            <div className="p-3 rounded-2xl bg-[#F8FAFD] border border-[#D8E4F5]">
              <span className="text-[10px] uppercase font-bold text-[#456586] block">Lotes en Reporte</span>
              <span className="text-lg font-black text-[#1E3A5F] font-mono">{stats.totalRows}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#F8FAFD] border border-[#D8E4F5]">
              <span className="text-[10px] uppercase font-bold text-[#456586] block">Unidades Físicas</span>
              <span className="text-lg font-black text-[#1E3A5F] font-mono">{stats.unitsTotal.toLocaleString()} uds</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FFF2D6] border border-[#FFE0A3]">
              <span className="text-[10px] uppercase font-bold text-[#995C00] block">Lotes Por Vencer</span>
              <span className="text-lg font-black text-[#995C00] font-mono">{stats.porVencer}</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FFEAEA] border border-[#FFBFBF]">
              <span className="text-[10px] uppercase font-bold text-[#A82828] block">Lotes Caducados</span>
              <span className="text-lg font-black text-[#A82828] font-mono">{stats.caducados}</span>
            </div>
          </div>
        </div>

        {/* Tabla Analítica Formal */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFD] text-[#38577A] uppercase text-[10px] font-black border-y-2 border-[#D8E4F5]">
                <th className="p-3 text-center w-12">#</th>
                <th className="p-3">Medicamento</th>
                <th className="p-3">No. de Lote</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3">Fecha Caducidad</th>
                <th className="p-3 text-center">Días Restantes</th>
                <th className="p-3 text-center">Semaforización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E4F5]">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-[#6B8BAA] text-xs font-medium">
                    No se encontraron lotes que coincidan con los criterios del reporte.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => {
                  const days = calculateDaysDiff(item.expirationDate);
                  return (
                    <tr key={item.id} className="hover:bg-[#F0F6FF] transition-colors">
                      <td className="p-3 text-center font-mono text-[#6B8BAA] font-bold">{index + 1}</td>
                      <td className="p-3 font-bold text-[#1E3A5F]">{item.name}</td>
                      <td className="p-3 font-mono text-[#38577A] font-semibold">{item.batchNumber}</td>
                      <td className="p-3 text-right font-mono font-black text-[#1E3A5F]">
                        {item.stock} uds
                      </td>
                      <td className="p-3 font-mono text-[#456586]">
                        {new Date(item.expirationDate).toISOString().split('T')[0]}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {days < 0 ? (
                          <span className="text-[#A82828] font-black">{Math.abs(days)} d vencido</span>
                        ) : (
                          <span className={days <= 90 ? 'text-[#995C00] font-black' : 'text-[#1E3A5F] font-semibold'}>
                            {days} días
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <ExpirationBadge
                          status={item.status}
                          expirationDate={item.expirationDate}
                          showDays={false}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sección de Firmas y Validación Institucional (Audit Ready) */}
        <div className="mt-12 pt-8 border-t-2 border-[#D8E4F5]">
          <p className="text-[11px] text-[#456586] text-justify mb-8 leading-relaxed">
            <strong>Certificación de Auditoría:</strong> El presente reporte refleja fielmente el estado físico y cronológico del inventario de medicamentos resguardados en almacén y farmacia. La semaforización responde a la ventana estándar de 90 días para salvaguardar la inocuidad y eficacia de los tratamientos suministrados.
          </p>

          <div className="grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <div className="w-56 mx-auto border-b-2 border-[#94B2FF] mb-2 h-12" />
              <div className="font-extrabold text-[#1E3A5F]">
                {user?.email || 'Encargado General'}
              </div>
              <div className="text-[#456586] text-[11px] font-medium">
                {user?.role || 'Responsable Sanitario de Farmacia'}
              </div>
            </div>

            <div>
              <div className="w-56 mx-auto border-b-2 border-[#94B2FF] mb-2 h-12" />
              <div className="font-extrabold text-[#1E3A5F]">Control de Calidad & Auditoría</div>
              <div className="text-[#456586] text-[11px] font-medium">Firma y Sello de Almacén Central</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
