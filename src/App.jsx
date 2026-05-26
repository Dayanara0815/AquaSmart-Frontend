import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { MobileNavBar } from "./components/layout/MobileNavBar";
import { Login } from "./pages/Login";

import { Dashboard } from "./pages/Dashboard";
import { Reportes } from "./pages/Reportes";
import { Notificaciones } from "./pages/Notificaciones";
import { Ajustes } from "./pages/Ajustes";
import { Cierres } from "./pages/Cierres";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole");
    const fullName = localStorage.getItem("userFullName");
    if (email && role) {
      setUser({ email, role, fullName });
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser({
      email: loggedInUser.email,
      role: loggedInUser.rol,
      fullName: loggedInUser.fullName,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userFullName");
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

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
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/notificaciones" element={<Notificaciones />} />
            <Route path="/ajustes" element={<Ajustes />} />
            <Route path="/cierres" element={<Cierres />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Barra de navegación inferior móvil */}
      <MobileNavBar />

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