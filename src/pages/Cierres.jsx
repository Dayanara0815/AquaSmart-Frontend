import { useEffect, useState } from "react";
import { api } from "../api/Aquasmart";
import { ShieldCheck, Power, History, Clock, Info, ShieldAlert, Activity } from "lucide-react";

export function Cierres() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.getValveHistory();
        if (!active) return;
        setHistory(Array.isArray(response) ? response : []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err.message || "No se pudo cargar el historial de cierres");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-fill align-items-center justify-content-center text-muted min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-2" role="status" />
          <p className="mb-0">Cargando historial de cierres...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-fill align-items-center justify-content-center text-danger min-vh-100">
        <div className="text-center">
          <ShieldAlert size={40} className="mb-2" />
          <p className="mb-0">Error al cargar cierres: {error}</p>
        </div>
      </div>
    );
  }

  const manualCount = history.filter((item) => /Manual/i.test(item.type || "")).length;
  const automaticCount = history.filter((item) => /Automático|Auto/i.test(item.type || "")).length;

  return (
    <div className="p-3 p-md-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: "var(--text)" }}>Control de Corte y Válvula</h3>
          <p className="text-muted mb-0 small" style={{ fontSize: 13 }}>
            Historial detallado de suspensión de caudal en el medidor principal.
          </p>
        </div>
        <span className="badge rounded-pill bg-light text-dark border px-3 py-2 fw-semibold d-flex align-items-center gap-1">
          <ShieldCheck size={13} className="text-success" /> Enlace de Seguridad Solenoide
        </span>
      </div>

      {/* DIDACTIC EXPLANATION */}
      <div 
        className="card border rounded-4 p-4 mb-4"
        style={{
          background: "var(--surface)",
          borderColor: "var(--header-border)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
        }}
      >
        <div className="d-flex align-items-start gap-3">
          <div 
            className="rounded-3 p-2.5 d-flex align-items-center justify-content-center bg-primary-subtle text-primary"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
          >
            <Info size={22} />
          </div>
          <div>
            <h6 className="fw-bold mb-1.5" style={{ color: "var(--text)", fontSize: 14.5 }}>
              ¿Por qué y cuándo se cierra la válvula?
            </h6>
            <p className="mb-0 text-muted" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
              La electroválvula de AquaSmart actúa como tu escudo de seguridad. Los <strong>cierres automáticos</strong> se disparan mediante algoritmos de IA cuando se detecta un paso continuo inusual de agua (fugas de inodoro o caños abiertos) o para evitar cobros inflados por burbujas de aire tras los cortes distritales. Los <strong>cierres manuales</strong> son activados por ti desde la pantalla de inicio para suspender el caudal cuando estás fuera de casa por viaje o por mantenimiento preventivo.
            </p>
          </div>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}
          >
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="rounded-3 p-2 bg-primary-subtle text-primary" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
                <Power size={20} />
              </div>
              <span className="text-muted small fw-semibold">CIERRES MANUALES</span>
            </div>
            <h3 className="fw-bold mb-0" style={{ fontSize: 32, color: "var(--text)" }}>{manualCount}</h3>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}
          >
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="rounded-3 p-2 bg-warning-subtle text-warning" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                <ShieldAlert size={20} />
              </div>
              <span className="text-muted small fw-semibold">CIERRES AUTOMÁTICOS</span>
            </div>
            <h3 className="fw-bold mb-0 text-warning" style={{ fontSize: 32 }}>{automaticCount}</h3>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}
          >
            <div className="d-flex align-items-center gap-3 mb-2">
              <div className="rounded-3 p-2 bg-success-subtle text-success" style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}>
                <History size={20} />
              </div>
              <span className="text-muted small fw-semibold">TOTAL DE EVENTOS</span>
            </div>
            <h3 className="fw-bold mb-0 text-success" style={{ fontSize: 32 }}>{history.length}</h3>
          </div>
        </div>
      </div>

      {/* TIMELINE LIST */}
      <div 
        className="card border rounded-4 p-4 shadow-sm"
        style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}
      >
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom" style={{ borderColor: "var(--header-border)" }}>
          <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2" style={{ color: "var(--text)" }}>
            <Activity size={18} className="text-primary" />
            Línea de Tiempo de Operación
          </h5>
          <span className="text-muted small">Mantenimiento y Auditorías</span>
        </div>

        {history.length > 0 ? (
          <div className="ps-3 border-start" style={{ borderColor: "var(--header-border)", marginLeft: "12px" }}>
            <div className="d-flex flex-column gap-4">
              {history.map((item, index) => {
                const isAuto = /Automático|Auto/i.test(item.type || "");
                return (
                  <div key={`${item.timestamp}-${index}`} className="position-relative">
                    {/* Timeline Dot */}
                    <div 
                      className="position-absolute rounded-circle border shadow-sm"
                      style={{
                        width: 14,
                        height: 14,
                        backgroundColor: isAuto ? "#f59e0b" : "#3b82f6",
                        borderColor: "var(--surface)",
                        left: -22,
                        top: 5,
                      }}
                    />
                    
                    {/* Event Card */}
                    <div 
                      className="card border rounded-4 p-3.5 shadow-sm transition-all"
                      style={{ 
                        background: "var(--surface-soft)", 
                        borderColor: "var(--header-border)",
                      }}
                    >
                      <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="fw-bold mb-0" style={{ fontSize: 13.5, color: "var(--text)" }}>
                              {item.type}
                            </h6>
                            <span 
                              className={`badge rounded-pill px-2.5 py-1 fw-bold`} 
                              style={{ 
                                fontSize: 9.5, 
                                backgroundColor: "var(--surface)", 
                                border: "1px solid var(--header-border)",
                                color: isAuto ? "#d97706" : "#2563eb"
                              }}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-muted mb-0 mt-2" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                            {item.reason}
                          </p>
                        </div>
                        
                        <div className="text-end d-flex flex-column align-items-end gap-1.5">
                          <span className="text-muted small d-flex align-items-center gap-1.5" style={{ fontSize: 11 }}>
                            <Clock size={12} />
                            {item.timestamp}
                          </span>
                          <span 
                            className="badge rounded-3 px-2 py-1 fw-bold"
                            style={{ 
                              fontSize: 10,
                              backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)", 
                              color: "var(--primary)" 
                            }}
                          >
                            Duración: {item.durationMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-5 text-muted border border-dashed rounded-4">
            <ShieldCheck size={40} className="mb-2 text-success opacity-50" />
          </div>
        )}
      </div>
    </div>
  );
}