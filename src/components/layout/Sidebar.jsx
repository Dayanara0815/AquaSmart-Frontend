import {
  Home,
  BarChart2,
  Bell,
  Settings,
  ShieldCheck,
  User,
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
    path: "/perfil",
    label: "Perfil",
    icon: User,
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
  {
    path: "/cierres",
    label: "Cierres",
    icon: ShieldCheck,
  },
];

export function Sidebar({ onLogout }) {
  const location = useLocation();
  const userRole = localStorage.getItem("userRole") || "DOMESTICO";

  const allowedItems = NAV_ITEMS.filter(({ path }) => {
    if (userRole === "TECNICO" || userRole === "MUNICIPAL") {
      return path === "/" || path === "/perfil" || path === "/ajustes" || path === "/notificaciones";
    }
    return true;
  });

  return (
    <aside
      className="d-flex flex-column border-end app-sidebar"
      style={{
        width: 240,
        minHeight: "100%",
        padding: "16px 0",
      }}
    >
      <nav className="d-flex flex-column flex-fill px-3 mt-3">
        {allowedItems.map(
          ({ path, label, icon: Icon }, index) => {
            const active =
              location.pathname === path;

            return (
              <div key={path}>
                <Link
                  to={path}
                  className={`d-flex align-items-center gap-2 w-100 text-decoration-none border-0 rounded-3 px-3 py-2 sidebar-link ${
                    active
                      ? "sidebar-link-active fw-semibold"
                      : ""
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
                  allowedItems.length - 1 && (
                  <hr
                    className="my-1 mx-3"
                    style={{ opacity: 1 }}
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
          className="d-flex align-items-center gap-2 w-100 border-0 bg-transparent rounded-3 px-3 py-2 text-start sidebar-link"
          style={{ fontSize: 15 }}
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}