import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function Internos() {
  const [internos, setInternos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarInternos();
  }, []);

  const cargarInternos = async () => {
    try {
      const res = await api.get('/internos');
      setInternos(res.data);
    } catch (error) {
      console.error('Error al cargar internos:', error);
    } finally {
      setCargando(false);
    }
  };

  const estadoColor = {
    activo: 'bg-green-100 text-green-700',
    hospitalizado: 'bg-yellow-100 text-yellow-700',
    egresado: 'bg-blue-100 text-blue-700',
    fallecido: 'bg-gray-100 text-gray-600',
  };

  const internosFiltrados = internos.filter(i =>
    `${i.nombres} ${i.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.dpi.includes(busqueda)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Internos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {internos.length} interno{internos.length !== 1 ? 's' : ''} registrado{internos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2">
          <span>+</span> Nuevo interno
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o DPI..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">Cargando internos...</p>
          </div>
        ) : internosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">👴</p>
            <p className="text-gray-500 font-medium">No hay internos registrados</p>
            <p className="text-gray-400 text-sm mt-1">Presiona "Nuevo interno" para agregar el primero</p>
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
              {internosFiltrados.map((interno, idx) => (
                <tr key={interno.id_interno} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-900 text-sm">
                        {interno.nombres.charAt(0)}{interno.apellidos.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{interno.nombres} {interno.apellidos}</p>
                      </div>
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