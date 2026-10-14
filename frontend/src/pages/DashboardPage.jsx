import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

export default function DashboardPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axiosClient.get('/products');
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para renderizar el color del semáforo según el estado del backend
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CADUCADO':
        return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">Caducado (Rojo)</span>;
      case 'POR_VENCER':
        return <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">Por Vencer (Amarillo)</span>;
      default:
        return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Vigente (Verde)</span>;
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando inventario...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Control de Inventario y Lotes - Farmacia</h1>
          <button 
            onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}
            className="rounded bg-red-600 px-4 py-2 text-white text-sm font-medium hover:bg-red-700"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-200 text-gray-700 uppercase text-xs font-semibold">
                <th className="p-4">Medicamento</th>
                <th className="p-4">No. Lote</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Caducidad</th>
                <th className="p-4">Estado (Semáforo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-600">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center">No hay productos registrados.</td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{item.name}</td>
                    <td className="p-4">{item.batchNumber}</td>
                    <td className="p-4">{item.stock}</td>
                    <td className="p-4">{new Date(item.expirationDate).toLocaleDateString()}</td>
                    <td className="p-4">{renderStatusBadge(item.status)}</td>
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