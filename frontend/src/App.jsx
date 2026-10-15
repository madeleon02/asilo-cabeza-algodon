import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Layout from './components/layout/Layout';
import Internos from './pages/internos/Internos';
import Solicitudes from './pages/solicitudes/Solicitudes';
import Visitas from './pages/visitas/Visitas';
import Laboratorio from './pages/laboratorio/Laboratorio';
import Farmacia from './pages/farmacia/Farmacia';
import Finanzas from './pages/finanzas/Finanzas';
import Reportes from './pages/reportes/Reportes';

function Dashboard() {
    const { usuario } = useAuth();
    return (
        <Layout>
            <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h1 className="text-2xl font-bold text-blue-900 mb-2">
                    Bienvenido, {usuario?.nombre} 👋
                </h1>
                <p className="text-gray-500 text-sm capitalize">
                    Rol: {usuario?.rol?.replace(/_/g, ' ')}
                </p>
                <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center cursor-pointer hover:shadow-md transition">
                        <p className="text-3xl mb-2">👴</p>
                        <p className="font-semibold text-blue-900">Internos</p>
                        <p className="text-gray-500 text-sm mt-1">Gestión de pacientes</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center cursor-pointer hover:shadow-md transition">
                        <p className="text-3xl mb-2">🩺</p>
                        <p className="font-semibold text-green-900">Solicitudes</p>
                        <p className="text-gray-500 text-sm mt-1">Referencias médicas</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center cursor-pointer hover:shadow-md transition">
                        <p className="text-3xl mb-2">💊</p>
                        <p className="font-semibold text-yellow-900">Farmacia</p>
                        <p className="text-gray-500 text-sm mt-1">Despacho de medicamentos</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center cursor-pointer hover:shadow-md transition">
                        <p className="text-3xl mb-2">💰</p>
                        <p className="font-semibold text-purple-900">Finanzas</p>
                        <p className="text-gray-500 text-sm mt-1">Cobros, gastos y donaciones</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// H-03: roles permitidos por ruta
const ROLES_POR_RUTA = {
    '/internos':    ['administrador', 'director', 'medico_general'],
    '/solicitudes': ['administrador', 'director', 'medico_general', 'enfermero', 'fundacion'],
    '/visitas':     ['administrador', 'director', 'medico_especialista'],
    '/laboratorio': ['administrador', 'director', 'laboratorista'],
    '/farmacia':    ['administrador', 'director', 'farmaceutico'],
    '/finanzas':    ['administrador', 'director'],
    '/reportes':    ['administrador', 'director'],
};

function RutaProtegida({ children, ruta }) {
    const { usuario, cargando } = useAuth();
    if (cargando) return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Cargando...</p>
        </div>
    );
    if (!usuario) return <Navigate to="/login" />;
    // H-03: verificar que el rol tenga acceso a esta ruta
    const rolesPermitidos = ROLES_POR_RUTA[ruta];
    if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
        return <Navigate to="/dashboard" />;
    }
    return children;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
                    <Route path="/internos"    element={<RutaProtegida ruta="/internos"><Layout><Internos /></Layout></RutaProtegida>} />
                    <Route path="/solicitudes" element={<RutaProtegida ruta="/solicitudes"><Layout><Solicitudes /></Layout></RutaProtegida>} />
                    <Route path="/visitas"     element={<RutaProtegida ruta="/visitas"><Layout><Visitas /></Layout></RutaProtegida>} />
                    <Route path="/laboratorio" element={<RutaProtegida ruta="/laboratorio"><Layout><Laboratorio /></Layout></RutaProtegida>} />
                    <Route path="/farmacia"    element={<RutaProtegida ruta="/farmacia"><Layout><Farmacia /></Layout></RutaProtegida>} />
                    <Route path="/finanzas"    element={<RutaProtegida ruta="/finanzas"><Layout><Finanzas /></Layout></RutaProtegida>} />
                    <Route path="/reportes"    element={<RutaProtegida ruta="/reportes"><Layout><Reportes /></Layout></RutaProtegida>} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
