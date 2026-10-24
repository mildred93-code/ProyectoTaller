import React, { useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';

const EMPTY_FORM = { name: '', batchNumber: '', stock: '', expirationDate: '' };

// Fecha de hoy en formato YYYY-MM-DD (hora local)
const todayString = () => new Date().toLocaleDateString('en-CA');

// Días que faltan para la fecha YYYY-MM-DD (negativo si ya pasó)
function daysUntil(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - todayUtc) / 86400000);
}

export default function LoteForm({ medicamentos = [], onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const nameInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  // Devuelve un mensaje de error, o '' si los datos están bien
  const validate = () => {
    if (!form.name.trim()) return 'Escribe el nombre del medicamento';
    if (!form.batchNumber.trim()) return 'Escribe el número de lote';
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock <= 0) {
      return 'La cantidad debe ser un número entero mayor a 0';
    }
    if (!form.expirationDate) return 'Elige la fecha de caducidad';
    if (form.expirationDate < todayString()) {
      return 'No se puede registrar un lote que ya caducó';
    }
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
    setSuccess('');

    try {
      const response = await axiosClient.post('/products', {
        name: form.name.trim(),
        batchNumber: form.batchNumber.trim(),
        stock: Number(form.stock),
        expirationDate: form.expirationDate,
      });

      if (response.data.success) {
        setSuccess(
          `Lote ${form.batchNumber.trim()} de ${form.name.trim()} registrado correctamente`
        );
        setForm(EMPTY_FORM);
        if (onCreated) await onCreated();
        if (nameInputRef.current) nameInputRef.current.focus();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'No se pudo registrar el lote. Revisa que el servidor esté activo.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Aviso suave: el lote entra, pero ya llegaría en amarillo (90 días o menos)
  const remainingDays = form.expirationDate ? daysUntil(form.expirationDate) : null;
  const shortLifeWarning =
    remainingDays !== null && remainingDays >= 0 && remainingDays <= 90;

  const inputClass =
    'w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
  const labelClass = 'mb-1 block text-xs font-semibold uppercase text-gray-600';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mb-6 rounded-lg bg-white p-6 shadow-md"
      aria-label="Registrar nuevo lote"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Registrar nuevo lote</h2>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="lote-name" className={labelClass}>Medicamento</label>
          <input
            id="lote-name"
            name="name"
            ref={nameInputRef}
            list="lote-medicamentos"
            value={form.name}
            onChange={handleChange}
            placeholder="Ej. Paracetamol 500mg"
            className={inputClass}
            autoComplete="off"
            autoFocus
          />
          <datalist id="lote-medicamentos">
            {medicamentos.map((nombre) => (
              <option key={nombre} value={nombre} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="lote-batch" className={labelClass}>Número de lote</label>
          <input
            id="lote-batch"
            name="batchNumber"
            value={form.batchNumber}
            onChange={handleChange}
            placeholder="Ej. LOT-PAR-2026A"
            className={inputClass}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="lote-stock" className={labelClass}>Cantidad</label>
          <input
            id="lote-stock"
            name="stock"
            type="number"
            min="1"
            step="1"
            value={form.stock}
            onChange={handleChange}
            placeholder="Ej. 50"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="lote-date" className={labelClass}>Fecha de caducidad</label>
          <input
            id="lote-date"
            name="expirationDate"
            type="date"
            min={todayString()}
            value={form.expirationDate}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Si el medicamento no existe todavía, se crea automáticamente al guardar el lote.
      </p>

      {shortLifeWarning && (
        <div role="status" className="mt-4 rounded bg-yellow-100 px-4 py-2 text-sm text-yellow-800">
          Este lote vence en {remainingDays} {remainingDays === 1 ? 'día' : 'días'} y
          quedará como "Por vencer" (amarillo).
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 rounded bg-red-100 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="mt-4 rounded bg-green-100 px-4 py-2 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="mt-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Registrar lote'}
        </button>
      </div>
    </form>
  );
}
