import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { MobileNavBar } from "./components/layout/MobileNavBar";
import { Login } from "./pages/Login";

import { Dashboard } from "./pages/Dashboard";
import { Reportes } from "./pages/Reportes";
import { Notificaciones } from "./pages/Notificaciones";
import { Ajustes } from "./pages/Ajustes";
import { Cierres } from "./pages/Cierres";
import { AIChatDrawer } from "./components/ui/AIChatDrawer";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole");
    const fullName = localStorage.getItem("userFullName");
    const fotoPerfil = localStorage.getItem("userFotoPerfil");
    if (email && role) {
      setUser({ email, role, fullName, fotoPerfil });
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser({
      email: loggedInUser.email,
      role: loggedInUser.rol,
      fullName: loggedInUser.fullName,
      fotoPerfil: loggedInUser.fotoPerfil || "",
    });
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userFullName");
    localStorage.removeItem("userFotoPerfil");
    setUser(null);
    navigate("/");
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Comprobar si el rol del usuario conectado tiene acceso a páginas domésticas
  const isDomestic = user.role === "DOMESTICO" || user.role === "COMERCIO";

  return (
    <div className="d-flex flex-column vh-100 app-shell">
      <TopBar
        user={user}
        onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen((p) => !p)}
      />

      <div className="d-flex flex-fill overflow-hidden position-relative">
        {/* Sidebar visible solo en pantallas medianas y grandes */}
        {sidebarOpen && (
          <div className="d-none d-md-flex h-100">
            <Sidebar onLogout={handleLogout} />
          </div>
        )}

        {/* Contenido principal adaptable */}
        <main className="flex-fill overflow-auto pb-5 pb-md-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route 
              path="/reportes" 
              element={isDomestic ? <Reportes /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/notificaciones" 
              element={<Notificaciones />} 
            />
            <Route path="/ajustes" element={<Ajustes />} />
            <Route 
              path="/cierres" 
              element={isDomestic ? <Cierres /> : <Navigate to="/" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Barra de navegación inferior móvil */}
      <MobileNavBar />

      {/* Asistente Hídrico Virtual Flotante con Historial */}
      <AIChatDrawer />

      {/* Footer oculto en móvil para optimizar espacio */}
      <footer
        className="text-center border-top py-3 app-footer d-none d-md-block"
        style={{ fontSize: 12 }}
      >
        © 2026 – AquaSmart
      </footer>
    </div>
  );
}