import { useState, useEffect } from 'react';
import api from '../../services/api';

// ─── Formulario de 3 pasos ────────────────────────────────────────────────────
function FormularioInterno({ onGuardado, onCancelar }) {
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [datos, setDatos] = useState({
    // Paso 1 — Datos personales
    nombres: '', apellidos: '', dpi: '',
    fecha_nacimiento: '', fecha_ingreso: new Date().toISOString().split('T')[0],
    estado: 'activo', motivo_ingreso: '',
    // Paso 2 — Familiar
    fam_nombres: '', fam_apellidos: '', parentesco: '',
    telefono: '', correo_electronico: '', direccion: '',
    // Paso 3 — Condición médica
    psicopatologia: '', medicamento: '', dosis: '',
  });

  const actualizar = (campo, valor) => setDatos(prev => ({ ...prev, [campo]: valor }));

  const validarPaso = () => {
    if (paso === 1) {
      if (!datos.nombres || !datos.apellidos || !datos.dpi || !datos.fecha_nacimiento || !datos.fecha_ingreso) {
        setError('Complete todos los campos obligatorios'); return false;
      }
    }
    if (paso === 2) {
      if (!datos.fam_nombres || !datos.fam_apellidos || !datos.parentesco || !datos.telefono || !datos.correo_electronico) {
        setError('Complete todos los campos obligatorios'); return false;
      }
    }
    setError(''); return true;
  };

  const siguiente = () => { if (validarPaso()) setPaso(p => p + 1); };
  const anterior  = () => { setError(''); setPaso(p => p - 1); };

  const guardar = async () => {
    if (!validarPaso()) return;
    try {
      setCargando(true);
      const payload = {
        nombres: datos.nombres, apellidos: datos.apellidos,
        dpi: datos.dpi.replace(/\s/g, ''),
        fecha_nacimiento: datos.fecha_nacimiento,
        fecha_ingreso: datos.fecha_ingreso,
        estado: datos.estado,
        motivo_ingreso: datos.motivo_ingreso || null,
        familiar: {
          nombres: datos.fam_nombres, apellidos: datos.fam_apellidos,
          parentesco: datos.parentesco, telefono: datos.telefono,
          correo_electronico: datos.correo_electronico,
          direccion: datos.direccion || null,
        },
        psicopatologias: datos.psicopatologia ? [{ nombre_condicion: datos.psicopatologia }] : [],
        medicamentos: datos.medicamento ? [{ nombre_medicamento: datos.medicamento, dosis: datos.dosis }] : [],
      };
      await api.post('/internos', payload);
      onGuardado();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el interno');
    } finally {
      setCargando(false);
    }
  };

  const estadoOpciones = [
    { val: 'activo', label: 'Activo', icon: '💚', cls: 'border-green-500 bg-green-50 text-green-700' },
    { val: 'hospitalizado', label: 'Hospitalizado', icon: '🏥', cls: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
    { val: 'egresado', label: 'Egresado', icon: '🚪', cls: 'border-blue-500 bg-blue-50 text-blue-700' },
    { val: 'fallecido', label: 'Fallecido', icon: '🕊️', cls: 'border-gray-400 bg-gray-100 text-gray-600' },
  ];

  const pasos = ['Datos personales', 'Familiar responsable', 'Condición médica'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">

        {/* Header */}
        <div className="bg-blue-900 text-white p-6 rounded-t-2xl">
          <h2 className="text-lg font-bold">Registro de nuevo interno</h2>
          <p className="text-blue-300 text-sm mt-1">Asilo Cabeza de Algodón</p>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-5">
          <div className="flex items-center justify-between mb-2">
            {pasos.map((p, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  i + 1 < paso ? 'bg-green-500 text-white' :
                  i + 1 === paso ? 'bg-blue-900 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i + 1 < paso ? '✓' : i + 1}
                </div>
                <div className="ml-2 flex-1">
                  <p className={`text-xs font-semibold ${i + 1 === paso ? 'text-blue-900' : 'text-gray-400'}`}>{p}</p>
                </div>
                {i < 2 && <div className={`h-0.5 w-8 mx-2 ${i + 1 < paso ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full mt-3">
            <div className="h-full bg-blue-900 rounded-full transition-all duration-300" style={{ width: `${(paso/3)*100}%` }} />
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* PASO 1 */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-700 text-xs font-medium">👤 Datos personales del interno</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombres <span className="text-red-500">*</span></label>
                  <input value={datos.nombres} onChange={e => actualizar('nombres', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. Carlos Enrique" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Apellidos <span className="text-red-500">*</span></label>
                  <input value={datos.apellidos} onChange={e => actualizar('apellidos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. Ajú Pérez" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">DPI <span className="text-red-500">*</span></label>
                  <input value={datos.dpi} onChange={e => actualizar('dpi', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0000 00000 0000" maxLength={15} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Fecha de nacimiento <span className="text-red-500">*</span></label>
                  <input type="date" value={datos.fecha_nacimiento} onChange={e => actualizar('fecha_nacimiento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Fecha de ingreso <span className="text-red-500">*</span></label>
                  <input type="date" value={datos.fecha_ingreso} onChange={e => actualizar('fecha_ingreso', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Estado <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-1">
                    {estadoOpciones.map(op => (
                      <button key={op.val} type="button" onClick={() => actualizar('estado', op.val)}
                        className={`border-2 rounded-lg p-2 text-xs font-semibold flex items-center gap-1 transition-all ${datos.estado === op.val ? op.cls + ' border-2' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        <span>{op.icon}</span> {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Motivo de ingreso <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea value={datos.motivo_ingreso} onChange={e => actualizar('motivo_ingreso', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3} placeholder="Describa el motivo de ingreso..." />
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-700 text-xs font-medium">👨‍👩‍👦 Datos del familiar responsable</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombres <span className="text-red-500">*</span></label>
                  <input value={datos.fam_nombres} onChange={e => actualizar('fam_nombres', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombres del familiar" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Apellidos <span className="text-red-500">*</span></label>
                  <input value={datos.fam_apellidos} onChange={e => actualizar('fam_apellidos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Apellidos del familiar" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Parentesco <span className="text-red-500">*</span></label>
                  <select value={datos.parentesco} onChange={e => actualizar('parentesco', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Seleccione —</option>
                    <option>Hijo/a</option><option>Nieto/a</option>
                    <option>Sobrino/a</option><option>Hermano/a</option><option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Teléfono <span className="text-red-500">*</span></label>
                  <input value={datos.telefono} onChange={e => actualizar('telefono', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. 5588-2233" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Correo electrónico <span className="text-red-500">*</span></label>
                <input type="email" value={datos.correo_electronico} onChange={e => actualizar('correo_electronico', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="correo@ejemplo.com" />
                <p className="text-xs text-gray-400 mt-1">📧 Se usará para notificaciones automáticas</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Dirección <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input value={datos.direccion} onChange={e => actualizar('direccion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dirección del familiar" />
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {paso === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-700 text-xs font-medium">🩺 Condición médica inicial</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Psicopatología o condición crónica <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input value={datos.psicopatologia} onChange={e => actualizar('psicopatologia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej. Demencia senil leve, Alzheimer..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Medicamento de cajón <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input value={datos.medicamento} onChange={e => actualizar('medicamento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. Memantina 10mg" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Dosis <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input value={datos.dosis} onChange={e => actualizar('dosis', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. 1 tableta cada 12 horas" />
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-green-700 text-sm font-semibold mb-2">✅ Resumen del registro</p>
                <p className="text-green-600 text-xs">Interno: <strong>{datos.nombres} {datos.apellidos}</strong></p>
                <p className="text-green-600 text-xs">DPI: <strong>{datos.dpi}</strong></p>
                <p className="text-green-600 text-xs">Familiar: <strong>{datos.fam_nombres} {datos.fam_apellidos}</strong></p>
                <p className="text-green-600 text-xs">Contacto: <strong>{datos.correo_electronico}</strong></p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400"><span className="text-red-500">*</span> Campos obligatorios</p>
          <div className="flex gap-3">
            {paso === 1 && <button onClick={onCancelar} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>}
            {paso > 1 && <button onClick={anterior} className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm hover:bg-blue-50">‹ Anterior</button>}
            {paso < 3 && <button onClick={siguiente} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800">Siguiente ›</button>}
            {paso === 3 && (
              <button onClick={guardar} disabled={cargando}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                {cargando ? 'Guardando...' : '✅ Guardar registro'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Módulo principal de Internos ─────────────────────────────────────────────
export default function Internos() {
  const [internos, setInternos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { cargarInternos(); }, []);

  const cargarInternos = async () => {
    try {
      const res = await api.get('/internos');
      setInternos(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const onGuardado = () => {
    setMostrarFormulario(false);
    cargarInternos();
    setToast('✅ Interno registrado correctamente');
    setTimeout(() => setToast(''), 4000);
  };

  const estadoColor = {
    activo: 'bg-green-100 text-green-700',
    hospitalizado: 'bg-yellow-100 text-yellow-700',
    egresado: 'bg-blue-100 text-blue-700',
    fallecido: 'bg-gray-100 text-gray-600',
  };

  const filtrados = internos.filter(i =>
    `${i.nombres} ${i.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.dpi.includes(busqueda)
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50 animate-bounce">
          {toast}
        </div>
      )}

      {/* Formulario modal */}
      {mostrarFormulario && (
        <FormularioInterno
          onGuardado={onGuardado}
          onCancelar={() => setMostrarFormulario(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Internos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {internos.length} interno{internos.length !== 1 ? 's' : ''} registrado{internos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setMostrarFormulario(true)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2">
          + Nuevo interno
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <input type="text" placeholder="Buscar por nombre o DPI..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center"><p className="text-gray-400 text-sm">Cargando internos...</p></div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">👴</p>
            <p className="text-gray-500 font-medium">No hay internos registrados</p>
            <p className="text-gray-400 text-sm mt-1">Presiona "+ Nuevo interno" para agregar el primero</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-blue-900 text-white">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold">Interno</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">DPI</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Familiar</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Ingreso</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Estado</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((interno, idx) => (
                <tr key={interno.id_interno} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-900 text-sm">
                        {interno.nombres.charAt(0)}{interno.apellidos.charAt(0)}
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{interno.nombres} {interno.apellidos}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{interno.dpi}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {interno.familiar?.nombres} {interno.familiar?.apellidos}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(interno.fecha_ingreso).toLocaleDateString('es-GT')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${estadoColor[interno.estado]}`}>
                      {interno.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}