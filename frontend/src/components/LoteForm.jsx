import React, { useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';
import {
  PackagePlus,
  Barcode,
  Calendar,
  Hash,
  Pill,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RotateCcw,
  Camera
} from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

const EMPTY_FORM = { name: '', batchNumber: '', stock: '', expirationDate: '', barcode: '' };

// Fecha de hoy en formato YYYY-MM-DD
const todayString = () => new Date().toLocaleDateString('en-CA');

// Días restantes respecto a hoy
function daysUntil(dateString) {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('-').map(Number);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - todayUtc) / 86400000);
}

export default function LoteForm({ medicamentos = [], onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const nameInputRef = useRef(null);
  const batchInputRef = useRef(null);
  const lastLookupRef = useRef('');
  const [scanning, setScanning] = useState(false);
  const [lookup, setLookup] = useState(null); // { type: 'found' | 'new' | 'error' | 'loading', text }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  // Busca en el catálogo el medicamento que corresponde al código de barras y llena el formulario
  const lookupBarcode = async (rawCode) => {
    const code = String(rawCode || '').trim();
    if (!code || lastLookupRef.current === code) return;
    lastLookupRef.current = code;
    setLookup({ type: 'loading', text: 'Buscando código...' });
    try {
      const response = await axiosClient.get(`/products/barcode/${encodeURIComponent(code)}`);
      if (response.data.success) {
        const found = response.data.data;
        setForm((prev) => ({ ...prev, barcode: code, name: found.name }));
        setLookup({ type: 'found', text: `Medicamento reconocido: ${found.name}` });
        if (batchInputRef.current) batchInputRef.current.focus();
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setLookup({ type: 'new', text: 'Código nuevo: escribe el nombre del medicamento para asociarlo.' });
        if (nameInputRef.current) nameInputRef.current.focus();
      } else {
        lastLookupRef.current = '';
        setLookup({
          type: 'error',
          text: err.response?.data?.message || 'No se pudo buscar el código. Verifique que el backend esté en ejecución.'
        });
      }
    }
  };

  const handleBarcodeChange = (e) => {
    handleChange(e);
    lastLookupRef.current = '';
    setLookup(null);
  };

  // Los lectores USB escriben el código y mandan Enter: se busca sin enviar el formulario
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lookupBarcode(e.target.value);
    }
  };

  const handleDetected = (code) => {
    setScanning(false);
    setForm((prev) => ({ ...prev, barcode: code }));
    setError('');
    setSuccess('');
    lookupBarcode(code);
  };

  const handleStockPreset = (amount) => {
    const current = Number(form.stock) || 0;
    setForm((prev) => ({ ...prev, stock: String(current + amount) }));
  };

  const generateBatchCode = () => {
    const medCode = form.name
      ? form.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'MED')
      : 'LOT';
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setForm((prev) => ({
      ...prev,
      batchNumber: `${medCode}-${year}-${randomSuffix}`
    }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Especifique el nombre del medicamento';
    if (!form.batchNumber.trim()) return 'Indique el número o código de lote';
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock <= 0) {
      return 'La cantidad debe ser un número entero mayor a 0';
    }
    if (!form.expirationDate) return 'Seleccione la fecha oficial de caducidad';
    if (form.expirationDate < todayString()) {
      return 'Normativa farmacéutica: no se permite registrar un lote ya caducado';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationMsg = validate();
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axiosClient.post('/products', {
        name: form.name.trim(),
        batchNumber: form.batchNumber.trim(),
        stock: Number(form.stock),
        expirationDate: form.expirationDate,
        barcode: form.barcode.trim(),
      });

      if (response.data.success) {
        setSuccess(
          `Lote ${form.batchNumber.trim()} para "${form.name.trim()}" registrado y sincronizado en el inventario.`
        );
        setForm(EMPTY_FORM);
        setLookup(null);
        lastLookupRef.current = '';
        if (onCreated) await onCreated();
        if (nameInputRef.current) nameInputRef.current.focus();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No se pudo registrar el lote. Verifique que el servicio de backend esté en ejecución.'
      );
    } finally {
      setSaving(false);
    }
  };

  const remainingDays = daysUntil(form.expirationDate);

  return (
    <div className="bg-white rounded-[2rem] shadow-card border-2 border-[#D8E4F5] overflow-hidden mb-8 transition-all">
      {/* Encabezado del Formulario en tono pastel con bloque #94B2FF */}
      <div className="px-6 py-5 bg-[#EEF4FF] border-b-2 border-[#D8E4F5] flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#94B2FF] flex items-center justify-center text-[#1E3A5F] shadow-sm flex-shrink-0">
            <PackagePlus className="w-5 h-5 text-[#1E3A5F]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#1E3A5F] tracking-tight flex items-center gap-2">
              Ingreso de Nuevo Lote de Medicamento
            </h3>
            <p className="text-xs text-[#456586]">
              Control de trazabilidad, cálculo automático de caducidad y registro de entradas
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold text-[#38577A] hover:text-[#1E3A5F] bg-white hover:bg-[#D8E5FF] px-3.5 py-1.5 rounded-full border border-[#D8E4F5] transition-colors"
          >
            Cerrar formulario
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-6 lg:p-8">
        {/* Código de barras (opcional): lector USB o cámara */}
        <div className="mb-6 p-4 rounded-2xl bg-[#F8FAFD] border-2 border-dashed border-[#D8E4F5]">
          <label htmlFor="lote-barcode" className="block text-xs font-bold uppercase tracking-wider text-[#1E3A5F] mb-1.5 flex items-center gap-1.5">
            <Barcode className="w-4 h-4 text-[#94B2FF]" />
            Código de barras (opcional)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="lote-barcode"
              name="barcode"
              value={form.barcode}
              onChange={handleBarcodeChange}
              onKeyDown={handleBarcodeKeyDown}
              onBlur={(e) => lookupBarcode(e.target.value)}
              placeholder="Escanea o escribe el código"
              className="flex-1 px-4 py-3 bg-white border-2 border-[#D8E4F5] rounded-2xl text-sm text-[#1E3A5F] font-mono font-medium placeholder-[#8DA7C4] focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setScanning(true)}
              className="px-5 py-3 rounded-full text-xs font-extrabold text-[#1E3A5F] bg-[#94FFEA] hover:bg-[#7EFBE2] border border-[#7EFBE2] transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#0D6E58]" />
              Escanear con cámara
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-[#6B8BAA]">
            Con lector USB, dispara el escáner con el cursor en este campo. Si el código ya existe, se llena el medicamento solo.
          </p>
          {lookup && (
            <p
              role="status"
              className={`mt-2 text-xs font-bold ${
                lookup.type === 'found'
                  ? 'text-[#0D6E58]'
                  : lookup.type === 'error'
                  ? 'text-[#A82828]'
                  : 'text-[#38577A]'
              }`}
            >
              {lookup.text}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

          {/* Medicamento */}
          <div>
            <label htmlFor="lote-name" className="block text-xs font-bold uppercase tracking-wider text-[#1E3A5F] mb-1.5 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-[#94B2FF]" />
              Medicamento
            </label>
            <div className="relative">
              <input
                id="lote-name"
                name="name"
                ref={nameInputRef}
                list="lote-medicamentos"
                value={form.name}
                onChange={handleChange}
                placeholder="Ej. Paracetamol 500mg"
                className="w-full px-4 py-3 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-sm text-[#1E3A5F] font-medium placeholder-[#8DA7C4] focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
                autoComplete="off"
              />
              <datalist id="lote-medicamentos">
                {medicamentos.map((nombre) => (
                  <option key={nombre} value={nombre} />
                ))}
              </datalist>
            </div>
            <p className="mt-1 text-[11px] text-[#6B8BAA]">
              Escribe o selecciona uno existente en catálogo
            </p>
          </div>

          {/* Número de Lote */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="lote-batch" className="block text-xs font-bold uppercase tracking-wider text-[#1E3A5F] flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-[#94B2FF]" />
                No. de Lote
              </label>
              <button
                type="button"
                onClick={generateBatchCode}
                className="text-[11px] bg-[#94FFEA] hover:bg-[#7EFBE2] text-[#0D6E58] font-bold px-2.5 py-0.5 rounded-full border border-[#7EFBE2] transition-colors flex items-center gap-1"
                title="Sugerir código con el año en curso"
              >
                <Sparkles className="w-3 h-3 text-[#0D6E58]" />
                Sugerir
              </button>
            </div>
            <input
              id="lote-batch"
              name="batchNumber"
              ref={batchInputRef}
              value={form.batchNumber}
              onChange={handleChange}
              placeholder="Ej. LOT-PAR-2026A"
              className="w-full px-4 py-3 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-sm text-[#1E3A5F] font-mono font-medium placeholder-[#8DA7C4] focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
              autoComplete="off"
            />
            <p className="mt-1 text-[11px] text-[#6B8BAA]">
              Código alfanumérico impreso en empaque
            </p>
          </div>

          {/* Cantidad / Stock */}
          <div>
            <label htmlFor="lote-stock" className="block text-xs font-bold uppercase tracking-wider text-[#1E3A5F] mb-1.5 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-[#94B2FF]" />
              Stock (Unidades)
            </label>
            <input
              id="lote-stock"
              name="stock"
              type="number"
              min="1"
              step="1"
              value={form.stock}
              onChange={handleChange}
              placeholder="Ej. 100"
              className="w-full px-4 py-3 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-sm text-[#1E3A5F] font-bold placeholder-[#8DA7C4] focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
            />
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-[#6B8BAA] font-semibold">Atajos:</span>
              <button
                type="button"
                onClick={() => handleStockPreset(25)}
                className="text-[11px] bg-[#EEF4FF] hover:bg-[#D8E5FF] text-[#1E3A5F] px-2.5 py-0.5 rounded-full border border-[#D8E4F5] font-bold transition-colors"
              >
                +25
              </button>
              <button
                type="button"
                onClick={() => handleStockPreset(50)}
                className="text-[11px] bg-[#EEF4FF] hover:bg-[#D8E5FF] text-[#1E3A5F] px-2.5 py-0.5 rounded-full border border-[#D8E4F5] font-bold transition-colors"
              >
                +50
              </button>
              <button
                type="button"
                onClick={() => handleStockPreset(100)}
                className="text-[11px] bg-[#EEF4FF] hover:bg-[#D8E5FF] text-[#1E3A5F] px-2.5 py-0.5 rounded-full border border-[#D8E4F5] font-bold transition-colors"
              >
                +100
              </button>
            </div>
          </div>

          {/* Fecha de Caducidad */}
          <div>
            <label htmlFor="lote-date" className="block text-xs font-bold uppercase tracking-wider text-[#1E3A5F] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#94B2FF]" />
              Fecha de Caducidad
            </label>
            <input
              id="lote-date"
              name="expirationDate"
              type="date"
              min={todayString()}
              value={form.expirationDate}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#F8FAFD] border-2 border-[#D8E4F5] rounded-2xl text-sm text-[#1E3A5F] font-medium focus:bg-white focus:outline-none focus:border-[#94B2FF] focus:ring-4 focus:ring-[#94B2FF]/20 transition-all shadow-sm"
            />
            <p className="mt-1 text-[11px] text-[#6B8BAA]">
              Mínimo fecha presente o posterior
            </p>
          </div>

        </div>

        {/* Notificación dinámica preventiva de caducidad */}
        {remainingDays !== null && (
          <div className="mt-5">
            {remainingDays < 0 ? (
              <div className="p-4 rounded-2xl bg-[#FFEAEA] border border-[#FFBFBF] text-[#A82828] text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#C43232] flex-shrink-0" />
                <span>La fecha seleccionada ya caducó hace {Math.abs(remainingDays)} días. No puede registrarse en inventario.</span>
              </div>
            ) : remainingDays <= 90 ? (
              <div className="p-4 rounded-2xl bg-[#FFF2D6] border border-[#FFE0A3] text-[#995C00] text-xs flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                <span>
                  <strong>Aviso de Semaforización:</strong> Este lote expira en <strong>{remainingDays} días</strong> y entrará clasificado como <span className="font-bold text-[#8A5200]">Por Vencer (Amarillo)</span> para rotación prioritaria FEFO.
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#D9FFF7] border border-[#7EFBE2] text-[#0D6E58] text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0D6E58] flex-shrink-0" />
                <span>
                  <strong>Lote Vigente:</strong> Cuenta con <strong>{remainingDays} días</strong> de vida útil reglamentaria garantizada.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Mensajes de éxito y error */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-[#FFEAEA] border border-[#FFBFBF] text-[#A82828] text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#C43232] flex-shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 rounded-2xl bg-[#D9FFF7] border border-[#7EFBE2] text-[#0D6E58] text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#0D6E58] flex-shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-8 pt-5 border-t border-[#D8E4F5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setError('');
              setSuccess('');
              setLookup(null);
              lastLookupRef.current = '';
            }}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-[#456586] hover:text-[#1E3A5F] hover:bg-[#EEF4FF] transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar campos
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-[#38577A] hover:text-[#1E3A5F] bg-[#EEF4FF] hover:bg-[#D8E5FF] border border-[#D8E4F5] transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full text-xs font-black text-[#1E3A5F] bg-[#94B2FF] hover:bg-[#82A5FF] transition-all shadow-card hover:shadow-float disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 border border-[#82A5FF]"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
                  <span>Procesando entrada...</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4 text-[#1E3A5F]" />
                  <span>Registrar Lote en Inventario</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {scanning && (
        <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />
      )}
    </div>
  );
}