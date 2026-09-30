import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Layout from './components/layout/Layout';
import Internos from './pages/internos/Internos';
import Solicitudes from './pages/solicitudes/Solicitudes';

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
                        <p className="text-3xl mb-2">📊</p>
                        <p className="font-semibold text-yellow-900">Reportes</p>
                        <p className="text-gray-500 text-sm mt-1">Estadísticas del asilo</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

function RutaProtegida({ children }) {
    const { usuario, cargando } = useAuth();
    if (cargando) return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Cargando...</p>
        </div>
    );
    return usuario ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
                    <Route path="/internos" element={<RutaProtegida><Layout><Internos /></Layout></RutaProtegida>} />
                    <Route path="/solicitudes" element={<RutaProtegida><Layout><Solicitudes /></Layout></RutaProtegida>} />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;