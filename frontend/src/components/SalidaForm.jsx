import React, { useMemo, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Minus, X, CheckCircle2, AlertCircle } from 'lucide-react';

const formatDate = (value) =>
  new Date(value).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

export default function SalidaForm({ products = [], onDone, onCancel }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const nameInputRef = useRef(null);

  // Lotes que se pueden usar para una salida: con stock y no caducados,
  // ordenados del que vence primero al que vence después (FEFO), agrupados por medicamento.
  const sellable = useMemo(() => {
    const map = new Map();
    products
      .filter((p) => Number(p.stock) > 0 && String(p.status).toUpperCase() !== 'CADUCADO')
      .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate) || a.id - b.id)
      .forEach((p) => {
        if (!map.has(p.name)) map.set(p.name, []);
        map.get(p.name).push(p);
      });
    return map;
  }, [products]);

  const selectedName = name.trim();
  const lots = sellable.get(selectedName) || [];
  const available = lots.reduce((sum, lot) => sum + Number(lot.stock), 0);
  const qty = Number(quantity);
  const validQty = quantity !== '' && Number.isInteger(qty) && qty > 0;

  // Vista previa: de qué lotes se descontaría (misma regla que usa el servidor)
  const plan = useMemo(() => {
    if (!lots.length || !validQty || qty > available) return [];
    const steps = [];
    let remaining = qty;
    for (const lot of lots) {
      if (remaining === 0) break;
      const take = Math.min(Number(lot.stock), remaining);
      steps.push({ id: lot.id, batchNumber: lot.batchNumber, take, expirationDate: lot.expirationDate });
      remaining -= take;
    }
    return steps;
  }, [lots, validQty, qty, available]);

  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    setError('');
    setResult(null);
  };

  // Devuelve un mensaje de error, o '' si los datos están bien
  const validate = () => {
    if (!selectedName) return 'Elige el medicamento';
    if (!sellable.has(selectedName)) return 'No hay existencias vigentes de ese medicamento';
    if (!validQty) return 'La cantidad debe ser un número entero mayor a 0';
    if (qty > available) return `Solo hay ${available} unidades vigentes de ${selectedName}`;
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError('');
    setResult(null);

    try {
      const response = await axiosClient.post('/products/exit', {
        name: selectedName,
        quantity: qty,
      });

      if (response.data.success) {
        setResult(response.data.data);
        setName('');
        setQuantity('');
        if (onDone) await onDone();
        if (nameInputRef.current) nameInputRef.current.focus();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No se pudo registrar la salida. Revisa que el servidor esté activo.'
      );
      // Si el servidor contestó, lo más probable es que el inventario haya cambiado: se actualiza la tabla
      if (err.response && onDone) await onDone();
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-[#F4F8FD] border-2 border-[#D8E4F5] rounded-2xl text-sm text-[#1E3A5F] font-medium placeholder-[#8DA7C4] focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-[#1E3A5F] mb-1.5';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Registrar salida de inventario"
      className="bg-white rounded-[2rem] p-6 shadow-card border-2 border-[#D8E4F5]"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#94B2FF] flex items-center justify-center shadow-sm">
            <Minus className="w-5 h-5 text-[#1E3A5F]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#1E3A5F] tracking-tight">
              Registrar salida de inventario
            </h3>
            <p className="text-xs text-[#456586] mt-0.5 font-medium">
              Se descuenta automáticamente del lote que vence primero (FEFO). Los lotes caducados no se usan.
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            title="Cerrar formulario de salida"
            aria-label="Cerrar formulario de salida"
            className="p-2 rounded-full bg-[#EEF4FF] hover:bg-[#D8E5FF] border border-[#D8E4F5] text-[#1E3A5F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label htmlFor="salida-name" className={labelClass}>Medicamento</label>
          <input
            id="salida-name"
            ref={nameInputRef}
            list="salida-medicamentos"
            value={name}
            onChange={handleChange(setName)}
            placeholder="Ej. Paracetamol 500mg"
            autoComplete="off"
            className={inputClass}
          />
          <datalist id="salida-medicamentos">
            {[...sellable.keys()].sort().map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          {selectedName && sellable.has(selectedName) && (
            <p className="text-xs text-[#456586] mt-1.5 font-semibold">
              Disponible: <span className="text-[#0D6E58] font-extrabold">{available} uds</span> vigentes en {lots.length} {lots.length === 1 ? 'lote' : 'lotes'}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="salida-qty" className={labelClass}>Cantidad</label>
          <input
            id="salida-qty"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={handleChange(setQuantity)}
            placeholder="Ej. 10"
            className={inputClass}
          />
        </div>
      </div>

      {plan.length > 0 && (
        <div className="mt-4 p-4 rounded-2xl bg-[#EEF4FF] border border-[#D8E4F5] text-xs text-[#1E3A5F]">
          <p className="font-extrabold mb-2">Se descontará de:</p>
          <ul className="space-y-1">
            {plan.map((step) => (
              <li key={step.id} className="flex items-center justify-between gap-3 font-semibold">
                <span className="font-mono">{step.batchNumber}</span>
                <span className="text-[#456586]">vence {formatDate(step.expirationDate)}</span>
                <span className="font-black">{step.take} uds</span>
              </li>
            ))}
          </ul>
        </div>
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
            <span>Salida registrada: {result.quantity} uds de {result.name}</span>
          </div>
          <ul className="space-y-0.5 font-semibold">
            {result.lots.map((lot) => (
              <li key={lot.id}>
                {lot.batchNumber}: {lot.taken} uds (quedan {lot.remaining})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-full text-xs font-extrabold text-[#1E3A5F] bg-[#94B2FF] hover:bg-[#82A5FF] border border-[#82A5FF] transition-all shadow-sm hover:shadow-card hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
        >
          {saving ? 'Registrando...' : 'Registrar salida'}
        </button>
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
