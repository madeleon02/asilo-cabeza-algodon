import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// H-03: módulos por rol (nombres de rol según BD)
const MENU_POR_ROL = {
  administrador: [
    { path: '/dashboard',   icon: '🏠', label: 'Inicio' },
    { path: '/internos',    icon: '👴', label: 'Internos' },
    { path: '/solicitudes', icon: '📋', label: 'Solicitudes' },
    { path: '/visitas',     icon: '🩺', label: 'Visitas' },
    { path: '/laboratorio', icon: '🔬', label: 'Laboratorio' },
    { path: '/farmacia',    icon: '💊', label: 'Farmacia' },
    { path: '/finanzas',    icon: '💰', label: 'Finanzas' },
  ],
  director: [
    { path: '/dashboard',   icon: '🏠', label: 'Inicio' },
    { path: '/internos',    icon: '👴', label: 'Internos' },
    { path: '/solicitudes', icon: '📋', label: 'Solicitudes' },
    { path: '/visitas',     icon: '🩺', label: 'Visitas' },
    { path: '/laboratorio', icon: '🔬', label: 'Laboratorio' },
    { path: '/farmacia',    icon: '💊', label: 'Farmacia' },
    { path: '/finanzas',    icon: '💰', label: 'Finanzas' },
  ],
  medico_general: [
    { path: '/dashboard',   icon: '🏠', label: 'Inicio' },
    { path: '/internos',    icon: '👴', label: 'Internos' },
    { path: '/solicitudes', icon: '📋', label: 'Solicitudes' },
  ],
  medico_especialista: [
    { path: '/dashboard', icon: '🏠', label: 'Inicio' },
    { path: '/visitas',   icon: '🩺', label: 'Visitas' },
  ],
  enfermero: [
    { path: '/dashboard',   icon: '🏠', label: 'Inicio' },
    { path: '/solicitudes', icon: '📋', label: 'Solicitudes' },
  ],
  fundacion: [
    { path: '/dashboard',   icon: '🏠', label: 'Inicio' },
    { path: '/solicitudes', icon: '📋', label: 'Solicitudes' },
  ],
  laboratorista: [
    { path: '/dashboard',   icon: '🏠', label: 'Inicio' },
    { path: '/laboratorio', icon: '🔬', label: 'Laboratorio' },
  ],
  farmaceutico: [
    { path: '/dashboard', icon: '🏠', label: 'Inicio' },
    { path: '/farmacia',  icon: '💊', label: 'Farmacia' },
  ],
};

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rol = usuario?.rol || '';
  const menuItems = MENU_POR_ROL[rol] || [{ path: '/dashboard', icon: '🏠', label: 'Inicio' }];

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col fixed h-full">

        {/* Logo */}
        <div className="p-6 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <p className="font-bold text-sm leading-tight">Asilo Cabeza</p>
              <p className="font-bold text-sm leading-tight">de Algodón</p>
              <p className="text-blue-300 text-xs mt-1">Sistema de Gestión</p>
            </div>
          </div>
        </div>

        {/* Menú */}
        <nav className="flex-1 p-4">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Menú principal
          </p>
          <ul className="space-y-1">
            {menuItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
              {usuario?.nombre?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{usuario?.nombre}</p>
              <p className="text-blue-400 text-xs capitalize">{rol.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-blue-300 hover:text-white text-sm px-2 py-1 rounded hover:bg-blue-800 transition-colors"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
