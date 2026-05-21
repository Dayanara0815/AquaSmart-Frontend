import { useState } from "react";

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";

import { Dashboard } from "./pages/Dashboard";

// Temporales
function Reportes() {
  return (
    <div className="p-4 text-muted">
      Reportes — próximamente
    </div>
  );
}

function Notificaciones() {
  return (
    <div className="p-4 text-muted">
      Notificaciones — próximamente
    </div>
  );
}

function Ajustes() {
  return (
    <div className="p-4 text-muted">
      Ajustes — próximamente
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const handleLogout = () => {
    // localStorage.removeItem("token");
    // window.location.href = "/login";

    console.log("Cerrar sesión");
  };

  return (
    <div className="d-flex flex-column vh-100 bg-light">
      <TopBar
        onMenuToggle={() =>
          setSidebarOpen((p) => !p)
        }
      />

      <div className="d-flex flex-fill overflow-hidden">
        {sidebarOpen && (
          <Sidebar
            onLogout={handleLogout}
          />
        )}

        <main className="flex-fill overflow-auto">
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/reportes"
              element={<Reportes />}
            />

            <Route
              path="/notificaciones"
              element={<Notificaciones />}
            />

            <Route
              path="/ajustes"
              element={<Ajustes />}
            />

            {/* Ruta no encontrada */}
            <Route
              path="*"
              element={
                <div className="p-4 text-muted">
                  Página no encontrada
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      <footer
        className="text-center text-muted border-top bg-white py-3"
        style={{ fontSize: 12 }}
      >
        © 2026 – AquaSmart
      </footer>
    </div>
  );
}