import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function Toast({ msg, tipo, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${tipo === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}>
      {msg}
    </div>
  );
}

const fmt = n => `Q ${parseFloat(n || 0).toFixed(2)}`;
const fmtFecha = f => f ? new Date(f).toLocaleDateString('es-GT') : '—';

export default function Finanzas() {
  const { usuario } = useAuth();
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState('resumen');
  const [toast, setToast] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [cobros, setCobros] = useState([]);
  const [donaciones, setDonaciones] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [pagosFund, setPagosFund] = useState([]);
  const [modal, setModal] = useState(null); // { tipo, datos }
  const [form, setForm] = useState({});
  const [cargando, setCargando] = useState(false);

  const toast_ok = msg => setToast({ msg, tipo: 'ok' });
  const toast_err = msg => setToast({ msg, tipo: 'err' });

  const get = useCallback(async (url) => {
    const r = await fetch(`${API}${url}`, { headers });
    return r.json();
  }, [token]);

  const cargarResumen = useCallback(async () => {
    const d = await get('/finanzas/resumen');
    setResumen(d);
  }, [get]);

  const cargarCobros = useCallback(async () => {
    const d = await get('/finanzas/cobros');
    setCobros(Array.isArray(d) ? d : []);
  }, [get]);

  const cargarDonaciones = useCallback(async () => {
    const d = await get('/finanzas/donaciones');
    setDonaciones(Array.isArray(d) ? d : []);
  }, [get]);

  const cargarGastos = useCallback(async () => {
    const d = await get('/finanzas/gastos');
    setGastos(Array.isArray(d) ? d : []);
  }, [get]);

  const cargarPagosFund = useCallback(async () => {
    const d = await get('/finanzas/pagos-fundacion');
    setPagosFund(Array.isArray(d) ? d : []);
  }, [get]);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);
  useEffect(() => {
    if (tab === 'cobros') cargarCobros();
    if (tab === 'donaciones') cargarDonaciones();
    if (tab === 'gastos') cargarGastos();
    if (tab === 'fundacion') cargarPagosFund();
  }, [tab]);

  const abrirModal = (tipo, datos = {}) => { setModal(tipo); setForm(datos); };
  const cerrarModal = () => { setModal(null); setForm({}); };

  const enviar = async (url, method, body, onOk) => {
    setCargando(true);
    try {
      const r = await fetch(`${API}${url}`, { method, headers, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) { toast_err(d.error || 'Error'); return; }
      toast_ok('Guardado exitosamente');
      cerrarModal();
      onOk();
      cargarResumen();
    } catch { toast_err('Error de conexión'); }
    finally { setCargando(false); }
  };

  // ── Tabs ──
  const tabs = [
    { id: 'resumen', label: '📊 Resumen' },
    { id: 'cobros', label: '💳 Cobros' },
    { id: 'donaciones', label: '🤝 Donaciones' },
    { id: 'gastos', label: '🧾 Gastos' },
    { id: 'fundacion', label: '🏛️ Pagos Fundación' },
  ];

  const badgeEstado = e => {
    const map = { pendiente: 'bg-yellow-100 text-yellow-800', parcial: 'bg-blue-100 text-blue-800', pagado: 'bg-green-100 text-green-800' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[e] || 'bg-gray-100 text-gray-700'}`}>{e}</span>;
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">💰 Finanzas</h1>
        <p className="text-gray-500 text-sm mt-1">Gestión financiera del asilo</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {tab === 'resumen' && resumen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Cobros cobrados', val: fmt(resumen.cobros?.pagado), color: 'green', icon: '✅' },
            { label: 'Cobros pendientes', val: fmt(resumen.cobros?.pendiente), color: 'yellow', icon: '⏳' },
            { label: 'Total donaciones', val: fmt(resumen.donaciones), color: 'blue', icon: '🤝' },
            { label: 'Gastos operativos', val: fmt(resumen.gastos), color: 'red', icon: '🧾' },
            { label: 'Pagos a fundación', val: fmt(resumen.pagos_fundacion), color: 'purple', icon: '🏛️' },
            { label: 'Total cobros emitidos', val: fmt(resumen.cobros?.total), color: 'gray', icon: '📋' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-2xl mb-2">{c.icon}</p>
              <p className="text-2xl font-bold text-gray-800">{c.val}</p>
              <p className="text-sm text-gray-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── COBROS ── */}
      {tab === 'cobros' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">Cobros a Familiares</h2>
            <button onClick={() => abrirModal('cobro')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              + Nuevo cobro
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  {['Interno', 'Familiar', 'Descripción', 'Total', 'Pagado', 'Saldo', 'Estado', 'Fecha', 'Acción'].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cobros.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Sin cobros registrados</td></tr>}
                {cobros.map(c => (
                  <tr key={c.id_cobro} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{c.interno?.nombre_completo}</td>
                    <td className="px-4 py-3">{c.familiar?.nombre_completo}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{c.descripcion}</td>
                    <td className="px-4 py-3">{fmt(c.monto_total)}</td>
                    <td className="px-4 py-3">{fmt(c.monto_pagado)}</td>
                    <td className="px-4 py-3 font-medium text-red-600">{fmt(c.saldo_pendiente)}</td>
                    <td className="px-4 py-3">{badgeEstado(c.estado)}</td>
                    <td className="px-4 py-3">{fmtFecha(c.fecha_cobro)}</td>
                    <td className="px-4 py-3">
                      {c.estado !== 'pagado' && (
                        <button onClick={() => abrirModal('pago', { id_cobro: c.id_cobro, saldo: c.saldo_pendiente })}
                          className="text-blue-600 hover:underline text-xs">Registrar pago</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DONACIONES ── */}
      {tab === 'donaciones' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">Donaciones</h2>
            <button onClick={() => abrirModal('donacion')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              + Registrar donación
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  {['Tipo donante', 'Donante', 'Monto', 'Fecha', 'Descripción'].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donaciones.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin donaciones registradas</td></tr>}
                {donaciones.map(d => (
                  <tr key={d.id_donacion} className="hover:bg-gray-50">
                    <td className="px-4 py-3 capitalize">{d.tipo_donante.replace('_', ' ')}</td>
                    <td className="px-4 py-3">{d.nombre_donante}</td>
                    <td className="px-4 py-3 font-medium text-green-700">{fmt(d.monto)}</td>
                    <td className="px-4 py-3">{fmtFecha(d.fecha_donacion)}</td>
                    <td className="px-4 py-3 text-gray-500">{d.descripcion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GASTOS ── */}
      {tab === 'gastos' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">Gastos Operativos</h2>
            <button onClick={() => abrirModal('gasto')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              + Registrar gasto
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  {['Categoría', 'Descripción', 'Monto', 'Proveedor', 'Fecha'].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gastos.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin gastos registrados</td></tr>}
                {gastos.map(g => (
                  <tr key={g.id_gasto} className="hover:bg-gray-50">
                    <td className="px-4 py-3 capitalize">{g.categoria}</td>
                    <td className="px-4 py-3">{g.descripcion}</td>
                    <td className="px-4 py-3 font-medium text-red-700">{fmt(g.monto)}</td>
                    <td className="px-4 py-3">{g.proveedor || '—'}</td>
                    <td className="px-4 py-3">{fmtFecha(g.fecha_gasto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PAGOS FUNDACIÓN ── */}
      {tab === 'fundacion' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">Pagos a la Fundación</h2>
            <button onClick={() => abrirModal('fundacion')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              + Registrar pago
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  {['Monto', 'Fecha', 'Descripción'].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagosFund.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Sin pagos registrados</td></tr>}
                {pagosFund.map(p => (
                  <tr key={p.id_pago_fundacion} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{fmt(p.monto)}</td>
                    <td className="px-4 py-3">{fmtFecha(p.fecha_pago)}</td>
                    <td className="px-4 py-3 text-gray-500">{p.descripcion || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALES ── */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

            {/* Modal: Nuevo cobro */}
            {modal === 'cobro' && (
              <>
                <h3 className="text-lg font-bold mb-4">Nuevo Cobro a Familiar</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Familiar</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.id_familiar || ''} onChange={e => setForm({ ...form, id_familiar: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Interno</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.id_interno || ''} onChange={e => setForm({ ...form, id_interno: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total (Q)</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.monto_total || ''} onChange={e => setForm({ ...form, monto_total: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={cerrarModal} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                  <button disabled={cargando} onClick={() => enviar('/finanzas/cobros', 'POST', form, cargarCobros)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    {cargando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </>
            )}

            {/* Modal: Registrar pago */}
            {modal === 'pago' && (
              <>
                <h3 className="text-lg font-bold mb-1">Registrar Pago</h3>
                <p className="text-sm text-gray-500 mb-4">Saldo pendiente: {fmt(form.saldo)}</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto a pagar (Q)</label>
                  <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.monto_pago || ''} onChange={e => setForm({ ...form, monto_pago: e.target.value })} />
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={cerrarModal} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                  <button disabled={cargando} onClick={() => enviar(`/finanzas/cobros/${form.id_cobro}/pago`, 'PUT', { monto_pago: form.monto_pago }, cargarCobros)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                    {cargando ? 'Guardando...' : 'Confirmar pago'}
                  </button>
                </div>
              </>
            )}

            {/* Modal: Donación */}
            {modal === 'donacion' && (
              <>
                <h3 className="text-lg font-bold mb-4">Registrar Donación</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de donante</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.tipo_donante || ''} onChange={e => setForm({ ...form, tipo_donante: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      <option value="empresa_internacional">Empresa internacional</option>
                      <option value="empresa_nacional">Empresa nacional</option>
                      <option value="gobierno">Gobierno</option>
                      <option value="particular">Particular</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del donante</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.nombre_donante || ''} onChange={e => setForm({ ...form, nombre_donante: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Q)</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.monto || ''} onChange={e => setForm({ ...form, monto: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                    <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={cerrarModal} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                  <button disabled={cargando} onClick={() => enviar('/finanzas/donaciones', 'POST', form, cargarDonaciones)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    {cargando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </>
            )}

            {/* Modal: Gasto */}
            {modal === 'gasto' && (
              <>
                <h3 className="text-lg font-bold mb-4">Registrar Gasto Operativo</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <input type="text" placeholder="ej. Alimentación, Medicamentos, Mantenimiento"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.categoria || ''} onChange={e => setForm({ ...form, categoria: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Q)</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.monto || ''} onChange={e => setForm({ ...form, monto: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor (opcional)</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.proveedor || ''} onChange={e => setForm({ ...form, proveedor: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={cerrarModal} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                  <button disabled={cargando} onClick={() => enviar('/finanzas/gastos', 'POST', form, cargarGastos)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    {cargando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </>
            )}

            {/* Modal: Pago fundación */}
            {modal === 'fundacion' && (
              <>
                <h3 className="text-lg font-bold mb-4">Registrar Pago a Fundación</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Q)</label>
                    <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.monto || ''} onChange={e => setForm({ ...form, monto: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                    <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={cerrarModal} className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                  <button disabled={cargando} onClick={() => enviar('/finanzas/pagos-fundacion', 'POST', form, cargarPagosFund)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                    {cargando ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
