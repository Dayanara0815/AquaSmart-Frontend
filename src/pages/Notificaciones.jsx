import { useEffect, useState } from "react";
import { 
  Bell, AlertTriangle, Droplets, ShieldAlert, CheckCircle, 
  Calendar, Clock, ListFilter, HelpCircle, Activity,
  Wrench, Play, CheckSquare, ShieldCheck, ChevronRight
} from "lucide-react";
import { api } from "../api/Aquasmart";

const FALLBACK_ALERTS = [
  {
    id: 1,
    active: true,
    message: "AVISO DE CORTE DE AGUA",
    schedule: "Mañana de 8:00 a.m. - 2:00 p.m.",
    type: "Corte preventivo",
    state: "Activa",
    description: "Posible corte programado en la zona.",
    timestamp: "26/05/2026 17:00",
  },
  {
    id: 2,
    active: true,
    message: "Posible fuga silenciosa detectada",
    schedule: "03:15 a.m.",
    type: "Fuga",
    state: "Activa",
    description: "Consumo constante en horario no convencional detectado por telemetría.",
    timestamp: "26/05/2026 03:15",
  },
  {
    id: 3,
    active: false,
    message: "Evento de paso de aire",
    schedule: "06:05 a.m.",
    type: "Paso de aire",
    state: "Cerrada",
    description: "Evento transitorio sin fuga persistente, filtrado correctamente.",
    timestamp: "25/05/2026 06:05",
  },
];

// Función para filtrar alertas duplicadas consecutivas o repetidas del mismo día
const deduplicateAlerts = (rawAlerts) => {
  if (!Array.isArray(rawAlerts)) return [];
  const seen = new Set();
  return rawAlerts.filter((alert) => {
    // Generar una clave combinando el mensaje/descripción y el día
    const day = alert.timestamp ? alert.timestamp.split(" ")[0] : "";
    const msgKey = `${alert.message || alert.description}_${day}`;
    if (seen.has(msgKey)) {
      return false;
    }
    seen.add(msgKey);
    return true;
  });
};

// Helper para parsear fechas de alertas en formato "dd/MM/yyyy HH:mm"
const parseAlertDate = (timestampStr) => {
  if (!timestampStr) return new Date(0);
  const parts = timestampStr.split(" ");
  if (parts.length > 0) {
    const dateParts = parts[0].split("/");
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed en JavaScript
      const year = parseInt(dateParts[2], 10);
      let hour = 0;
      let minute = 0;
      if (parts.length > 1) {
        const timeParts = parts[1].split(":");
        if (timeParts.length >= 2) {
          hour = parseInt(timeParts[0], 10);
          minute = parseInt(timeParts[1], 10);
        }
      }
      return new Date(year, month, day, hour, minute);
    }
  }
  return new Date(0);
};

// Obtener prioridad de la alerta (1: Crítica, 2: Media, 3: Planificación, 4: Completado)
const getAlertPriority = (alert) => {
  const state = (alert.state || "").toLowerCase();
  const type = (alert.type || "").toLowerCase();
  const msg = (alert.message || "").toLowerCase();

  if (state === "resuelta" || state === "cerrada" || state === "cumplido") {
    return 4; // Completado
  }
  if (type.includes("fuga") || msg.includes("fuga")) {
    return 1; // Fuga Activa
  }
  if (state === "en revisión" || state === "en proceso" || state === "en reparación") {
    return 2; // Auditoría o reparación en curso
  }
  return 3; // Corte preventivo o Paso de aire
};

// Generar badge HTML para la prioridad de la alerta
const getPriorityBadge = (priority) => {
  if (priority === 1) {
    return (
      <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: 9 }}>
        Alta Prioridad
      </span>
    );
  }
  if (priority === 2) {
    return (
      <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#d97706", fontSize: 9 }}>
        Prioridad Media
      </span>
    );
  }
  if (priority === 3) {
    return (
      <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#2563eb", fontSize: 9 }}>
        Planificación
      </span>
    );
  }
  return (
    <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#16a34a", fontSize: 9 }}>
      Completado
    </span>
  );
};

// Función para obtener iconos según tipo de alerta
const getAlertIcon = (type) => {
  const t = (type || "").toLowerCase();
  if (t.includes("fuga")) return <AlertTriangle className="text-danger" size={20} />;
  if (t.includes("corte")) return <ShieldAlert className="text-warning" size={20} />;
  if (t.includes("aire")) return <Activity className="text-info" size={20} />;
  return <Bell className="text-primary" size={20} />;
};

// Función para obtener clase del badge de estado
const getBadgeClass = (state) => {
  const s = (state || "").toLowerCase();
  if (s === "activa" || s === "pendiente") return "bg-danger text-white animate-pulse";
  if (s === "en proceso" || s === "en reparación") return "bg-warning text-dark";
  if (s === "en revisión") return "bg-info text-dark";
  if (s === "fallado" || s === "rechazado") return "bg-secondary text-white";
  return "bg-success text-white";
};

export function Notificaciones() {
  const [alerts, setAlerts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("TODAS"); // TODAS | ACTIVAS | HISTORICO
  const [sortBy, setSortBy] = useState("PRIORIDAD"); // PRIORIDAD | RECIENTES
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const userRole = localStorage.getItem("userRole") || "DOMESTICO";
  const userEmail = localStorage.getItem("userEmail");

  const handleSelectAlert = async (index, alert) => {
    setSelectedIndex(index);
    setActionMessage("");
    
    // Solo marcar como inactiva/leída automáticamente para usuarios residenciales
    if (userRole === "DOMESTICO" || userRole === "COMERCIO") {
      if (alert && (alert.state === "Activa" || alert.state === "Pendiente" || alert.state === "Activo") && alert.active) {
        try {
          await api.updateAlertStatus(alert.id, "Inactiva");
          const response = await api.getAlerts();
          const rawList = Array.isArray(response) && response.length > 0 ? response : FALLBACK_ALERTS;
          setAlerts(deduplicateAlerts(rawList));
        } catch (err) {
          console.error("Error al desactivar la alerta en BD", err);
        }
      }
    }
  };

  const handleExecuteAction = async (alertId, actionType) => {
    try {
      setActionLoading(true);
      setActionMessage("");
      if (actionType === "CLOSE_VALVE") {
        await api.setValve(false, userEmail);
        setActionMessage("Electroválvula de emergencia cerrada con éxito.");
      } else if (actionType === "MUNICIPAL_PROCESS") {
        await api.updateAlertStatus(alertId, "En Proceso");
        setActionMessage("Orden de trabajo iniciada. Se asignó la cuadrilla municipal.");
      } else if (actionType === "MUNICIPAL_RESOLVE") {
        await api.updateAlertStatus(alertId, "Resuelta");
        setActionMessage("Reparación y bacheo de vía concluidos exitosamente.");
      } else if (actionType === "TECH_PROCESS") {
        await api.updateAlertStatus(alertId, "En Proceso");
        setActionMessage("Asignado exitosamente. Iniciando reparación en campo.");
      } else if (actionType === "TECH_REVIEW") {
        await api.updateAlertStatus(alertId, "En Revisión");
        setActionMessage("Reparación de campo completada. Enviado a auditoría LegalTech.");
      } else if (actionType === "TECH_RESOLVE") {
        await api.updateAlertStatus(alertId, "Resuelta");
        setActionMessage("Auditoría LegalTech aprobada. Refacturación aplicada y caso cerrado.");
      }
      
      // Recargar alertas
      const response = await api.getAlerts();
      const rawList = Array.isArray(response) && response.length > 0 ? response : FALLBACK_ALERTS;
      setAlerts(deduplicateAlerts(rawList));
    } catch (err) {
      console.error(err);
      setActionMessage("Error al procesar la acción: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.getAlerts();
        if (!active) return;
        
        const rawList = Array.isArray(response) && response.length > 0 ? response : FALLBACK_ALERTS;
        const dedupedList = deduplicateAlerts(rawList);
        setAlerts(dedupedList);
      } catch (err) {
        if (!active) return;
        setAlerts(deduplicateAlerts(FALLBACK_ALERTS));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  // Filtrado de alertas basado en rol de usuario
  const roleFilteredAlerts = alerts.filter((alert) => {
    const desc = (alert.description || "").toLowerCase();
    const msg = (alert.message || "").toLowerCase();
    const type = (alert.type || "").toLowerCase();

    if (userRole === "DOMESTICO") {
      return !desc.includes("comercial") && !desc.includes("lavandería") && !msg.includes("comercial") && !msg.includes("lavandería");
    }
    if (userRole === "COMERCIO") {
      return desc.includes("comercial") || desc.includes("lavandería") || msg.includes("comercial") || msg.includes("lavandería") || type.includes("corte") || msg.includes("corte");
    }
    if (userRole === "MUNICIPAL") {
      return desc.includes("vía pública") || desc.includes("via publica") || desc.includes("matriz") || msg.includes("vía pública") || type.includes("corte") || msg.includes("corte") || type.includes("fuga") || msg.includes("fuga");
    }
    return true; // Técnico ve todo
  });

  // Filtrado según el selector de estado
  const filteredAlerts = roleFilteredAlerts.filter((alert) => {
    if (filter === "ACTIVAS") return alert.active;
    if (filter === "HISTORICO") return !alert.active;
    return true;
  });

  // Ordenación por prioridad o por fecha reciente
  const sortedFilteredAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === "PRIORIDAD") {
      const priorityA = getAlertPriority(a);
      const priorityB = getAlertPriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
    }
    return parseAlertDate(b.timestamp) - parseAlertDate(a.timestamp);
  });

  const totalCount = roleFilteredAlerts.length;
  const activeCount = roleFilteredAlerts.filter((a) => a.active).length;
  const closedCount = totalCount - activeCount;
  const selectedAlert = sortedFilteredAlerts[selectedIndex] || sortedFilteredAlerts[0] || null;

  const renderActionButtons = (alert) => {
    if (!alert.active && alert.state !== "En Proceso" && alert.state !== "En reparación" && alert.state !== "En Revisión") return null;

    if (userRole === "DOMESTICO" || userRole === "COMERCIO") {
      if (alert.active && (alert.type === "Fuga" || alert.message.toLowerCase().includes("fuga"))) {
        return (
          <button
            onClick={() => handleExecuteAction(alert.id, "CLOSE_VALVE")}
            disabled={actionLoading}
            className="btn btn-danger w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mt-3"
            style={{ fontSize: 13 }}
          >
            <ShieldAlert size={16} />
            {actionLoading ? "Cerrando..." : "Cerrar Válvula de Emergencia"}
          </button>
        );
      }
    }

    if (userRole === "MUNICIPAL") {
      if (alert.state === "Pendiente" || alert.state === "Activa" || alert.active) {
        return (
          <button
            onClick={() => handleExecuteAction(alert.id, "MUNICIPAL_PROCESS")}
            disabled={actionLoading}
            className="btn btn-primary w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mt-3"
            style={{ fontSize: 13 }}
          >
            <Wrench size={16} />
            {actionLoading ? "Asignando..." : "Iniciar Reparación"}
          </button>
        );
      } else if (alert.state === "En Proceso" || alert.state === "En reparación") {
        return (
          <button
            onClick={() => handleExecuteAction(alert.id, "MUNICIPAL_RESOLVE")}
            disabled={actionLoading}
            className="btn btn-success text-white w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mt-3"
            style={{ fontSize: 13 }}
          >
            <CheckCircle size={16} />
            {actionLoading ? "Completando..." : "Finalizar Bacheo y Asfaltado"}
          </button>
        );
      }
    }

    if (userRole === "TECNICO") {
      if (alert.state === "Pendiente" || alert.state === "Activa" || alert.active) {
        return (
          <button
            onClick={() => handleExecuteAction(alert.id, "TECH_PROCESS")}
            disabled={actionLoading}
            className="btn btn-primary w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mt-3"
            style={{ fontSize: 13 }}
          >
            <Wrench size={16} />
            {actionLoading ? "Iniciando..." : "Iniciar Reparación de Campo"}
          </button>
        );
      } else if (alert.state === "En Proceso" || alert.state === "En reparación") {
        return (
          <button
            onClick={() => handleExecuteAction(alert.id, "TECH_REVIEW")}
            disabled={actionLoading}
            className="btn btn-warning w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mt-3"
            style={{ fontSize: 13 }}
          >
            <ShieldCheck size={16} />
            {actionLoading ? "Enviando..." : "Enviar a Auditoría LegalTech"}
          </button>
        );
      } else if (alert.state === "En Revisión") {
        return (
          <button
            onClick={() => handleExecuteAction(alert.id, "TECH_RESOLVE")}
            disabled={actionLoading}
            className="btn btn-success text-white w-100 rounded-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 mt-3"
            style={{ fontSize: 13 }}
          >
            <CheckSquare size={16} />
            {actionLoading ? "Aprobando..." : "Aprobar Refacturación y Cerrar"}
          </button>
        );
      }
    }

    return null;
  };

  if (loading) {
    return (
      <div className="d-flex flex-fill align-items-center justify-content-center text-muted min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-2" role="status" />
          <p className="mb-0">Cargando historial de notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 p-md-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER SECTION */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: "var(--text)" }}>Notificaciones e Incidencias</h3>
          <p className="text-muted mb-0 small" style={{ fontSize: 13 }}>
            Monitoreo en tiempo real de alertas hídricas y estado de la red.
          </p>
        </div>
        <span className="badge rounded-pill border px-3 py-2 fw-semibold d-flex align-items-center gap-1" style={{ backgroundColor: "var(--surface-soft)", color: "var(--text)", borderColor: "var(--header-border)" }}>
          <Bell size={13} className="text-primary" /> Historial Seguro (PostgreSQL)
        </span>
      </div>

      {/* KPI CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}
          >
            <span className="text-muted d-block small mb-1">TOTAL EVENTOS</span>
            <h3 className="fw-bold mb-0" style={{ fontSize: 28, color: "var(--text)" }}>{totalCount}</h3>
            <div className="position-absolute opacity-10" style={{ right: 20, bottom: 10 }}>
              <Bell size={60} />
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}
          >
            <span className="text-muted d-block small mb-1">ALERTAS ACTIVAS</span>
            <h3 className="fw-bold mb-0 text-danger" style={{ fontSize: 28 }}>{activeCount}</h3>
            <div className="position-absolute opacity-10 text-danger" style={{ right: 20, bottom: 10 }}>
              <AlertTriangle size={60} />
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}
          >
            <span className="text-muted d-block small mb-1">EVENTOS SOLUCIONADOS</span>
            <h3 className="fw-bold mb-0 text-success" style={{ fontSize: 28 }}>{closedCount}</h3>
            <div className="position-absolute opacity-10 text-success" style={{ right: 20, bottom: 10 }}>
              <CheckCircle size={60} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS Y CONTENIDO */}
      <div 
        className="card border rounded-4 p-4 shadow-sm"
        style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}
      >
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 border-bottom pb-3 mb-4" style={{ borderColor: "var(--header-border)" }}>
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: "var(--text)" }}>
            <ListFilter size={18} className="text-primary" /> Línea de Tiempo del Medidor
          </h5>
          
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {/* Ordenar */}
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small" style={{ fontSize: 11 }}>Ordenar por:</span>
              <div className="btn-group btn-group-sm rounded-pill p-1 border" style={{ backgroundColor: "var(--surface-soft)", borderColor: "var(--header-border)" }}>
                {["PRIORIDAD", "RECIENTES"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSortBy(opt);
                      setSelectedIndex(0);
                    }}
                    className={`btn rounded-pill border-0 px-2.5 py-1 fw-semibold transition-all ${
                      sortBy === opt ? "btn-primary text-white shadow-sm" : "btn-link text-muted text-decoration-none"
                    }`}
                    style={{ fontSize: 10.5 }}
                  >
                    {opt === "PRIORIDAD" ? "Prioridad" : "Más Recientes"}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de filtro */}
            <div className="btn-group btn-group-sm rounded-pill p-1 border" style={{ backgroundColor: "var(--surface-soft)", borderColor: "var(--header-border)" }}>
              {["TODAS", "ACTIVAS", "HISTORICO"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setFilter(opt);
                    setSelectedIndex(0);
                    setActionMessage("");
                  }}
                  className={`btn rounded-pill border-0 px-3 py-1.5 fw-semibold ${
                    filter === opt ? "btn-primary shadow-sm text-white" : "btn-link text-muted text-decoration-none"
                  }`}
                  style={{ fontSize: 11 }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sortedFilteredAlerts.length > 0 ? (
          <div className="row g-4">
            {/* LISTADO TIPO TIMELINE */}
            <div className="col-12 col-lg-5">
              <div 
                className="d-flex flex-column gap-3 overflow-auto pr-1"
                style={{ maxHeight: "480px" }}
              >
                {sortedFilteredAlerts.map((alert, index) => (
                  <button
                    key={`${alert.id || index}`}
                    onClick={() => void handleSelectAlert(index, alert)}
                    className={`text-start border rounded-4 p-3 w-100 position-relative transition-all`}
                    style={{ 
                      appearance: "none",
                      backgroundColor: selectedIndex === index ? "rgba(37, 99, 235, 0.05)" : "var(--surface)",
                      borderColor: selectedIndex === index ? "#2563eb" : "var(--header-border)",
                      boxShadow: selectedIndex === index ? "0 4px 12px rgba(37,99,235,0.05)" : "none",
                      transform: selectedIndex === index ? "translateY(-1px)" : "none"
                    }}
                  >
                    <div className="d-flex align-items-start gap-3">
                      {/* Icono de color */}
                      <div 
                        className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                        style={{ 
                          backgroundColor: alert.active ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                          border: alert.active ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(34, 197, 94, 0.2)"
                        }}
                      >
                        {getAlertIcon(alert.type || alert.message)}
                      </div>
                      
                      <div className="flex-fill">
                        <div className="d-flex align-items-center justify-content-between mb-1 gap-2">
                          <span className="fw-bold text-truncate" style={{ fontSize: 13.5, color: "var(--text)", maxWidth: "160px" }}>
                            {alert.message}
                          </span>
                          <span className={`badge rounded-pill px-2.5 py-1 ${getBadgeClass(alert.state)}`} style={{ fontSize: 9.5 }}>
                            {alert.state || (alert.active ? "Activa" : "Cerrada")}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-1.5 mt-1 flex-wrap">
                          {getPriorityBadge(getAlertPriority(alert))}
                        </div>
                        <p className="text-muted mb-0 text-truncate" style={{ fontSize: 11.5 }}>
                          {alert.description || alert.schedule}
                        </p>
                        <span className="text-muted d-block mt-2" style={{ fontSize: 9.5 }}>
                          {alert.timestamp || "Reciente"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* DETALLES DE ALERTA SELECCIONADA */}
            <div className="col-12 col-lg-7">
              {selectedAlert ? (
                <div 
                  className="rounded-4 p-4 h-100 border d-flex flex-column gap-3 shadow-sm"
                  style={{ backgroundColor: "var(--surface-soft)", borderColor: "var(--header-border)" }}
                >
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-2" style={{ borderColor: "var(--header-border)" }}>
                    <h6 className="fw-bold mb-0" style={{ color: "var(--text)", fontSize: 15 }}>Detalle de Incidencia</h6>
                    <span 
                      className={`badge rounded-pill px-3 py-1.5 fw-semibold ${getBadgeClass(selectedAlert.state)}`}
                      style={{ fontSize: 10.5 }}
                    >
                      {selectedAlert.state || (selectedAlert.active ? "Activa" : "Solucionada")}
                    </span>
                  </div>

                  <div className="row g-3">
                    <div className="col-12">
                      <label className="text-muted d-block small mb-1">Evento</label>
                      <div className="fw-bold" style={{ fontSize: 15, color: "var(--text)" }}>{selectedAlert.message}</div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="text-muted d-block small mb-1">Fecha / Hora de Registro</label>
                      <div style={{ color: "var(--text)", fontSize: 13.5 }}>{selectedAlert.timestamp || "Reciente"}</div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="text-muted d-block small mb-1">Tipo de Evento</label>
                      <div style={{ color: "var(--text)", fontSize: 13.5 }}>{selectedAlert.type || "Anomalía"}</div>
                    </div>

                    <div className="col-12">
                      <label className="text-muted d-block small mb-1">Análisis IA / Descripción Técnica</label>
                      <div 
                        className="p-3 rounded-3" 
                        style={{ background: "var(--surface)", border: "1px solid var(--header-border)", color: "var(--text)", fontSize: 13, lineHeight: 1.5 }}
                      >
                        {selectedAlert.description || "No hay observaciones técnicas específicas registradas para este evento."}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="text-muted d-block small mb-1">Sistema Afectado</label>
                      <div style={{ color: "var(--text)", fontSize: 13.5 }}>Tuberías / Red Domiciliaria Puente Piedra</div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="text-muted d-block small mb-1">Horario de Monitoreo</label>
                      <div style={{ color: "var(--text)", fontSize: 13.5 }}>{selectedAlert.schedule || "Telemetría 24/7"}</div>
                    </div>
                  </div>

                  {/* Feedback del Action Workflow */}
                  {actionMessage && (
                    <div className="alert alert-info rounded-3 py-2 px-3 small border-0 mb-0 mt-2">
                      {actionMessage}
                    </div>
                  )}

                  {/* Botones de acción dinámicos */}
                  {renderActionButtons(selectedAlert)}
                  
                  {/* Consejos/Mensaje de Seguridad */}
                  <div 
                    className="mt-auto p-3 rounded-4 border d-flex gap-2"
                    style={{ 
                      background: selectedAlert.active ? "rgba(239, 68, 68, 0.03)" : "rgba(34, 197, 94, 0.03)",
                      borderColor: selectedAlert.active ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)" 
                    }}
                  >
                    <HelpCircle size={18} className={selectedAlert.active ? "text-danger" : "text-success"} />
                    <span style={{ fontSize: 12, color: "var(--subtle)" }}>
                      {selectedAlert.active 
                        ? "Este evento requiere tu atención. Verifica si hay caños abiertos, goteos en inodoros o cierra la válvula principal temporalmente desde la sección de inicio."
                        : "Este evento ya fue mitigado. El flujo se ha normalizado y la válvula opera en estado óptimo."}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center text-muted border border-dashed rounded-4 p-5 h-100">
                  <div className="text-center">
                    <CheckCircle size={40} className="mb-2 text-success opacity-50" />
                    <p className="mb-0">No hay alertas seleccionadas.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted py-5 border border-dashed rounded-4">
            <CheckCircle size={48} className="text-success mb-3 opacity-60" />
            <h6 className="fw-bold mb-1" style={{ color: "var(--text)" }}>Bandeja Vacía y Segura</h6>
            <p className="small mb-0 text-muted" style={{ maxWidth: 300, margin: "0 auto" }}>
              No hay notificaciones activas o históricas bajo el filtro seleccionado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}