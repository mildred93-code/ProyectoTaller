import React, { useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';

const formatDate = (value) =>
  new Date(value).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

// Retiro de lotes caducados: saca del inventario el stock de lotes que ya vencieron.
export default function SalidaForm({ products = [], onDone, onCancel }) {
  const [selected, setSelected] = useState('ALL'); // 'ALL' o el id del lote
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Lotes caducados que todavía tienen existencias
  const expired = useMemo(
    () =>
      products
        .filter((p) => String(p.status).toUpperCase() === 'CADUCADO' && Number(p.stock) > 0)
        .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate) || a.id - b.id),
    [products]
  );

  const totalUnits = expired.reduce((sum, p) => sum + Number(p.stock), 0);
  const chosen = selected === 'ALL' ? expired : expired.filter((p) => String(p.id) === String(selected));
  const chosenUnits = chosen.reduce((sum, p) => sum + Number(p.stock), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (expired.length === 0) {
      setError('No hay lotes caducados con existencias para retirar');
      return;
    }
    if (selected !== 'ALL' && chosen.length === 0) {
      setError('Elige el lote caducado que quieres retirar');
      return;
    }

    setSaving(true);
    setError('');
    setResult(null);

    try {
      const body = selected === 'ALL' ? { all: true } : { lotId: Number(selected) };
      const response = await axiosClient.post('/products/exit', body);
      if (response.data.success) {
        setResult(response.data.data);
        setSelected('ALL');
        if (onDone) await onDone();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No se pudo retirar el lote. Revisa que el servidor esté activo.'
      );
      // Si el servidor contestó, lo más probable es que el inventario haya cambiado: se actualiza la tabla
      if (err.response && onDone) await onDone();
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-[#F4F8FD] border-2 border-[#D8E4F5] rounded-2xl text-sm text-[#1E3A5F] font-medium focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-[#1E3A5F] mb-1.5';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Retirar lotes caducados"
      className="bg-white rounded-[2rem] p-6 shadow-card border-2 border-[#D8E4F5]"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#94B2FF] flex items-center justify-center shadow-sm">
            <Trash2 className="w-5 h-5 text-[#1E3A5F]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#1E3A5F] tracking-tight">
              Retirar lotes caducados
            </h3>
            <p className="text-xs text-[#456586] mt-0.5 font-medium">
              Saca del inventario el stock de lotes vencidos. Queda registrado como salida con tu usuario.
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            title="Cerrar formulario de retiro"
            aria-label="Cerrar formulario de retiro"
            className="p-2 rounded-full bg-[#EEF4FF] hover:bg-[#D8E5FF] border border-[#D8E4F5] text-[#1E3A5F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {expired.length === 0 ? (
        <div role="status" className="p-4 rounded-2xl bg-[#D9FFF7] border border-[#7EFBE2] text-[#0D6E58] text-xs font-bold">
          No hay lotes caducados con existencias. ¡Todo el inventario está al día!
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="retiro-lote" className={labelClass}>Lote a retirar</label>
            <select
              id="retiro-lote"
              value={selected}
              onChange={(e) => { setSelected(e.target.value); setError(''); setResult(null); }}
              className={inputClass}
            >
              <option value="ALL">
                Todos los lotes caducados ({expired.length} {expired.length === 1 ? 'lote' : 'lotes'}, {totalUnits} uds)
              </option>
              {expired.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — lote {p.batchNumber} — {p.stock} uds — caducó {formatDate(p.expirationDate)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-[#EEF4FF] border border-[#D8E4F5] text-xs text-[#1E3A5F]">
            <p className="font-extrabold mb-2">Se retirará del inventario:</p>
            <ul className="space-y-1">
              {chosen.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 font-semibold">
                  <span>{p.name}</span>
                  <span className="font-mono">{p.batchNumber}</span>
                  <span className="font-black">{p.stock} uds</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 font-extrabold">Total: {chosenUnits} uds</p>
          </div>
        </>
      )}

      {error && (
        <div role="alert" className="mt-4 p-4 rounded-2xl bg-[#FFEAEA] border border-[#FFBFBF] text-[#A82828] text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#C43232] flex-shrink-0 mt-0.5" />
          <span className="text-xs font-semibold leading-relaxed">{error}</span>
        </div>
      )}

      {result && (
        <div role="status" className="mt-4 p-4 rounded-2xl bg-[#D9FFF7] border border-[#7EFBE2] text-[#0D6E58] text-xs">
          <div className="flex items-center gap-2 font-extrabold text-sm mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Retiro registrado: {result.total} uds en {result.lots.length} {result.lots.length === 1 ? 'lote' : 'lotes'}</span>
          </div>
          <ul className="space-y-0.5 font-semibold">
            {result.lots.map((lot) => (
              <li key={lot.id}>
                {lot.name} — {lot.batchNumber}: {lot.quantity} uds
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        {expired.length > 0 && (
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full text-xs font-extrabold text-[#1E3A5F] bg-[#94B2FF] hover:bg-[#82A5FF] border border-[#82A5FF] transition-all shadow-sm hover:shadow-card hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
          >
            {saving ? 'Retirando...' : 'Retirar del inventario'}
          </button>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-[#456586] bg-[#EEF4FF] hover:bg-[#D8E5FF] border border-[#D8E4F5] transition-colors"
          >
            Cerrar
          </button>
        )}
      </div>
    </form>
  );
}
