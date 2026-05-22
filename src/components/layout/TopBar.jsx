import { Menu, Bell, User } from "lucide-react";
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/Aquasmart";
import { ThemeContext } from "../../contexts/ThemeContext";
import { Toggle } from "../ui/Toggle";

export function TopBar({ onMenuToggle }) {
  const [user, setUser] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();

  const fullName = (user?.fullName || "").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);

  // UI recommendation: show only first name + first surname (2 words)
  const displayName =
    nameParts.length >= 2
      ? `${nameParts[0]} ${nameParts[1]}`
      : nameParts[0] || "Usuario X";

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const u = await api.getCurrentUser();
        if (mounted) setUser(u);
      } catch (e) {
        // ignore - keep fallback
      }

      try {
        const alerts = await api.getAlerts();
        if (mounted && Array.isArray(alerts)) {
          setAlertCount(alerts.filter((a) => a.active).length);
        }
      } catch (e) {
        // ignore
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const initials = user
    ? displayName
        .split(" ")
        .map((p) => p?.[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : null;

  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <header
      className="d-flex align-items-center justify-content-between"
      style={{
        minHeight: 72,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      <div className="d-flex align-items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="btn btn-sm d-lg-none border-0 bg-transparent"
        >
          <Menu size={20} />
        </button>

        <div className="d-flex align-items-center">
          <div className="logo-badge me-2" aria-hidden>
            <svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="aquaMark" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="52%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="dropMark" x1="24" y1="26" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>

              <path
                d="M10 53L30 11C30.8 9.4 33.2 9.4 34 11L54 53"
                stroke="url(#aquaMark)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 39H44"
                stroke="url(#aquaMark)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M32 23C30.2 26.4 24.6 31.6 24.6 37.1C24.6 41.6 28.1 45 32.5 45C36.9 45 40.4 41.6 40.4 37.1C40.4 31.6 34.8 26.4 33 23C32.7 22.5 32.3 22.5 32 23Z"
                fill="url(#dropMark)"
              />
              <path
                d="M19 47C24.5 44.8 39.5 44.8 45 47"
                stroke="url(#aquaMark)"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.95"
              />
            </svg>
          </div>
          <span className="logo-title">AquaSmart</span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        <Toggle mode="theme" checked={theme === "dark"} onChange={() => toggleTheme()} />

        <div className="d-flex align-items-center gap-2" style={{ fontSize: 14 }}>
          <div
            className="d-flex align-items-center justify-content-center rounded-circle text-white avatar-circle"
            style={{ width: 32, height: 32 }}
          >
            {initials ? (
              <span style={{ fontSize: 12, fontWeight: 600 }}>{initials}</span>
            ) : (
              <User size={16} color="#fff" />
            )}
          </div>
          <span className="fw-medium user-name">{displayName}</span>
        </div>

        <div className="position-relative">
          <button
            onClick={() => navigate("/notificaciones")}
            className="d-flex align-items-center justify-content-center border-0 rounded-circle bg-transparent p-0"
            style={{ width: 36, height: 36 }}
            aria-label="Notificaciones"
          >
            <Bell size={20} color="var(--muted)" />
          </button>
          {alertCount > 0 && (
            <span
              className="position-absolute rounded-circle d-flex align-items-center justify-content-center text-white notif-badge"
              style={{ minWidth: 18, height: 18, top: -6, right: -6, padding: '0 5px', fontSize: 11 }}
            >
              {alertCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}