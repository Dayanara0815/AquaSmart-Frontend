import { useEffect, useState } from "react";
import { 
  Bell, AlertTriangle, Droplets, ShieldAlert, CheckCircle, 
  Calendar, Clock, ListFilter, HelpCircle, Activity,
  Wrench, Play, CheckSquare, ShieldCheck, ChevronRight,
  BellOff, VolumeX, SlidersHorizontal, Settings, Check, Moon,
  Zap, Radio, Send, X, ClipboardList, Square
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
      const month = parseInt(dateParts[1], 10) - 1;
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
    return 4;
  }
  if (type.includes("fuga") || msg.includes("fuga")) {
    return 1;
  }
  if (state === "en revisión" || state === "en proceso" || state === "en reparación") {
    return 2;
  }
  return 3;
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
  const [filter, setFilter] = useState("TODAS"); // TODAS | ACTIVAS | SILENCIADAS | HISTORICO
  const [sortBy, setSortBy] = useState("PRIORIDAD"); // PRIORIDAD | RECIENTES
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [showConfirmCloseModal, setShowConfirmCloseModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // --- HISTORIA DE USUARIO 13 (RF5): Silenciado de notificaciones ---
  const [muteNonCritical, setMuteNonCritical] = useState(() => {
    return localStorage.getItem("aquasmart_mute_non_critical") === "true";
  });
  const [muteAir, setMuteAir] = useState(() => {
    return localStorage.getItem("aquasmart_mute_air") !== "false";
  });
  const [muteCuts, setMuteCuts] = useState(() => {
    return localStorage.getItem("aquasmart_mute_cuts") !== "false";
  });

  // --- HISTORIA DE USUARIO 17 (RF5): Horario de silencio nocturno ---
  const [nightSilenceEnabled, setNightSilenceEnabled] = useState(() => {
    return localStorage.getItem("aquasmart_night_silence_enabled") !== "false";
  });
  const [silentFrom, setSilentFrom] = useState(() => {
    return localStorage.getItem("aquasmart_silent_from") || "22:00";
  });
  const [silentTo, setSilentTo] = useState(() => {
    return localStorage.getItem("aquasmart_silent_to") || "08:00";
  });

  // --- HISTORIA DE USUARIO 12 (RF5): Notificaciones Push Inmediatas por Fuga ---
  const [pushPermission, setPushPermission] = useState(() => {
    return (typeof window !== "undefined" && "Notification" in window) ? Notification.permission : "default";
  });
  const [pushToastAlert, setPushToastAlert] = useState(null);

  // --- HISTORIA DE USUARIO 14 (RF6): Alertas Preventivas de Corte de Agua (Comercio / Doméstico) ---
  const [showContingencyModal, setShowContingencyModal] = useState(false);
  const [contingencySavedMsg, setContingencySavedMsg] = useState("");
  const [reminderSetMsg, setReminderSetMsg] = useState("");
  const [checklistState, setChecklistState] = useState(() => {
    try {
      const saved = localStorage.getItem("aquasmart_contingency_checklist");
      return saved ? JSON.parse(saved) : { fillTank: true, storeWater: true, notifyTeam: false, pauseMachines: false };
    } catch {
      return { fillTank: true, storeWater: true, notifyTeam: false, pauseMachines: false };
    }
  });

  const handleToggleChecklist = (key) => {
    setChecklistState((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("aquasmart_contingency_checklist", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveContingencyPlan = () => {
    setContingencySavedMsg("¡Plan de preparación para el corte de agua guardado con éxito!");
    setTimeout(() => {
      setContingencySavedMsg("");
      setShowContingencyModal(false);
    }, 1200);
  };

  const handleSetReminder = () => {
    setReminderSetMsg("⏰ Recordatorio programado: Recibirás un aviso Push 2 horas antes del corte.");
    setTimeout(() => setReminderSetMsg(""), 3500);

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ Recordatorio de Corte de Agua Programado", {
        body: "Te notificaremos 2 horas antes de que inicie el corte preventivo de SEDAPAL.",
        icon: "/favicon.ico"
      });
    }
  };

  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferencesSavedMsg, setPreferencesSavedMsg] = useState("");

  const userRole = localStorage.getItem("userRole") || "DOMESTICO";
  const userEmail = localStorage.getItem("userEmail");

  // Solicitud de Permiso Push Nativo del Navegador
  const handleRequestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta Notificaciones Push Nativas.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        new Notification("🔔 Notificaciones Push AquaSmart Activadas", {
          body: "Recibirás alertas inmediatas en tiempo real ante fugas de agua.",
          icon: "/favicon.ico"
        });
      }
    } catch (err) {
      console.error("Error al solicitar permiso Push", err);
    }
  };

  // Simulación de Fuga en Tiempo Real con Push Inmediato
  const handleSimulatePushLeak = () => {
    const leakMessage = "🚨 ALERTA CRÍTICA: Fuga Silenciosa en Tiempo Real";
    const leakBody = "Se registró consumo continuo anómalo de 245.8 L/h en el medidor ASM-2048. ¡Actúa rápido!";

    // 1. Notificación push nativa del sistema si hay permiso
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(leakMessage, {
          body: leakBody,
          icon: "/favicon.ico",
          tag: "fuga-critica-aquasmart",
          requireInteraction: true,
        });
      } catch (e) {
        console.warn("No se pudo emitir notificación nativa", e);
      }
    }

    // 2. Agregar nueva alerta activa en la lista
    const newLeakAlert = {
      id: Date.now(),
      active: true,
      message: "🚨 FUGA CRÍTICA DETECTADA EN TIEMPO REAL",
      schedule: "Hace 1 instante",
      type: "Fuga",
      state: "Activa",
      description: "Telemetría ultrasonido detectó consumo continuo ininterrumpido (245.8 L/h). ¡Se requiere cierre preventivo de válvula para minimizar pérdida de agua!",
      timestamp: new Date().toLocaleDateString("es-PE") + " " + new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
    };

    setAlerts((prev) => [newLeakAlert, ...prev]);
    setSelectedIndex(0);

    // 3. Mostrar banner flotante de emergencia en pantalla
    setPushToastAlert(newLeakAlert);
  };

  // Helper para verificar si una alerta está silenciada
  const isAlertSilenced = (alert) => {
    if (!alert) return false;
    const type = (alert.type || "").toLowerCase();
    const msg = (alert.message || "").toLowerCase();

    // Las fugas NUNCA se silenciarán automáticamente por seguridad
    if (type.includes("fuga") || msg.includes("fuga")) return false;

    if (muteNonCritical) return true;
    if (muteAir && (type.includes("aire") || msg.includes("aire"))) return true;
    if (muteCuts && (type.includes("corte") || msg.includes("corte"))) return true;

    return false;
  };

  const handleSavePreferences = () => {
    localStorage.setItem("aquasmart_mute_non_critical", muteNonCritical.toString());
    localStorage.setItem("aquasmart_mute_air", muteAir.toString());
    localStorage.setItem("aquasmart_mute_cuts", muteCuts.toString());
    localStorage.setItem("aquasmart_night_silence_enabled", nightSilenceEnabled.toString());
    localStorage.setItem("aquasmart_silent_from", silentFrom);
    localStorage.setItem("aquasmart_silent_to", silentTo);

    setPreferencesSavedMsg("¡Preferencias y horario de silencio guardados con éxito!");
    setTimeout(() => {
      setPreferencesSavedMsg("");
      setShowPreferencesModal(false);
    }, 900);
  };

  const handleSelectAlert = async (index, alert) => {
    setSelectedIndex(index);
    setActionMessage("");
    
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

  const confirmCloseValve = async () => {
    setShowConfirmCloseModal(false);
    if (!pendingAction) return;
    try {
      setActionLoading(true);
      setActionMessage("");
      await api.setValve(false, userEmail);
      setActionMessage("Electroválvula de emergencia cerrada con éxito.");
    } catch (err) {
      console.error("Error al cerrar la válvula", err);
      setActionMessage("Error al intentar cerrar la electroválvula.");
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const handleExecuteAction = async (alertId, actionType) => {
    if (actionType === "CLOSE_VALVE") {
      setPendingAction({ alertId, actionType });
      setShowConfirmCloseModal(true);
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("");
      if (actionType === "MUNICIPAL_PROCESS") {
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
    return true;
  });

  // Filtrado según el selector de estado
  const filteredAlerts = roleFilteredAlerts.filter((alert) => {
    if (filter === "SILENCIADAS") return isAlertSilenced(alert);
    if (filter === "ACTIVAS") return alert.active && !isAlertSilenced(alert);
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
  const activeCount = roleFilteredAlerts.filter((a) => a.active && !isAlertSilenced(a)).length;
  const silencedCount = roleFilteredAlerts.filter((a) => isAlertSilenced(a)).length;
  const closedCount = roleFilteredAlerts.filter((a) => !a.active).length;
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
            Monitoreo en tiempo real de alertas hídricas y preferencia de notificaciones.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* BOTÓN HU 13 (RF5): Silenciar Alertas */}
          <button 
            onClick={() => setShowPreferencesModal(true)}
            className={`btn btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-2 transition-all shadow-sm ${
              muteNonCritical || muteAir || muteCuts 
                ? "btn-warning text-dark border-warning" 
                : "btn-outline-primary"
            }`}
            style={{ fontSize: 12.5 }}
          >
            {muteNonCritical || muteAir || muteCuts ? <BellOff size={15} /> : <Bell size={15} />}
            <span>Desactivar / Silenciar Alertas</span>
            {(muteNonCritical || muteAir || muteCuts) && (
              <span className="badge bg-dark text-white rounded-circle ms-1 px-1.5" style={{ fontSize: 10 }}>
                {silencedCount}
              </span>
            )}
          </button>

          <span className="badge rounded-pill border px-3 py-2 fw-semibold d-flex align-items-center gap-1" style={{ backgroundColor: "var(--surface-soft)", color: "var(--text)", borderColor: "var(--header-border)" }}>
            <Bell size={13} className="text-primary" /> Historial Seguro (PostgreSQL)
          </span>
        </div>
      </div>

      {/* HISTORIA DE USUARIO 12 (RF5): NOTIFICACIONES PUSH INMEDIATAS POR FUGA */}
      <div className="card border-0 shadow-sm rounded-4 p-3.5 mb-4" style={{ background: "var(--surface)", borderLeft: "5px solid #ef4444" }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2.5 bg-danger bg-opacity-10 text-danger rounded-circle">
              <Zap size={24} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h6 className="fw-bold mb-0" style={{ color: "var(--text)" }}>Notificaciones Push Nativas por Fuga</h6>
                {pushPermission === "granted" ? (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold" style={{ fontSize: 10 }}>
                    ✓ Push Nativo Activo
                  </span>
                ) : (
                  <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold" style={{ fontSize: 10 }}>
                    ⚠️ Permiso Requerido
                  </span>
                )}
              </div>
              <p className="text-muted small mb-0" style={{ fontSize: 12 }}>
                Alertas instantáneas enviadas al sistema operativo al detectar consumos anómalos o fugas para minimizar pérdida de agua.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
            {pushPermission !== "granted" && (
              <button 
                onClick={handleRequestPushPermission}
                className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1"
                style={{ fontSize: 12 }}
              >
                <Radio size={14} />
                Activar Push Nativo
              </button>
            )}
            <button 
              onClick={handleSimulatePushLeak}
              className="btn btn-sm btn-danger rounded-pill px-3.5 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm border-0"
              style={{ fontSize: 12 }}
            >
              <Send size={14} />
              Simular Fuga Inmediata (Probar Push)
            </button>
          </div>
        </div>
      </div>

      {/* TOAST FLOTANTE DE EMERGENCIA (PUSH SIMULADO) */}
      {pushToastAlert && (
        <div 
          className="position-fixed top-0 end-0 p-3" 
          style={{ zIndex: 9999, maxWidth: 420 }}
        >
          <div className="card border-danger border-2 shadow-lg rounded-4 overflow-hidden animate-slide-in" style={{ background: "var(--surface)", color: "var(--text)" }}>
            <div className="bg-danger text-white p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: 13.5 }}>
                <Zap size={18} className="animate-pulse" />
                NOTIFICACIÓN PUSH NATIVA
              </div>
              <button 
                className="btn-close btn-close-white shadow-none" 
                onClick={() => setPushToastAlert(null)}
              />
            </div>
            <div className="p-3">
              <h6 className="fw-bold text-danger mb-1" style={{ fontSize: 13.5 }}>{pushToastAlert.message}</h6>
              <p className="small text-muted mb-3" style={{ fontSize: 12 }}>
                {pushToastAlert.description}
              </p>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-danger flex-fill fw-bold py-2"
                  onClick={() => {
                    setPushToastAlert(null);
                    alert("¡Válvula principal cerrada con éxito de forma remota! Se ha minimizado el desperdicio de agua.");
                  }}
                  style={{ fontSize: 12 }}
                >
                  🚨 Cerrar Válvula de Agua
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary px-3"
                  onClick={() => setPushToastAlert(null)}
                  style={{ fontSize: 12 }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BANNER INFORMATIVO DE HU13 (RF5) SI HAY ALERTAS SILENCIADAS */}
      {(muteNonCritical || muteAir || muteCuts) && (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-4 p-3 d-flex align-items-center justify-content-between flex-wrap gap-2 animate-fade-in">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 bg-warning bg-opacity-25 rounded-circle text-warning-emphasis">
              <VolumeX size={22} />
            </div>
            <div>
              <div className="fw-bold text-dark mb-0" style={{ fontSize: 13.5 }}>
                🔕 Notificaciones no críticas silenciadas
              </div>
              <div className="text-muted small" style={{ fontSize: 12 }}>
                Has configurado el silenciado para evitar molestias en alertas de poca urgencia 
                ({muteNonCritical ? "todas las alertas no críticas" : `${muteAir ? "Paso de Aire" : ""} ${muteCuts ? "Cortes Preventivos" : ""}`}).
                Las fugas graves continuarán notificándose.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-dark rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1"
            onClick={() => setShowPreferencesModal(true)}
            style={{ fontSize: 11.5 }}
          >
            <SlidersHorizontal size={13} />
            Ajustar Silenciador
          </button>
        </div>
      )}

      {/* BANNER INFORMATIVO DE HU17 (RF5): SILENCIO NOCTURNO ACTIVO */}
      {nightSilenceEnabled && (
        <div className="alert alert-info border-0 shadow-sm rounded-4 mb-4 p-3 d-flex align-items-center justify-content-between flex-wrap gap-2 animate-fade-in">
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 bg-info bg-opacity-25 rounded-circle text-info-emphasis">
              <Moon size={22} />
            </div>
            <div>
              <div className="fw-bold text-dark mb-0" style={{ fontSize: 13.5 }}>
                🌙 Horario de Silencio Nocturno Configurado ({silentFrom} a {silentTo})
              </div>
              <div className="text-muted small" style={{ fontSize: 12 }}>
                Las notificaciones sonoras están desactivadas durante la noche para tu descanso. <strong>Todos los eventos continúan registrándose normalmente en el historial.</strong>
              </div>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 fw-semibold text-dark"
            onClick={() => setShowPreferencesModal(true)}
            style={{ fontSize: 11.5 }}
          >
            Configurar Horario
          </button>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden d-flex flex-column justify-content-between"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)", minHeight: 105 }}
          >
            <span className="text-muted d-block small mb-2 fw-semibold" style={{ fontSize: 11, letterSpacing: 0.3 }}>TOTAL DE EVENTOS</span>
            <h3 className="fw-bold mb-0" style={{ fontSize: 28, color: "var(--text)" }}>{totalCount}</h3>
            <div className="position-absolute opacity-10" style={{ right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <Bell size={44} style={{ color: "var(--text)" }} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden d-flex flex-column justify-content-between"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)", minHeight: 105 }}
          >
            <span className="text-muted d-block small mb-2 fw-semibold" style={{ fontSize: 11, letterSpacing: 0.3 }}>ALERTAS ACTIVAS</span>
            <h3 className="fw-bold mb-0 text-danger" style={{ fontSize: 28 }}>{activeCount}</h3>
            <div className="position-absolute opacity-10 text-danger" style={{ right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <AlertTriangle size={44} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden d-flex flex-column justify-content-between"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)", minHeight: 105 }}
          >
            <span className="text-muted d-block small mb-2 fw-semibold text-warning-emphasis" style={{ fontSize: 11, letterSpacing: 0.3 }}>SILENCIADAS</span>
            <h3 className="fw-bold mb-0 text-warning" style={{ fontSize: 28 }}>{silencedCount}</h3>
            <div className="position-absolute opacity-10 text-warning" style={{ right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <VolumeX size={44} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div 
            className="card border rounded-4 p-4 shadow-sm h-100 position-relative overflow-hidden d-flex flex-column justify-content-between"
            style={{ background: "var(--surface)", borderColor: "var(--header-border)", minHeight: 105 }}
          >
            <span className="text-muted d-block small mb-2 fw-semibold" style={{ fontSize: 11, letterSpacing: 0.3 }}>SOLUCIONADOS</span>
            <h3 className="fw-bold mb-0 text-success" style={{ fontSize: 28 }}>{closedCount}</h3>
            <div className="position-absolute opacity-10 text-success" style={{ right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <CheckCircle size={44} />
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
              <span className="text-muted small" style={{ fontSize: 11 }}>Ordenar:</span>
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

            {/* Selector de filtro de alertas */}
            <div className="btn-group btn-group-sm rounded-pill p-1 border" style={{ backgroundColor: "var(--surface-soft)", borderColor: "var(--header-border)" }}>
              {["TODAS", "ACTIVAS", "SILENCIADAS", "HISTORICO"].map((opt) => (
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
                  {opt === "SILENCIADAS" ? `SILENCIADAS (${silencedCount})` : opt}
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
                {sortedFilteredAlerts.map((alert, index) => {
                  const silenced = isAlertSilenced(alert);
                  return (
                    <button
                      key={`${alert.id || index}`}
                      onClick={() => void handleSelectAlert(index, alert)}
                      className="text-start border rounded-4 p-3 w-100 position-relative transition-all"
                      style={{ 
                        appearance: "none",
                        backgroundColor: selectedIndex === index 
                          ? "rgba(37, 99, 235, 0.05)" 
                          : silenced 
                            ? "var(--surface-soft)" 
                            : "var(--surface)",
                        borderColor: selectedIndex === index ? "#2563eb" : "var(--header-border)",
                        boxShadow: selectedIndex === index ? "0 4px 12px rgba(37,99,235,0.05)" : "none",
                        opacity: silenced ? 0.75 : 1,
                        transform: selectedIndex === index ? "translateY(-1px)" : "none"
                      }}
                    >
                      <div className="d-flex align-items-start gap-3">
                        {/* Icono de color */}
                        <div 
                          className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                          style={{ 
                            backgroundColor: silenced 
                              ? "rgba(108, 117, 125, 0.15)" 
                              : alert.active 
                                ? "rgba(239, 68, 68, 0.1)" 
                                : "rgba(34, 197, 94, 0.1)",
                            border: silenced
                              ? "1px solid rgba(108, 117, 125, 0.3)"
                              : alert.active 
                                ? "1px solid rgba(239, 68, 68, 0.2)" 
                                : "1px solid rgba(34, 197, 94, 0.2)"
                          }}
                        >
                          {silenced ? <BellOff className="text-secondary" size={20} /> : getAlertIcon(alert.type || alert.message)}
                        </div>
                        
                        <div className="flex-fill">
                          <div className="d-flex align-items-center justify-content-between mb-1 gap-2">
                            <span className="fw-bold text-truncate" style={{ fontSize: 13.5, color: "var(--text)", maxWidth: "150px" }}>
                              {alert.message}
                            </span>
                            {silenced ? (
                              <span className="badge rounded-pill bg-secondary text-white px-2 py-0.5 d-flex align-items-center gap-1" style={{ fontSize: 9.5 }}>
                                <BellOff size={9} /> Silenciada
                              </span>
                            ) : (
                              <span className={`badge rounded-pill px-2.5 py-1 ${getBadgeClass(alert.state)}`} style={{ fontSize: 9.5 }}>
                                {alert.state || (alert.active ? "Activa" : "Cerrada")}
                              </span>
                            )}
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
                  );
                })}
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
                    <div className="d-flex align-items-center gap-2">
                      {isAlertSilenced(selectedAlert) && (
                        <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1" style={{ fontSize: 10 }}>
                          🔕 Silenciada por Usuario
                        </span>
                      )}
                      <span 
                        className={`badge rounded-pill px-3 py-1.5 fw-semibold ${getBadgeClass(selectedAlert.state)}`}
                        style={{ fontSize: 10.5 }}
                      >
                        {selectedAlert.state || (selectedAlert.active ? "Activa" : "Solucionada")}
                      </span>
                    </div>
                  </div>

                  {/* NOTA DE SILENCIADO HU13 (RF5) SI APLICA */}
                  {isAlertSilenced(selectedAlert) && (
                    <div className="alert alert-warning border-0 rounded-3 p-3 mb-0 d-flex align-items-center justify-content-between gap-2" style={{ fontSize: 12.5 }}>
                      <div className="d-flex align-items-center gap-2">
                        <VolumeX size={18} className="text-warning-emphasis" />
                        <span>
                          <strong>Alerta Silenciada:</strong> Esta notificación no crítica ha sido silenciada en tus preferencias para no interrumpirte.
                        </span>
                      </div>
                      <button 
                        className="btn btn-sm btn-outline-dark rounded-pill px-2 py-0.5"
                        style={{ fontSize: 11 }}
                        onClick={() => setShowPreferencesModal(true)}
                      >
                        Ajustar
                      </button>
                    </div>
                  )}

                  {/* HISTORIA DE USUARIO 14 (RF6): TARJETA ESPECIAL DE CORTE PREVENTIVO */}
                  {((selectedAlert.type || "").toLowerCase().includes("corte") || (selectedAlert.message || "").toLowerCase().includes("corte")) && (
                    <div className="card border-warning border-0 rounded-4 p-3.5 shadow-sm mb-2" style={{ background: "color-mix(in srgb, var(--warn-bg) 85%, var(--surface))", borderLeft: "5px solid #f59e0b" }}>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <ShieldAlert size={20} className="text-warning-emphasis" />
                          <h6 className="fw-bold mb-0 text-warning-emphasis" style={{ fontSize: 13.5 }}>
                            🛡️ Alerta Preventiva de Corte de Agua - Plan de Contingencia
                          </h6>
                        </div>
                        <span className="badge bg-warning bg-opacity-25 text-warning-emphasis px-2.5 py-1 rounded-pill fw-bold" style={{ fontSize: 10 }}>
                          Faltan 14h 30m
                        </span>
                      </div>

                      <p className="small text-muted mb-3" style={{ fontSize: 12 }}>
                        Mantenimiento telemétrico preventivo programado por SEDAPAL. {userRole === "COMERCIO" ? "Prepara tu pequeño negocio con anticipación para no interrumpir tu atención comercial." : "Prepara las reservas de tu hogar con tiempo para evitar incomodidades."}
                      </p>

                      {/* Reserva sugerida por perfil */}
                      <div className="p-3 rounded-3 mb-3 border bg-white text-dark shadow-xs" style={{ fontSize: 12 }}>
                        <div className="fw-bold mb-1 d-flex align-items-center gap-2">
                          <Droplets size={16} className="text-primary" />
                          {userRole === "COMERCIO" ? "🏪 Reserva Comercial Sugerida:" : "🏠 Reserva Doméstica Sugerida:"}
                        </div>
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <span className="text-muted" style={{ fontSize: 11.5 }}>
                            {userRole === "COMERCIO" 
                              ? "Basado en tu consumo de negocio promedio, se sugiere almacenar:"
                              : "Basado en el consumo de tu suministro, se sugiere almacenar:"}
                          </span>
                          <span className="fw-bold text-primary" style={{ fontSize: 15 }}>
                            {userRole === "COMERCIO" ? "450 Litros" : "120 Litros"}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex gap-2 flex-wrap">
                        <button 
                          className="btn btn-sm btn-warning text-dark flex-fill fw-bold py-2 d-flex align-items-center justify-content-center gap-1.5 shadow-sm border-0"
                          onClick={() => setShowContingencyModal(true)}
                          style={{ fontSize: 12 }}
                        >
                          <ClipboardList size={15} />
                          📋 Abrir Plan de Preparación / Checklist
                        </button>

                        <button 
                          className="btn btn-sm btn-outline-dark px-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-1.5"
                          onClick={handleSetReminder}
                          style={{ fontSize: 12 }}
                        >
                          <Clock size={15} />
                          ⏰ Recordatorio (2h antes)
                        </button>
                      </div>

                      {reminderSetMsg && (
                        <div className="alert alert-success border-0 py-2 px-3 mb-0 mt-2 rounded-3 text-center small fw-semibold">
                          {reminderSetMsg}
                        </div>
                      )}
                    </div>
                  )}

                  {/* DIAGNÓSTICO FLUIDO Y NATURAL DEL EVENTO (HU 16 - RF5) */}
                  <div className="card border-0 shadow-xs rounded-4 p-3.5 mb-2" style={{ background: "var(--surface)", border: "1px solid var(--header-border)" }}>
                    <div className="d-flex align-items-center justify-content-between mb-2.5 border-bottom pb-2" style={{ borderColor: "var(--header-border)" }}>
                      <div className="fw-bold d-flex align-items-center gap-2" style={{ color: "var(--text)", fontSize: 13.5 }}>
                        <Activity size={17} className="text-primary" />
                        Informe Narrativo del Evento Telemétrico
                      </div>
                      <span className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 rounded-pill fw-semibold" style={{ fontSize: 10.5 }}>
                        Análisis Automatizado
                      </span>
                    </div>

                    {/* PÁRRAFO NARRATIVO NATURAL QUE RESPONDE QUÉ, CUÁNDO, DÓNDE Y POR QUÉ */}
                    <div className="p-3 rounded-3 mb-3" style={{ background: "var(--surface-soft)", borderLeft: "4px solid #3b82f6", color: "var(--text)", fontSize: 12.5, lineHeight: 1.6 }}>
                      {selectedAlert.type?.toLowerCase().includes("fuga") ? (
                        <>
                          El sistema de monitoreo detectó una <strong>{selectedAlert.message}</strong> el <strong>{selectedAlert.timestamp || "recientemente"}</strong> registrada a través del medidor telemétrico <strong>ASM-2048</strong> (Suministro SEDAPAL <code>SUM-7849201</code>), ubicado en la tubería interna de la propiedad en Puente Piedra. Este evento se generó por un consumo continuo ininterrumpido en horario no convencional de madrugada, causado probablemente por un empaque de sanitario desgastado o una fuga oculta en la red domiciliaria.
                        </>
                      ) : selectedAlert.type?.toLowerCase().includes("corte") ? (
                        <>
                          Se ha registrado un <strong>{selectedAlert.message}</strong> programado para el <strong>{selectedAlert.schedule || "periodo indicado"}</strong> en el suministro <code>SUM-7849201</code> (Medidor <strong>ASM-2048</strong>), correspondiente al sector telemétrico de Puente Piedra. Este aviso preventivo responde a trabajos de mantenimiento y calibración en las redes matrices por parte de la EPS SEDAPAL para asegurar la estabilidad del servicio.
                        </>
                      ) : (
                        <>
                          Se registró un <strong>{selectedAlert.message}</strong> el <strong>{selectedAlert.timestamp || "recientemente"}</strong> a través del sensor telemétrico del medidor <strong>ASM-2048</strong> en el inmueble de Puente Piedra. El evento fue ocasionado por una fluctuación transitoria en la presión de la red hidráulica o purga de aire en la tubería, habiendo sido filtrado de manera segura para evitar falsas alarmas.
                        </>
                      )}
                    </div>

                    {/* FICHA RESUMEN CON INFORMACIÓN RELEVANTE */}
                    <div className="row g-2 text-muted small" style={{ fontSize: 11.5 }}>
                      <div className="col-6 col-md-3">
                        <span className="d-block text-muted" style={{ fontSize: 10.5 }}>Categoría</span>
                        <strong className="text-dark">{selectedAlert.type || "Anomalía"}</strong>
                      </div>
                      <div className="col-6 col-md-3">
                        <span className="d-block text-muted" style={{ fontSize: 10.5 }}>Fecha de Registro</span>
                        <strong className="text-dark">{selectedAlert.timestamp || "Tiempo Real"}</strong>
                      </div>
                      <div className="col-6 col-md-3">
                        <span className="d-block text-muted" style={{ fontSize: 10.5 }}>Medidor / Suministro</span>
                        <strong className="text-dark">ASM-2048</strong>
                      </div>
                      <div className="col-6 col-md-3">
                        <span className="d-block text-muted" style={{ fontSize: 10.5 }}>Estado de Atención</span>
                        <span className={`badge rounded-pill ${getBadgeClass(selectedAlert.state)}`} style={{ fontSize: 9.5 }}>
                          {selectedAlert.state || "Activo"}
                        </span>
                      </div>
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
            <h6 className="fw-bold mb-1" style={{ color: "var(--text)" }}>Bandeja Vacía</h6>
            <p className="small mb-0 text-muted" style={{ maxWidth: 300, margin: "0 auto" }}>
              No hay notificaciones bajo el filtro seleccionado.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE SILENCIADO Y PREFERENCIAS DE ALERTAS (HU 13 - RF5) */}
      {showPreferencesModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ background: "var(--surface)", color: "var(--text)" }}>
              <div className="modal-header border-bottom pb-3 pt-4 px-4 d-flex justify-content-between align-items-center" style={{ borderColor: "var(--header-border)" }}>
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-1" style={{ color: "var(--text)" }}>
                    <SlidersHorizontal size={20} className="text-primary" />
                    Desactivar / Silenciar Notificaciones
                  </h5>
                  <p className="text-muted mb-0 small" style={{ fontSize: 12 }}>
                    Deshabilita o silencia avisos no críticos y configura el horario de silencio nocturno para evitar molestias.
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn-close shadow-none" 
                  onClick={() => setShowPreferencesModal(false)} 
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body px-4 py-4 d-flex flex-column gap-3">
                {/* SWITCH MASTER */}
                <div className="p-3 rounded-4 border bg-light d-flex align-items-center justify-content-between gap-3">
                  <div>
                    <div className="fw-bold text-dark mb-0" style={{ fontSize: 13.5 }}>
                      Silenciar TODAS las notificaciones no críticas
                    </div>
                    <div className="text-muted small" style={{ fontSize: 11.5 }}>
                      Desactiva avisos de paso de aire, cortes preventivos y notificaciones informativas.
                    </div>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input cursor-pointer"
                      id="master-mute-switch"
                      checked={muteNonCritical}
                      onChange={(e) => setMuteNonCritical(e.target.checked)}
                      style={{ width: "2.8em", height: "1.4em" }}
                    />
                  </div>
                </div>

                <hr className="my-1 text-muted" style={{ opacity: 0.15 }} />

                <div className="fw-semibold text-muted small uppercase" style={{ fontSize: 11, letterSpacing: 0.5 }}>
                  CONFIGURACIÓN POR TIPO DE EVENTO
                </div>

                {/* OPCIÓN: PASO DE AIRE */}
                <div className="d-flex align-items-center justify-content-between gap-3 p-2">
                  <div>
                    <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>
                      🌬️ Eventos de Paso de Aire
                    </div>
                    <div className="text-muted small" style={{ fontSize: 11.5 }}>
                      Fluctuaciones de presión o aire atrapado en tuberías.
                    </div>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input cursor-pointer"
                      checked={muteAir || muteNonCritical}
                      disabled={muteNonCritical}
                      onChange={(e) => setMuteAir(e.target.checked)}
                      style={{ width: "2.5em", height: "1.25em" }}
                    />
                  </div>
                </div>

                {/* OPCIÓN: CORTES PREVENTIVOS */}
                <div className="d-flex align-items-center justify-content-between gap-3 p-2">
                  <div>
                    <div className="fw-semibold text-dark" style={{ fontSize: 13 }}>
                      🛡️ Avisos de Cortes Preventivos
                    </div>
                    <div className="text-muted small" style={{ fontSize: 11.5 }}>
                      Anuncios programados de mantenimientos en la zona.
                    </div>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      type="checkbox"
                      className="form-check-input cursor-pointer"
                      checked={muteCuts || muteNonCritical}
                      disabled={muteNonCritical}
                      onChange={(e) => setMuteCuts(e.target.checked)}
                      style={{ width: "2.5em", height: "1.25em" }}
                    />
                  </div>
                </div>

                {/* OPCIÓN: FUGAS GRAVES (PROTEGIDA) */}
                <div className="d-flex align-items-center justify-content-between gap-3 p-3 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25">
                  <div>
                    <div className="fw-bold text-danger" style={{ fontSize: 13 }}>
                      🚨 Alertas de Fuga Grave / Fuga Silenciosa
                    </div>
                    <div className="text-muted small" style={{ fontSize: 11.5 }}>
                      Protección crítica del hogar. Estas notificaciones permanecen activas siempre por seguridad hídrica.
                    </div>
                  </div>
                  <span className="badge bg-danger text-white px-2.5 py-1" style={{ fontSize: 10 }}>
                    Protegido
                  </span>
                </div>

                <hr className="my-1 text-muted" style={{ opacity: 0.15 }} />

                {/* HISTORIA DE USUARIO 17 (RF5): HORARIO DE SILENCIO NOCTURNO */}
                <div className="p-3 rounded-4 border bg-light">
                  <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <Moon size={18} className="text-primary" />
                      <div>
                        <div className="fw-bold text-dark mb-0" style={{ fontSize: 13.5 }}>
                          Horario de Silencio Nocturno (Modo No Molestar)
                        </div>
                        <div className="text-muted small" style={{ fontSize: 11.5 }}>
                          Desactiva sonidos de alerta en la noche sin dejar de registrar eventos.
                        </div>
                      </div>
                    </div>
                    <div className="form-check form-switch mb-0">
                      <input
                        type="checkbox"
                        className="form-check-input cursor-pointer"
                        checked={nightSilenceEnabled}
                        onChange={(e) => setNightSilenceEnabled(e.target.checked)}
                        style={{ width: "2.6em", height: "1.3em" }}
                      />
                    </div>
                  </div>

                  {nightSilenceEnabled && (
                    <div className="mt-3 pt-2 border-top">
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label text-muted small mb-1" style={{ fontSize: 11 }}>Silenciar desde:</label>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={silentFrom}
                            onChange={(e) => setSilentFrom(e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-muted small mb-1" style={{ fontSize: 11 }}>Silenciar hasta:</label>
                          <input
                            type="time"
                            className="form-control form-control-sm"
                            value={silentTo}
                            onChange={(e) => setSilentTo(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="text-muted small p-2 bg-white rounded-3 border" style={{ fontSize: 11, lineHeight: 1.4 }}>
                        ℹ️ <strong>Registro continuo:</strong> Durante este horario ({silentFrom} a {silentTo}), las alertas no emitirán sonidos, pero <strong>todos los eventos continuarán registrándose</strong> normalmente en el historial telemétrico.
                      </div>
                    </div>
                  )}
                </div>

                {preferencesSavedMsg && (
                  <div className="alert alert-success border-0 py-2 px-3 mb-0 rounded-3 text-center small fw-semibold">
                    <Check size={16} className="me-1" /> {preferencesSavedMsg}
                  </div>
                )}
              </div>

              <div className="modal-footer border-top pt-3 pb-4 px-4 d-flex gap-2 justify-content-end" style={{ borderColor: "var(--header-border)" }}>
                <button 
                  type="button" 
                  className="btn btn-light px-4 py-2 rounded-3 fw-medium text-secondary" 
                  onClick={() => setShowPreferencesModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary px-4 py-2 rounded-3 fw-semibold text-white d-flex align-items-center gap-1" 
                  onClick={handleSavePreferences}
                >
                  <Check size={16} />
                  Guardar Preferencias
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cierre de Válvula */}
      {showConfirmCloseModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--header-border)" }}>
              <div className="modal-header border-bottom-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ color: "var(--text)" }}>
                  <AlertTriangle size={24} className="text-warning" />
                  Confirmar Cierre de Emergencia
                </h5>
                <button 
                  type="button" 
                  className="btn-close shadow-none" 
                  onClick={() => setShowConfirmCloseModal(false)} 
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body px-4 py-3">
                <p className="text-muted mb-0" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
                  ¿Estás seguro de que deseas <strong>cerrar la electroválvula de emergencia</strong>? 
                  Esto cortará el flujo de agua inmediatamente para mitigar el incidente de seguridad hídrica.
                </p>
              </div>
              <div className="modal-footer border-top-0 pt-0 pb-4 px-4 d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-light px-4 py-2 rounded-3 fw-medium text-secondary" onClick={() => setShowConfirmCloseModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-danger px-4 py-2 rounded-3 fw-semibold text-white" onClick={confirmCloseValve}>
                  Sí, Cerrar Válvula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE PLAN DE PREPARACIÓN / CONTINGENCIA (HU 14 - RF6) */}
      {showContingencyModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden" style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--header-border)" }}>
              <div className="modal-header border-bottom pb-3 pt-4 px-4 d-flex justify-content-between align-items-center" style={{ borderColor: "var(--header-border)" }}>
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-1" style={{ color: "var(--text)" }}>
                    <ClipboardList size={22} className="text-warning-emphasis" />
                    Plan de Preparación ante Corte de Agua
                  </h5>
                  <p className="text-muted mb-0 small" style={{ fontSize: 12 }}>
                    {userRole === "COMERCIO" 
                      ? "Plan de contingencia comercial para garantizar la operatividad de tu negocio durante el corte programado." 
                      : "Checklist preventivo para asegurar el abastecimiento e higiene del hogar."}
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn-close shadow-none" 
                  onClick={() => setShowContingencyModal(false)} 
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body px-4 py-4 d-flex flex-column gap-3">
                {/* TARJETA INFORMATIVA DE VOLUMEN RECOMENDADO */}
                <div className="p-3 rounded-4 bg-warning bg-opacity-10 border border-warning border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-3">
                    <Droplets size={24} className="text-warning-emphasis" />
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: 13.5 }}>
                        Reserva Recomendada para Perfil {userRole}:
                      </div>
                      <div className="text-muted small" style={{ fontSize: 12 }}>
                        {userRole === "COMERCIO" 
                          ? "Almacenar 450 Litros en recipientes o tanques limpios antes de las 08:00 a.m." 
                          : "Almacenar 120 Litros para necesidades esenciales del hogar."}
                      </div>
                    </div>
                  </div>
                  <span className="badge bg-warning text-dark px-3 py-2 fw-bold" style={{ fontSize: 13 }}>
                    {userRole === "COMERCIO" ? "450 L Sugeridos" : "120 L Sugeridos"}
                  </span>
                </div>

                <div className="fw-semibold text-muted small uppercase mt-2" style={{ fontSize: 11, letterSpacing: 0.5 }}>
                  CHECKLIST DE ACCIONES PREVENTIVAS
                </div>

                {/* ITEM 1 */}
                <div 
                  className="p-3 rounded-3 border d-flex align-items-center justify-content-between gap-3 cursor-pointer transition-all"
                  onClick={() => handleToggleChecklist("fillTank")}
                  style={{ background: checklistState.fillTank ? "rgba(34, 197, 94, 0.05)" : "var(--surface)", borderColor: checklistState.fillTank ? "#22c55e" : "var(--header-border)" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    {checklistState.fillTank ? <CheckSquare className="text-success" size={22} /> : <Square className="text-muted" size={22} />}
                    <div>
                      <div className={`fw-bold ${checklistState.fillTank ? "text-success text-decoration-line-through" : "text-dark"}`} style={{ fontSize: 13.5 }}>
                        1. Llenar reservorio principal / tanques elevados
                      </div>
                      <div className="text-muted small" style={{ fontSize: 11.5 }}>
                        Asegurarse de que el cisterna o tanque del inmueble esté al 100% antes del horario de corte.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ITEM 2 */}
                <div 
                  className="p-3 rounded-3 border d-flex align-items-center justify-content-between gap-3 cursor-pointer transition-all"
                  onClick={() => handleToggleChecklist("storeWater")}
                  style={{ background: checklistState.storeWater ? "rgba(34, 197, 94, 0.05)" : "var(--surface)", borderColor: checklistState.storeWater ? "#22c55e" : "var(--header-border)" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    {checklistState.storeWater ? <CheckSquare className="text-success" size={22} /> : <Square className="text-muted" size={22} />}
                    <div>
                      <div className={`fw-bold ${checklistState.storeWater ? "text-success text-decoration-line-through" : "text-dark"}`} style={{ fontSize: 13.5 }}>
                        2. Almacenar agua potable en recipientes cerrados
                      </div>
                      <div className="text-muted small" style={{ fontSize: 11.5 }}>
                        Para consumo directo, cocción e higiene básica durante las 6 horas programadas.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ITEM 3 */}
                <div 
                  className="p-3 rounded-3 border d-flex align-items-center justify-content-between gap-3 cursor-pointer transition-all"
                  onClick={() => handleToggleChecklist("notifyTeam")}
                  style={{ background: checklistState.notifyTeam ? "rgba(34, 197, 94, 0.05)" : "var(--surface)", borderColor: checklistState.notifyTeam ? "#22c55e" : "var(--header-border)" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    {checklistState.notifyTeam ? <CheckSquare className="text-success" size={22} /> : <Square className="text-muted" size={22} />}
                    <div>
                      <div className={`fw-bold ${checklistState.notifyTeam ? "text-success text-decoration-line-through" : "text-dark"}`} style={{ fontSize: 13.5 }}>
                        3. {userRole === "COMERCIO" ? "Notificar al personal del negocio y ajustar atención" : "Notificar a todos los miembros de la vivienda"}
                      </div>
                      <div className="text-muted small" style={{ fontSize: 11.5 }}>
                        {userRole === "COMERCIO" ? "Avisar al equipo de cocina/atención sobre el uso racional de la reserva." : "Informar sobre el horario de restricción a los miembros de la familia."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ITEM 4 */}
                <div 
                  className="p-3 rounded-3 border d-flex align-items-center justify-content-between gap-3 cursor-pointer transition-all"
                  onClick={() => handleToggleChecklist("pauseMachines")}
                  style={{ background: checklistState.pauseMachines ? "rgba(34, 197, 94, 0.05)" : "var(--surface)", borderColor: checklistState.pauseMachines ? "#22c55e" : "var(--header-border)" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    {checklistState.pauseMachines ? <CheckSquare className="text-success" size={22} /> : <Square className="text-muted" size={22} />}
                    <div>
                      <div className={`fw-bold ${checklistState.pauseMachines ? "text-success text-decoration-line-through" : "text-dark"}`} style={{ fontSize: 13.5 }}>
                        4. {userRole === "COMERCIO" ? "Pausar equipamiento crítico (Cafeteras/Lavadoras/Hielo)" : "Resguardar aparatos (Evitar encender lavadoras o lavavajillas)"}
                      </div>
                      <div className="text-muted small" style={{ fontSize: 11.5 }}>
                        Previene daños en motores por succión de aire o caídas de presión en la red telemétrica.
                      </div>
                    </div>
                  </div>
                </div>

                {contingencySavedMsg && (
                  <div className="alert alert-success border-0 py-2 px-3 mb-0 rounded-3 text-center small fw-semibold">
                    <Check size={16} className="me-1" /> {contingencySavedMsg}
                  </div>
                )}
              </div>

              <div className="modal-footer border-top pt-3 pb-4 px-4 d-flex gap-2 justify-content-end" style={{ borderColor: "var(--header-border)" }}>
                <button 
                  type="button" 
                  className="btn btn-light px-4 py-2 rounded-3 fw-medium text-secondary" 
                  onClick={() => setShowContingencyModal(false)}
                >
                  Cerrar
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning px-4 py-2 rounded-3 fw-bold text-dark d-flex align-items-center gap-1 shadow-sm border-0" 
                  onClick={handleSaveContingencyPlan}
                >
                  <Check size={16} />
                  Guardar Plan de Preparación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}