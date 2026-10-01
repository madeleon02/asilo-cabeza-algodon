import { useState, useEffect } from "react";
import api from "../../services/api";

export default function Laboratorio() {
  const [pendientes, setPendientes]   = useState([]);
  const [realizados, setRealizados]   = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [examenActivo, setExamenActivo] = useState(null);
  const [toast, setToast]             = useState("");
  const [tab, setTab]                 = useState("pendientes");
  const [form, setForm] = useState({
    resultado_texto: "", valores_referencia: "", observaciones: ""
  });

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try {
      setCargando(true);
      const [p, r] = await Promise.all([
        api.get("/laboratorio/pendientes"),
        api.get("/laboratorio/realizados"),
      ]);
      setPendientes(p.data);
      setRealizados(r.data);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }

  async function guardarResultado(e) {
    e.preventDefault();
    try {
      await api.post("/laboratorio/" + examenActivo.id_examen + "/resultado", form);
      setExamenActivo(null);
      setForm({ resultado_texto: "", valores_referencia: "", observaciones: "" });
      mostrarToast("Resultado registrado correctamente");
      cargar();
    } catch (err) { mostrarToast(err.response?.data?.error || "Error al registrar resultado", true); }
  }

  function mostrarToast(msg, error) {
    setToast({ msg, error });
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="p-6">
      {toast && (
        <div className={"fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white font-medium " + (toast.error ? "bg-red-600" : "bg-green-600")}>
          {toast.msg}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Laboratorio</h1>
          <p className="text-gray-500 text-sm">{pendientes.length} examen(es) pendiente(s)</p>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("pendientes")}
          className={"px-4 py-2 rounded-full text-sm font-medium border transition " + (tab === "pendientes" ? "bg-blue-800 text-white border-blue-800" : "bg-white text-gray-600 border-gray-300")}>
          Pendientes ({pendientes.length})
        </button>
        <button onClick={() => setTab("realizados")}
          className={"px-4 py-2 rounded-full text-sm font-medium border transition " + (tab === "realizados" ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-600 border-gray-300")}>
          Realizados ({realizados.length})
        </button>
      </div>
      {cargando ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : tab === "pendientes" ? (
        pendientes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No hay examenes pendientes</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="px-4 py-3 text-left">Examen</th>
                  <th className="px-4 py-3 text-left">Interno</th>
                  <th className="px-4 py-3 text-left">Medico</th>
                  <th className="px-4 py-3 text-left">Descripcion</th>
                  <th className="px-4 py-3 text-center">Accion</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((e, i) => (
                  <tr key={e.id_examen} className={i % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                    <td className="px-4 py-3 font-medium text-blue-900">{e.nombre_examen}</td>
                    <td className="px-4 py-3">{e.visita?.interno?.nombres} {e.visita?.interno?.apellidos}</td>
                    <td className="px-4 py-3">{e.visita?.medico?.nombre_completo || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{e.descripcion || "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setExamenActivo(e)}
                        className="bg-blue-800 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-900">
                        Registrar resultado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        realizados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No hay examenes realizados</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-800 text-white">
                  <th className="px-4 py-3 text-left">Examen</th>
                  <th className="px-4 py-3 text-left">Interno</th>
                  <th className="px-4 py-3 text-left">Resultado</th>
                  <th className="px-4 py-3 text-left">Valores referencia</th>
                </tr>
              </thead>
              <tbody>
                {realizados.map((e, i) => (
                  <tr key={e.id_examen} className={i % 2 === 0 ? "bg-white" : "bg-green-50"}>
                    <td className="px-4 py-3 font-medium">{e.nombre_examen}</td>
                    <td className="px-4 py-3">{e.visita?.interno?.nombres} {e.visita?.interno?.apellidos}</td>
                    <td className="px-4 py-3">{e.resultado?.resultado_texto || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{e.resultado?.valores_referencia || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {examenActivo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-blue-900 text-white px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-bold">Registrar Resultado</h2>
              <p className="text-blue-200 text-sm">{examenActivo.nombre_examen} — {examenActivo.visita?.interno?.nombres} {examenActivo.visita?.interno?.apellidos}</p>
            </div>
            <form onSubmit={guardarResultado} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resultado *</label>
                <textarea required rows={4} value={form.resultado_texto}
                  onChange={e => setForm({...form, resultado_texto: e.target.value})}
                  placeholder="Describa los resultados del examen..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valores de referencia</label>
                <input value={form.valores_referencia}
                  onChange={e => setForm({...form, valores_referencia: e.target.value})}
                  placeholder="Ej. Hemoglobina: 12-17 g/dL"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea rows={2} value={form.observaciones}
                  onChange={e => setForm({...form, observaciones: e.target.value})}
                  placeholder="Observaciones adicionales..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"/>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setExamenActivo(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-600 text-sm">Cancelar</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded text-sm font-medium hover:bg-blue-900">Registrar resultado</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
