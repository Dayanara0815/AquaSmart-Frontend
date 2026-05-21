import {
  Home,
  BarChart2,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";

import {
  Link,
  useLocation,
} from "react-router-dom";

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
    label: "Notificaciones",
    icon: Bell,
  },
  {
    path: "/ajustes",
    label: "Ajustes",
    icon: Settings,
  },
];

export function Sidebar({ onLogout }) {
  const location = useLocation();

  return (
    <aside
      className="d-flex flex-column bg-white border-end"
      style={{
        width: 240,
        minHeight: "100%",
        padding: "16px 0",
      }}
    >
      <nav className="d-flex flex-column flex-fill px-3 mt-3">
        {NAV_ITEMS.map(
          ({ path, label, icon: Icon }, index) => {
            const active =
              location.pathname === path;

            return (
              <div key={path}>
                <Link
                  to={path}
                  className={`d-flex align-items-center gap-2 w-100 text-decoration-none border-0 rounded-3 px-3 py-2 ${
                    active
                      ? "bg-primary bg-opacity-10 text-primary fw-semibold"
                      : "text-secondary"
                  }`}
                  style={{
                    fontSize: 15,
                    transition:
                      "background 0.15s",
                  }}
                >
                  <Icon size={20} />
                  {label}
                </Link>

                {index <
                  NAV_ITEMS.length - 1 && (
                  <hr
                    className="my-1 mx-3"
                    style={{
                      borderColor: "#f3f4f6",
                      opacity: 1,
                    }}
                  />
                )}
              </div>
            );
          }
        )}
      </nav>

      <div className="px-3 pt-2">
        <button
          onClick={onLogout}
          className="d-flex align-items-center gap-2 w-100 border-0 bg-transparent rounded-3 px-3 py-2 text-secondary text-start"
          style={{ fontSize: 15 }}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}