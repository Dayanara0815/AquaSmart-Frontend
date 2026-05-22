import { useState } from "react";

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";

import { Dashboard } from "./pages/Dashboard";
import { Reportes } from "./pages/Reportes";
import { Notificaciones } from "./pages/Notificaciones";
import { Ajustes } from "./pages/Ajustes";
import { Cierres } from "./pages/Cierres";

export default function App() {
  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const handleLogout = () => {
    // localStorage.removeItem("token");
    // window.location.href = "/login";

    console.log("Cerrar sesión");
  };

  return (
    <div className="d-flex flex-column vh-100 app-shell">
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

            <Route
              path="/cierres"
              element={<Cierres />}
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
        className="text-center border-top py-3 app-footer"
        style={{ fontSize: 12 }}
      >
        © 2026 – AquaSmart
      </footer>
    </div>
  );
}