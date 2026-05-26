import { Home, BarChart2, Bell, Settings, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function MobileNavBar() {
  const location = useLocation();

  const NAV_ITEMS = [
    {
      path: "/",
      label: "Inicio",
      icon: Home,
    },
    {
      path: "/reportes",
      label: "Reportes",
      icon: BarChart2,
    },
    {
      path: "/notificaciones",
      label: "Alertas",
      icon: Bell,
    },
    {
      path: "/ajustes",
      label: "Ajustes",
      icon: Settings,
    },
    {
      path: "/cierres",
      label: "Cierres",
      icon: ShieldCheck,
    },
  ];

  return (
    <nav
      className="mobile-nav-bar w-100 border-top bg-white d-flex d-md-none justify-content-around py-2 position-fixed bottom-0 start-0 z-3"
      style={{
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(8px)",
        background: "rgba(255, 255, 255, 0.95)",
      }}
    >
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;

        return (
          <Link
            key={path}
            to={path}
            className="d-flex flex-column align-items-center justify-content-center text-decoration-none"
            style={{
              color: active ? "#2563eb" : "#64748b",
              width: 60,
              transition: "transform 0.15s",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.9)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center rounded-pill px-3 py-1 mb-1"
              style={{
                backgroundColor: active ? "rgba(37, 99, 235, 0.08)" : "transparent",
                transition: "background-color 0.2s",
              }}
            >
              <Icon size={20} style={{ strokeWidth: active ? 2.5 : 2 }} />
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: active ? 600 : 500,
                letterSpacing: 0.2,
              }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
