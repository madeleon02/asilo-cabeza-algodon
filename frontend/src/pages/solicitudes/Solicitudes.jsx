import { useState, useEffect } from 'react';
import api from '../../services/api';

const ESTADOS_COLOR = {
  pendiente:  'bg-blue-100 text-blue-800',
  asignada:   'bg-green-100 text-green-800',
  en_proceso: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-gray-100 text-gray-800',
  cancelada:  'bg-red-100 text-red-800',
};

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [internos, setInternos]       = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [toast, setToast]             = useState('');
  const [filtro, setFiltro]           = useState('todos');
  const [form, setForm] = useState({
    id_interno: '', especialidad_requerida: '', motivo_referencia: ''
  });

  const ESPECIALIDADES = [
    'Cardiologia','Neurologia','Ortopedia','Geriatria',
    'Psiquiatria','Oftalmologia','Dermatologia','Medicina Interna'
  ];

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setCargando(true);
      const [s, i] = await Promise.all([
        api.get('/solicitudes'),
        api.get('/internos'),
      ]);
      setSolicitudes(s.data);
      setInternos(i.data.filter(x => x.estado === 'activo'));
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }

  async function guardar(e) {
    e.preventDefault();
    try {
      await api.post('/solicitudes', form);
      setMostrarForm(false);
      setForm({ id_interno: '', especialidad_requerida: '', motivo_referencia: '' });
      mostrarToast('Solicitud creada correctamente');
      cargar();
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al crear solicitud', true);
    }
  }

  async function cancelar(id) {
    if (!confirm('Cancelar esta solicitud?')) return;
    try {
      await api.put('/solicitudes/' + id + '/cancelar');
      mostrarToast('Solicitud cancelada');
      cargar();
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al cancelar', true);
    }
  }

  function mostrarToast(msg, error) {
    setToast({ msg, error });
    setTimeout(() => setToast(''), 3000);
  }

  const filtradas = filtro === 'todos'
    ? solicitudes
    : solicitudes.filter(s => s.estado === filtro);

  return (
    <div className="p-6">
      {toast && (
        <div className={'fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white font-medium ' + (toast.error ? 'bg-red-600' : 'bg-green-600')}>
          {toast.msg}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Solicitudes de Referencia</h1>
          <p className="text-gray-500 text-sm">{solicitudes.length} solicitud(es) registrada(s)</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-900 font-medium">
          + Nueva solicitud
        </button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos','pendiente','asignada','en_proceso','completada','cancelada'].map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={'px-3 py-1 rounded-full text-sm font-medium border transition ' + (filtro === e ? 'bg-blue-800 text-white border-blue-800' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400')}>
            {e.charAt(0).toUpperCase() + e.slice(1).replace('_',' ')}
          </button>
        ))}
      </div>
      {cargando ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No hay solicitudes</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="px-4 py-3 text-left">Interno</th>
                <th className="px-4 py-3 text-left">Especialidad</th>
                <th className="px-4 py-3 text-left">Medico General</th>
                <th className="px-4 py-3 text-left">Fecha cita</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((s, i) => (
                <tr key={s.id_solicitud} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                  <td className="px-4 py-3 font-medium text-blue-900">{s.interno?.nombres} {s.interno?.apellidos}</td>
                  <td className="px-4 py-3">{s.especialidad_requerida}</td>
                  <td className="px-4 py-3">{s.medico_general?.nombre_completo || '-'}</td>
                  <td className="px-4 py-3">{s.fecha_cita ? new Date(s.fecha_cita).toLocaleDateString('es-GT') : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={'px-2 py-1 rounded-full text-xs font-bold ' + (ESTADOS_COLOR[s.estado] || '')}>
                      {s.estado.replace('_',' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!['completada','cancelada'].includes(s.estado) && (
                      <button onClick={() => cancelar(s.id_solicitud)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium">
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-blue-900 text-white px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-bold">Nueva Solicitud de Referencia</h2>
              <p className="text-blue-200 text-sm">Asilo Cabeza de Algodon</p>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interno *</label>
                <select required value={form.id_interno}
                  onChange={e => setForm({...form, id_interno: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Seleccione un interno</option>
                  {internos.map(i => (
                    <option key={i.id_interno} value={i.id_interno}>{i.nombres} {i.apellidos} - {i.dpi}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad requerida *</label>
                <select required value={form.especialidad_requerida}
                  onChange={e => setForm({...form, especialidad_requerida: e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Seleccione especialidad</option>
                  {ESPECIALIDADES.map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de referencia *</label>
                <textarea required rows={4} value={form.motivo_referencia}
                  onChange={e => setForm({...form, motivo_referencia: e.target.value})}
                  placeholder="Describa el motivo clinico de la referencia..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"/>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setMostrarForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 text-sm">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900 text-sm font-medium">
                  Crear solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
