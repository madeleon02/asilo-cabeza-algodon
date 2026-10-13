import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Farmacia() {
  const [prescripciones, setPrescripciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('pendiente');
  const [toast, setToast] = useState({ msg: '', tipo: '' });
  const [despachando, setDespachando] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => { cargar(); }, [filtro]);

  const cargar = async () => {
    try {
      setCargando(true);
      const res = await api.get(`/farmacia?estado=${filtro}`);
      setPrescripciones(res.data);
    } catch (err) {
      mostrarToast('Error al cargar prescripciones', 'error');
    } finally {
      setCargando(false);
    }
  };

  const mostrarToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast({ msg: '', tipo: '' }), 4000);
  };

  const despachar = async () => {
    try {
      setProcesando(true);
      await api.post(`/farmacia/${despachando.id_prescripcion}/despachar`, { observaciones });
      mostrarToast('✅ Medicamento despachado correctamente');
      setDespachando(null);
      setObservaciones('');
      cargar();
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al despachar', 'error');
    } finally {
      setProcesando(false);
    }
  };

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar esta prescripción?')) return;
    try {
      await api.put(`/farmacia/${id}/cancelar`);
      mostrarToast('Prescripción cancelada');
      cargar();
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al cancelar', 'error');
    }
  };

  const estadoBadge = {
    pendiente:  'bg-yellow-100 text-yellow-700',
    despachado: 'bg-green-100 text-green-700',
    cancelado:  'bg-red-100 text-red-600',
  };

  const pendientes = prescripciones.filter(p => p.estado_despacho === 'pendiente').length;

  return (
    <div>
      {/* Toast */}
      {toast.msg && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50 text-white ${toast.tipo === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Modal despacho */}
      {despachando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-blue-900 text-white p-5 rounded-t-2xl">
              <h2 className="font-bold text-base">💊 Despachar medicamento</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-900">{despachando.nombre_medicamento}</p>
                <p className="text-blue-700 text-xs mt-1">Dosis: {despachando.dosis} — Cantidad: {despachando.cantidad}</p>
                <p className="text-blue-700 text-xs">Interno: {despachando.visita?.interno?.nombres} {despachando.visita?.interno?.apellidos}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Observaciones <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3} placeholder="Ej. Entregado en mano al enfermero..." />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end">
              <button onClick={() => { setDespachando(null); setObservaciones(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={despachar} disabled={procesando}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                {procesando ? 'Despachando...' : '✅ Confirmar despacho'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Farmacia</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pendientes > 0
              ? `${pendientes} prescripción${pendientes !== 1 ? 'es' : ''} pendiente${pendientes !== 1 ? 's' : ''} de despacho`
              : 'Sin pendientes'}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex gap-2">
        {['pendiente', 'despachado', 'cancelado'].map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
              filtro === e ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}>
            {e === 'pendiente' ? '⏳ Pendientes' : e === 'despachado' ? '✅ Despachados' : '❌ Cancelados'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center"><p className="text-gray-400 text-sm">Cargando...</p></div>
        ) : prescripciones.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">💊</p>
            <p className="text-gray-500 font-medium">No hay prescripciones {filtro === 'pendiente' ? 'pendientes' : filtro === 'despachado' ? 'despachadas' : 'canceladas'}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold">Medicamento</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Interno</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Dosis / Cantidad</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Médico</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Estado</th>
                {filtro === 'pendiente' && <th className="text-left px-6 py-3 text-sm font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {prescripciones.map((p, idx) => (
                <tr key={p.id_prescripcion} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 text-sm">{p.nombre_medicamento}</p>
                    {p.tiempo_aplicacion && <p className="text-gray-400 text-xs mt-0.5">{p.tiempo_aplicacion}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {p.visita?.interno?.nombres} {p.visita?.interno?.apellidos}
                    <p className="text-gray-400 text-xs">{p.visita?.interno?.dpi}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p>{p.dosis}</p>
                    <p className="text-gray-400 text-xs">Cant: {p.cantidad}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.visita?.medico?.nombre_completo}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${estadoBadge[p.estado_despacho]}`}>
                      {p.estado_despacho}
                    </span>
                  </td>
                  {filtro === 'pendiente' && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setDespachando(p)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700">
                          Despachar
                        </button>
                        <button onClick={() => cancelar(p.id_prescripcion)}
                          className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50">
                          Cancelar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
