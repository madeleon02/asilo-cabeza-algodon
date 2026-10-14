import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fmt = n => `Q ${parseFloat(n || 0).toFixed(2)}`;

function TarjetaStat({ icono, label, valor, color = 'blue' }) {
  const colores = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };
  return (
    <div className={`border rounded-xl p-5 ${colores[color]}`}>
      <p className="text-2xl mb-1">{icono}</p>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}

function BarraHorizontal({ label, valor, max, color = 'bg-blue-500' }) {
  const pct = max > 0 ? Math.round((valor / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 truncate text-gray-600">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-gray-700">{valor}</span>
    </div>
  );
}

const BADGE = {
  activo: 'bg-green-100 text-green-800',
  hospitalizado: 'bg-yellow-100 text-yellow-800',
  egresado: 'bg-gray-100 text-gray-700',
  fallecido: 'bg-red-100 text-red-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  asignada: 'bg-blue-100 text-blue-800',
  en_proceso: 'bg-purple-100 text-purple-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  despachado: 'bg-green-100 text-green-800',
  realizado: 'bg-green-100 text-green-800',
};

export default function Reportes() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState('internos');
  const [datos, setDatos] = useState({});
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async (seccion) => {
    if (datos[seccion]) return;
    setCargando(true);
    try {
      const r = await fetch(`${API}/reportes/${seccion}`, { headers });
      const d = await r.json();
      setDatos(prev => ({ ...prev, [seccion]: d }));
    } catch { }
    finally { setCargando(false); }
  }, [datos, token]);

  useEffect(() => { cargar(tab); }, [tab]);

  const tabs = [
    { id: 'internos', label: '👴 Internos' },
    { id: 'solicitudes', label: '📋 Solicitudes' },
    { id: 'financiero', label: '💰 Financiero' },
    { id: 'farmacia', label: '💊 Farmacia / Lab' },
  ];

  const d = datos[tab];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Indicadores y estadísticas del sistema</p>
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

      {cargando && <p className="text-gray-400 text-sm">Cargando reporte...</p>}

      {/* ── INTERNOS ── */}
      {tab === 'internos' && d && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TarjetaStat icono="👴" label="Total internos" valor={d.total} color="blue" />
            {d.por_estado.map(e => (
              <TarjetaStat key={e.estado} icono={
                e.estado === 'activo' ? '✅' : e.estado === 'hospitalizado' ? '🏥' : e.estado === 'egresado' ? '🚪' : '🕊️'
              } label={e.estado.charAt(0).toUpperCase() + e.estado.slice(1)} valor={e.cantidad}
                color={e.estado === 'activo' ? 'green' : e.estado === 'hospitalizado' ? 'yellow' : e.estado === 'fallecido' ? 'red' : 'blue'} />
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-4">Últimos 10 ingresos</h3>
            <table className="w-full text-sm">
              <thead className="text-gray-500 uppercase text-xs border-b">
                <tr>
                  <th className="pb-2 text-left">Nombre</th>
                  <th className="pb-2 text-left">Estado</th>
                  <th className="pb-2 text-left">Fecha ingreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {d.recientes.map(i => (
                  <tr key={i.id_interno} className="hover:bg-gray-50">
                    <td className="py-2">{i.nombres} {i.apellidos}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[i.estado]}`}>{i.estado}</span>
                    </td>
                    <td className="py-2">{new Date(i.fecha_ingreso).toLocaleDateString('es-GT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SOLICITUDES ── */}
      {tab === 'solicitudes' && d && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <TarjetaStat icono="📋" label="Total solicitudes" valor={d.solicitudes.total} color="blue" />
            <TarjetaStat icono="🩺" label="Total visitas" valor={d.visitas.total} color="purple" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Solicitudes por estado</h3>
              <div className="space-y-3">
                {d.solicitudes.por_estado.map(e => (
                  <div key={e.estado} className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[e.estado]}`}>{e.estado}</span>
                    <span className="font-bold text-gray-700">{e.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Especialidades más solicitadas</h3>
              <div className="space-y-3">
                {d.solicitudes.por_especialidad.map((e, i) => (
                  <BarraHorizontal key={e.especialidad} label={e.especialidad} valor={e.cantidad}
                    max={d.solicitudes.por_especialidad[0]?.cantidad || 1}
                    color={['bg-blue-500','bg-purple-500','bg-green-500','bg-yellow-500','bg-red-500','bg-pink-500','bg-indigo-500','bg-teal-500'][i % 8]} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FINANCIERO ── */}
      {tab === 'financiero' && d && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TarjetaStat icono="💳" label="Total cobrado" valor={fmt(d.cobros.total_cobrado)} color="green" />
            <TarjetaStat icono="⏳" label="Saldo pendiente" valor={fmt(d.cobros.saldo_pendiente)} color="yellow" />
            <TarjetaStat icono="🤝" label="Total donaciones" valor={fmt(d.donaciones.total)} color="blue" />
            <TarjetaStat icono="🧾" label="Total gastos" valor={fmt(d.gastos.total)} color="red" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Donaciones por tipo</h3>
              <div className="space-y-3">
                {d.donaciones.por_tipo.map(t => (
                  <div key={t.tipo} className="flex justify-between items-center text-sm">
                    <span className="capitalize text-gray-600">{t.tipo.replace('_', ' ')}</span>
                    <span className="font-medium text-green-700">{fmt(t.monto)}</span>
                  </div>
                ))}
                {d.donaciones.por_tipo.length === 0 && <p className="text-gray-400 text-sm">Sin donaciones registradas</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Gastos por categoría</h3>
              <div className="space-y-3">
                {d.gastos.por_categoria.map((g, i) => (
                  <BarraHorizontal key={g.categoria} label={g.categoria} valor={g.cantidad}
                    max={d.gastos.por_categoria[0]?.cantidad || 1}
                    color={['bg-red-500','bg-orange-500','bg-yellow-500','bg-pink-500','bg-purple-500','bg-indigo-500'][i % 6]} />
                ))}
                {d.gastos.por_categoria.length === 0 && <p className="text-gray-400 text-sm">Sin gastos registrados</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-2">Resumen general</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-3">
              <div><p className="text-xs text-gray-400 uppercase">Cobros emitidos</p><p className="font-semibold text-gray-800">{fmt(d.cobros.total_emitido)}</p></div>
              <div><p className="text-xs text-gray-400 uppercase">Pagos a fundación</p><p className="font-semibold text-gray-800">{fmt(d.pagos_fundacion.total)}</p></div>
              <div><p className="text-xs text-gray-400 uppercase">Nº cobros</p><p className="font-semibold text-gray-800">{d.cobros.cantidad}</p></div>
              <div><p className="text-xs text-gray-400 uppercase">Nº donaciones</p><p className="font-semibold text-gray-800">{d.donaciones.cantidad}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* ── FARMACIA / LAB ── */}
      {tab === 'farmacia' && d && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TarjetaStat icono="💊" label="Total prescripciones" valor={d.prescripciones.total} color="purple" />
            <TarjetaStat icono="🔬" label="Total exámenes" valor={d.examenes.total} color="blue" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Prescripciones por estado</h3>
              <div className="space-y-2">
                {d.prescripciones.por_estado.map(e => (
                  <div key={e.estado} className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[e.estado] || 'bg-gray-100 text-gray-700'}`}>{e.estado}</span>
                    <span className="font-bold text-gray-700">{e.cantidad}</span>
                  </div>
                ))}
              </div>
              <h3 className="font-semibold text-gray-700 mt-5 mb-3">Medicamentos más prescritos</h3>
              <div className="space-y-3">
                {d.prescripciones.mas_prescritos.map((m, i) => (
                  <BarraHorizontal key={m.medicamento} label={m.medicamento} valor={m.cantidad}
                    max={d.prescripciones.mas_prescritos[0]?.cantidad || 1}
                    color={['bg-purple-500','bg-blue-500','bg-green-500','bg-yellow-500','bg-red-500','bg-pink-500','bg-indigo-500','bg-teal-500'][i % 8]} />
                ))}
                {d.prescripciones.mas_prescritos.length === 0 && <p className="text-gray-400 text-sm">Sin datos</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Exámenes por estado</h3>
              <div className="space-y-2">
                {d.examenes.por_estado.map(e => (
                  <div key={e.estado} className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[e.estado] || 'bg-gray-100 text-gray-700'}`}>{e.estado}</span>
                    <span className="font-bold text-gray-700">{e.cantidad}</span>
                  </div>
                ))}
              </div>
              <h3 className="font-semibold text-gray-700 mt-5 mb-3">Exámenes más solicitados</h3>
              <div className="space-y-3">
                {d.examenes.mas_solicitados.map((e, i) => (
                  <BarraHorizontal key={e.examen} label={e.examen} valor={e.cantidad}
                    max={d.examenes.mas_solicitados[0]?.cantidad || 1}
                    color={['bg-blue-500','bg-teal-500','bg-green-500','bg-yellow-500','bg-orange-500','bg-red-500','bg-pink-500','bg-indigo-500'][i % 8]} />
                ))}
                {d.examenes.mas_solicitados.length === 0 && <p className="text-gray-400 text-sm">Sin datos</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
