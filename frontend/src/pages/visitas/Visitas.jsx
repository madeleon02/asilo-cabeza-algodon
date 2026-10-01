import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function Visitas() {
  const { usuario } = useAuth();
  const [visitas, setVisitas]             = useState([]);
  const [solicitudes, setSolicitudes]     = useState([]);
  const [visitaActiva, setVisitaActiva]   = useState(null);
  const [cargando, setCargando]           = useState(true);
  const [toast, setToast]                 = useState("");
  const [diagnostico, setDiagnostico]     = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [mostrarExamen, setMostrarExamen] = useState(false);
  const [mostrarPrescripcion, setMostrarPrescripcion] = useState(false);
  const [formExamen, setFormExamen] = useState({ nombre_examen: "", descripcion: "", costo_examen: "" });
  const [formPrescripcion, setFormPrescripcion] = useState({ nombre_medicamento: "", cantidad: "", dosis: "", tiempo_aplicacion: "", costo_medicamento: "" });

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setCargando(true);
      const [v, s] = await Promise.all([
        api.get("/visitas"),
        api.get("/solicitudes"),
      ]);
      setVisitas(v.data);
      setSolicitudes(s.data.filter(s => s.estado === "asignada"));
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  async function iniciarVisita(id_solicitud) {
    try {
      const res = await api.post("/visitas", { id_solicitud });
      mostrarToast("Visita iniciada correctamente");
      const visita = await api.get("/visitas/" + res.data.id_visita).catch(() => res);
      setVisitaActiva({ ...res.data, examenes: [], prescripciones: [] });
      cargar();
    } catch (err) { mostrarToast(err.response?.data?.error || "Error al iniciar visita", true); }
  }

  async function abrirVisitaActiva(visita) {
    setVisitaActiva(visita);
    setDiagnostico(visita.diagnostico || "");
    setObservaciones(visita.observaciones || "");
  }

  async function agregarExamen(e) {
    e.preventDefault();
    try {
      const res = await api.post("/visitas/" + visitaActiva.id_visita + "/examenes", formExamen);
      setVisitaActiva({ ...visitaActiva, examenes: [...(visitaActiva.examenes || []), res.data] });
      setFormExamen({ nombre_examen: "", descripcion: "", costo_examen: "" });
      setMostrarExamen(false);
      mostrarToast("Examen agregado");
    } catch (err) { mostrarToast(err.response?.data?.error || "Error al agregar examen", true); }
  }

  async function agregarPrescripcion(e) {
    e.preventDefault();
    try {
      const res = await api.post("/visitas/" + visitaActiva.id_visita + "/prescripciones", formPrescripcion);
      setVisitaActiva({ ...visitaActiva, prescripciones: [...(visitaActiva.prescripciones || []), res.data] });
      setFormPrescripcion({ nombre_medicamento: "", cantidad: "", dosis: "", tiempo_aplicacion: "", costo_medicamento: "" });
      setMostrarPrescripcion(false);
      mostrarToast("Prescripcion agregada");
    } catch (err) { mostrarToast(err.response?.data?.error || "Error al agregar prescripcion", true); }
  }

  async function finalizarVisita() {
    if (!diagnostico) { mostrarToast("El diagnostico es obligatorio", true); return; }
    if (!confirm("Finalizar la visita? Esta accion no se puede revertir.")) return;
    try {
      const res = await api.put("/visitas/" + visitaActiva.id_visita + "/finalizar", { diagnostico, observaciones });
      mostrarToast("Visita finalizada. Costo total: Q" + res.data.costo_total);
      setVisitaActiva(null);
      cargar();
    } catch (err) { mostrarToast(err.response?.data?.error || "Error al finalizar visita", true); }
  }

  function mostrarToast(msg, error) {
    setToast({ msg, error });
    setTimeout(() => setToast(""), 4000);
  }

  const costoTotal = visitaActiva
    ? 150 + (visitaActiva.examenes || []).reduce((s, e) => s + parseFloat(e.costo_examen || 0), 0)
          + (visitaActiva.prescripciones || []).reduce((s, p) => s + parseFloat(p.costo_medicamento || 0), 0)
    : 0;

  return (
    <div className="p-6">
      {toast && (
        <div className={"fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white font-medium " + (toast.error ? "bg-red-600" : "bg-green-600")}>
          {toast.msg}
        </div>
      )}

      {!visitaActiva ? (
        <>
          <h1 className="text-2xl font-bold text-blue-900 mb-6">Visitas Medicas</h1>

          {solicitudes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-green-800 mb-3">Solicitudes asignadas — pendientes de atender</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-green-800 text-white">
                      <th className="px-4 py-3 text-left">Interno</th>
                      <th className="px-4 py-3 text-left">Especialidad</th>
                      <th className="px-4 py-3 text-left">Fecha cita</th>
                      <th className="px-4 py-3 text-center">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((s, i) => (
                      <tr key={s.id_solicitud} className={i % 2 === 0 ? "bg-white" : "bg-green-50"}>
                        <td className="px-4 py-3 font-medium">{s.interno?.nombres} {s.interno?.apellidos}</td>
                        <td className="px-4 py-3">{s.especialidad_requerida}</td>
                        <td className="px-4 py-3">{s.fecha_cita ? new Date(s.fecha_cita).toLocaleDateString("es-GT") : "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => iniciarVisita(s.id_solicitud)}
                            className="bg-green-700 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-800">
                            Iniciar visita
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <h2 className="text-lg font-semibold text-blue-900 mb-3">Historial de visitas</h2>
          {cargando ? (
            <div className="text-center py-8 text-gray-400">Cargando...</div>
          ) : visitas.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No hay visitas registradas</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="px-4 py-3 text-left">Interno</th>
                    <th className="px-4 py-3 text-left">Especialidad</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {visitas.map((v, i) => (
                    <tr key={v.id_visita} className={i % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                      <td className="px-4 py-3 font-medium">{v.interno?.nombres} {v.interno?.apellidos}</td>
                      <td className="px-4 py-3">{v.solicitud?.especialidad_requerida}</td>
                      <td className="px-4 py-3">{new Date(v.fecha_visita).toLocaleDateString("es-GT")}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={"px-2 py-1 rounded-full text-xs font-bold " + (v.estado === "completada" ? "bg-gray-100 text-gray-700" : "bg-yellow-100 text-yellow-800")}>
                          {v.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {v.estado === "en_proceso" && (
                          <button onClick={() => abrirVisitaActiva(v)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                            Continuar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Visita Medica en Proceso</h1>
              <p className="text-gray-500 text-sm">
                Interno: {visitaActiva.interno?.nombres} {visitaActiva.interno?.apellidos}
              </p>
            </div>
            <button onClick={() => setVisitaActiva(null)} className="text-gray-500 hover:text-gray-700 text-sm">
              Volver a la lista
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Diagnostico y observaciones</h3>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnostico *</label>
                  <textarea rows={4} value={diagnostico} onChange={e => setDiagnostico(e.target.value)}
                    placeholder="Ingrese el diagnostico del paciente..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                  <textarea rows={3} value={observaciones} onChange={e => setObservaciones(e.target.value)}
                    placeholder="Observaciones adicionales..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"/>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Resumen de costos</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Consulta medica:</span><span>Q150.00</span></div>
                  <div className="flex justify-between"><span>Examenes ({(visitaActiva.examenes || []).length}):</span>
                    <span>Q{(visitaActiva.examenes || []).reduce((s, e) => s + parseFloat(e.costo_examen || 0), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between"><span>Medicamentos ({(visitaActiva.prescripciones || []).length}):</span>
                    <span>Q{(visitaActiva.prescripciones || []).reduce((s, p) => s + parseFloat(p.costo_medicamento || 0), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-800 border-t border-green-300 pt-1 mt-1">
                    <span>Total:</span><span>Q{costoTotal.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={finalizarVisita}
                  className="w-full mt-4 bg-green-700 text-white py-2 rounded font-medium hover:bg-green-800 text-sm">
                  Finalizar visita y generar cobro
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-900">Examenes de laboratorio</h3>
                  <button onClick={() => setMostrarExamen(true)}
                    className="text-xs bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900">
                    + Agregar
                  </button>
                </div>
                {(visitaActiva.examenes || []).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Sin examenes agregados</p>
                ) : (
                  <ul className="space-y-2">
                    {(visitaActiva.examenes || []).map((e, i) => (
                      <li key={i} className="flex justify-between text-sm bg-blue-50 px-3 py-2 rounded">
                        <span>{e.nombre_examen}</span>
                        <span className="text-blue-800 font-medium">Q{parseFloat(e.costo_examen).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-blue-900">Prescripciones</h3>
                  <button onClick={() => setMostrarPrescripcion(true)}
                    className="text-xs bg-blue-800 text-white px-3 py-1 rounded hover:bg-blue-900">
                    + Agregar
                  </button>
                </div>
                {(visitaActiva.prescripciones || []).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">Sin prescripciones</p>
                ) : (
                  <ul className="space-y-2">
                    {(visitaActiva.prescripciones || []).map((p, i) => (
                      <li key={i} className="text-sm bg-yellow-50 px-3 py-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{p.nombre_medicamento}</span>
                          <span className="text-yellow-800 font-medium">Q{parseFloat(p.costo_medicamento).toFixed(2)}</span>
                        </div>
                        <div className="text-gray-500 text-xs">{p.dosis} — {p.cantidad}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {mostrarExamen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="bg-blue-900 text-white px-6 py-4 rounded-t-xl">
                  <h2 className="text-lg font-bold">Agregar Examen de Laboratorio</h2>
                </div>
                <form onSubmit={agregarExamen} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del examen *</label>
                    <input required value={formExamen.nombre_examen}
                      onChange={e => setFormExamen({...formExamen, nombre_examen: e.target.value})}
                      placeholder="Ej. Hemograma completo, Glucosa en ayunas..."
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                    <input value={formExamen.descripcion}
                      onChange={e => setFormExamen({...formExamen, descripcion: e.target.value})}
                      placeholder="Indicaciones adicionales..."
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo (Q)</label>
                    <input type="number" step="0.01" value={formExamen.costo_examen}
                      onChange={e => setFormExamen({...formExamen, costo_examen: e.target.value})}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setMostrarExamen(false)}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-600 text-sm">Cancelar</button>
                    <button type="submit"
                      className="px-4 py-2 bg-blue-800 text-white rounded text-sm font-medium hover:bg-blue-900">Agregar</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {mostrarPrescripcion && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="bg-yellow-700 text-white px-6 py-4 rounded-t-xl">
                  <h2 className="text-lg font-bold">Agregar Prescripcion</h2>
                </div>
                <form onSubmit={agregarPrescripcion} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento *</label>
                    <input required value={formPrescripcion.nombre_medicamento}
                      onChange={e => setFormPrescripcion({...formPrescripcion, nombre_medicamento: e.target.value})}
                      placeholder="Ej. Memantina 10mg"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                      <input required value={formPrescripcion.cantidad}
                        onChange={e => setFormPrescripcion({...formPrescripcion, cantidad: e.target.value})}
                        placeholder="Ej. 30 tabletas"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosis *</label>
                      <input required value={formPrescripcion.dosis}
                        onChange={e => setFormPrescripcion({...formPrescripcion, dosis: e.target.value})}
                        placeholder="Ej. 1 tableta cada 12h"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de aplicacion</label>
                      <input value={formPrescripcion.tiempo_aplicacion}
                        onChange={e => setFormPrescripcion({...formPrescripcion, tiempo_aplicacion: e.target.value})}
                        placeholder="Ej. 30 dias"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo (Q)</label>
                      <input type="number" step="0.01" value={formPrescripcion.costo_medicamento}
                        onChange={e => setFormPrescripcion({...formPrescripcion, costo_medicamento: e.target.value})}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"/>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setMostrarPrescripcion(false)}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-600 text-sm">Cancelar</button>
                    <button type="submit"
                      className="px-4 py-2 bg-yellow-700 text-white rounded text-sm font-medium hover:bg-yellow-800">Agregar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
