import { useState, useEffect } from "react";
import { 
  Droplets, Calendar, Shield, MapPin, Activity, 
  FileText, AlertTriangle, CheckCircle2, User, RefreshCw,
  ChevronLeft, ChevronRight, Plus, Wrench, Clock, Check
} from "lucide-react";

// Helper para parsear fechas de alertas en formato "dd/MM/yyyy HH:mm"
const parseAlertDate = (timestampStr) => {
  if (!timestampStr) return null;
  const parts = timestampStr.split(" ");
  if (parts.length > 0) {
    const dateParts = parts[0].split("/");
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // 0-indexed en JavaScript
      const year = parseInt(dateParts[2], 10);
      return new Date(year, month, day);
    }
  }
  return null;
};
import { api } from "../api/Aquasmart";
import { WaterCutAlert } from "../components/dashboard/WaterCutAlert";
import { WaterStatusCard } from "../components/dashboard/WaterStatusCard";
import { AICostProjection } from "../components/dashboard/AICostProjection";
import { useWaterData } from "../hooks/useWaterData";
import { StatCard } from "../components/ui/StatCard";

export function Dashboard() {
  const { data, loading, error, toggleValve, togglePresence, toggleAutoClose, askAI } = useWaterData();
  const [role, setRole] = useState("DOMESTICO");
  const [userName, setUserName] = useState("María Fernanda");

  // Estado para la simulación interactiva del Técnico
  const [claimStatus, setClaimStatus] = useState("Pendiente"); // Pendiente -> Aprobado
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [checklistVal1, setChecklistVal1] = useState(false);
  const [checklistVal2, setChecklistVal2] = useState(false);
  const [checklistVal3, setChecklistVal3] = useState(false);
  const [technicalAlerts, setTechnicalAlerts] = useState([
    { id: "M-101", address: "Av. Buenos Aires 124", flow: "0.0 L/min", pressure: "4.2 bar", valve: "Abierta", status: "Óptimo" },
    { id: "M-102", address: "Calle Los Próceres 452", flow: "2.1 L/min", pressure: "1.8 bar", valve: "Abierta", status: "Fuga Activa" },
    { id: "M-103", address: "Jr. Tacna 890", flow: "0.0 L/min", pressure: "0.1 bar", valve: "Cerrada", status: "Cierre Manual" },
  ]);

  // Estado para la simulación interactiva del Gestor Municipal
  const [streetLeaks, setStreetLeaks] = useState([
    { id: 1, location: "Calle Los Próceres - Cdra 4", size: "Grande", status: "En reparación", crew: "Sedapal Cuadrilla B" },
    { id: 2, location: "Av. Buenos Aires - Lote 12", size: "Mediana", status: "Asfaltado pendiente", crew: "Municipio Obras" },
  ]);
  const [newLeakLocation, setNewLeakLocation] = useState("");

  // Estados e integraciones para la base de datos relacional de PostgreSQL
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 4)); // Default to June 2026
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 5, 4));
  const [newLeakType, setNewLeakType] = useState("Fuga");
  const [techViewMode, setTechViewMode] = useState("kanban"); // "kanban" | "calendar"
  const [filterByDate, setFilterByDate] = useState(true);
  const [showCalendar, setShowCalendar] = useState(true);

  const loadAlertsFromDb = async () => {
    try {
      const response = await api.getAlerts();
      if (Array.isArray(response)) {
        setAlerts(response);
      }
    } catch (e) {
      console.error("Error al cargar alertas de la base de datos", e);
    }
  };

  const loadMedidoresFromDb = async () => {
    try {
      const response = await api.getMedidores();
      if (Array.isArray(response)) {
        setTechnicalAlerts(response);
      }
    } catch (e) {
      console.error("Error al cargar medidores de la base de datos", e);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setAlertsLoading(true);
      await api.updateAlertStatus(id, status);
      await loadAlertsFromDb();
    } catch (e) {
      console.error("Error al actualizar el estado de la alerta", e);
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleSimulateLeak = async () => {
    try {
      setAlertsLoading(true);
      await api.reportMunicipalLeak("Av. Puente Piedra Cdra 5 (Simulación Automatizada UTP)");
      window.location.reload();
    } catch (err) {
      console.error("Error al simular fuga hídrica", err);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem("userRole") || "DOMESTICO";
    const name = localStorage.getItem("userFullName") || "María Fernanda";
    setRole(userRole);
    setUserName(name.split(" ")[0]);

    if (userRole === "TECNICO" || userRole === "MUNICIPAL") {
      void loadAlertsFromDb();
    }
    if (userRole === "TECNICO") {
      void loadMedidoresFromDb();
    }
  }, []);

  // Periodically refresh database alerts & medidores for technicians/municipal managers without spamming
  useEffect(() => {
    const userRole = localStorage.getItem("userRole") || "DOMESTICO";
    if (userRole !== "TECNICO" && userRole !== "MUNICIPAL") return;

    const interval = setInterval(() => {
      if (userRole === "TECNICO" || userRole === "MUNICIPAL") {
        void loadAlertsFromDb();
      }
      if (userRole === "TECNICO") {
        void loadMedidoresFromDb();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-fill align-items-center justify-content-center text-muted min-vh-100">
        <div className="text-center">
          <RefreshCw size={40} className="text-primary spin mb-2" />
          <p className="mb-0">Cargando telemetría e IA en vivo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-fill align-items-center justify-content-center text-danger min-vh-100">
        <div className="text-center">
          <AlertTriangle size={40} className="mb-2" />
          <p className="mb-0">Error al conectar con la base de datos: {error}</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: VECINO DOMÉSTICO & COMERCIO
  // ==========================================
  if (role === "DOMESTICO" || role === "COMERCIO") {
    return (
      <main className="flex-fill overflow-auto p-3 p-md-4">
        {/* Banner de alerta de corte preventivo */}
        <WaterCutAlert alert={data.alert} />

        {/* Nota contextual si es Comercio (Luis Condori) */}
        {role === "COMERCIO" && (
          <div 
            className="alert border-0 rounded-4 p-3 mb-4 d-flex align-items-start gap-3"
            style={{
              background: "rgba(139, 92, 246, 0.15)",
              border: "1px solid rgba(139, 92, 246, 0.25)",
            }}
          >
            <div className="rounded-3 p-2 bg-purple text-purple d-flex align-items-center justify-content-center" style={{ color: "#8b5cf6", backgroundColor: "rgba(139, 92, 246, 0.1)" }}>
              <Shield size={22} />
            </div>
            <div>
              <h6 className="fw-bold mb-1" style={{ color: "#7c3aed" }}>
                🛡️ Modo Comercial Activo: Protección de Lavandería (Luis Condori)
              </h6>
              <p className="mb-0 text-muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                El algoritmo de seguridad monitorea el caudal de tus máquinas lavadoras. Si detecta entrada de aire tras un corte programado de Sedapal, bloqueará de forma automática la electroválvula para evitar la entrada de sedimentos o quemado de las bombas de agua.
              </p>
            </div>
          </div>
        )}

        <div className="row g-4">
          {/* Card de telemetría y control */}
          <div className="col-12 col-lg-6">
            <WaterStatusCard
              data={data}
              onToggleValve={toggleValve}
              onTogglePresence={togglePresence}
              onToggleAutoClose={toggleAutoClose}
            />
          </div>

          {/* Gráfico Recharts de Proyección de Costos de IA */}
          <div className="col-12 col-lg-6">
            <AICostProjection
              projection={data.aiProjection}
              onAskAI={(q) => void askAI(q)}
            />
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 2: TÉCNICO DE CAMPO SEDAPAL (CARLOS MENDOZA)
  // ==========================================
  if (role === "TECNICO") {
    // Filtrar alertas para el tablero Kanban según el estado del filtro de fecha
    const isSameDate = (alertDate, targetDate) => {
      if (!alertDate || !targetDate) return false;
      return alertDate.getDate() === targetDate.getDate() &&
             alertDate.getMonth() === targetDate.getMonth() &&
             alertDate.getFullYear() === targetDate.getFullYear();
    };

    const filteredAlerts = alerts.filter(alert => {
      if (!filterByDate) return true;
      const alertDate = parseAlertDate(alert.timestamp);
      return isSameDate(alertDate, selectedDate);
    });

    const backlogAlerts = filteredAlerts.filter(a => a.state === "Pendiente" || a.state === "Activa");
    const inProgressAlerts = filteredAlerts.filter(a => a.state === "En Proceso" || a.state === "En reparación");
    const inReviewAlerts = filteredAlerts.filter(a => a.state === "En Revisión");
    const doneAlerts = filteredAlerts.filter(a => a.state === "Cumplido" || a.state === "Resuelta" || a.state === "Cerrada" || a.state === "Fallado" || a.state === "Rechazado");

    // Obtener alerta seleccionada o por defecto la primera
    let selectedAlert = filteredAlerts.find(a => a.id === selectedAlertId);
    if (!selectedAlert && filteredAlerts.length > 0) {
      selectedAlert = filteredAlerts[0];
    } else if (!selectedAlert && alerts.length > 0) {
      selectedAlert = alerts[0];
    }

    const updateTechAlertStatus = async (id, newStatus) => {
      await handleUpdateStatus(id, newStatus);
      // Resetear checklist interactivo al cambiar estado
      setChecklistVal1(false);
      setChecklistVal2(false);
      setChecklistVal3(false);
      void loadMedidoresFromDb();
    };

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    // Calendar Calculations
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday = 0
    const firstDayOfWeek = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Monday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const handlePrevMonth = () => {
      setCurrentMonth(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
      setCurrentMonth(new Date(year, month + 1, 1));
    };

    const getEventsForDate = (date) => {
      const dStr = date.getDate();
      const mStr = date.getMonth();
      const yStr = date.getFullYear();

      return alerts.filter((alert) => {
        const alertDate = parseAlertDate(alert.timestamp);
        if (!alertDate) return false;
        return alertDate.getDate() === dStr &&
               alertDate.getMonth() === mStr &&
               alertDate.getFullYear() === yStr;
      });
    };

    const formattedSelectedDate = selectedDate.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });

    // Build calendar grid cells
    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDay = prevTotalDays - firstDayOfWeek + i + 1;
      cells.push(
        <div 
          key={`pad-${i}`} 
          className="text-center d-flex align-items-center justify-content-center text-muted opacity-25 rounded-3" 
          style={{ 
            minHeight: "44px", 
            border: "1px solid var(--header-border)",
            fontSize: "11px",
            backgroundColor: "var(--surface-soft)"
          }}
        >
          {prevDay}
        </div>
      );
    }

    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(year, month, d);
      const dayEvents = getEventsForDate(cellDate);
      const isSelected = selectedDate && 
                        selectedDate.getDate() === d && 
                        selectedDate.getMonth() === month && 
                        selectedDate.getFullYear() === year;

      const isToday = new Date().getDate() === d && 
                      new Date().getMonth() === month && 
                      new Date().getFullYear() === year;

      const hasBacklog = dayEvents.some(e => e.state === "Pendiente" || e.state === "Activa");
      const hasInProgress = dayEvents.some(e => e.state === "En Proceso" || e.state === "En reparación");
      const hasInReview = dayEvents.some(e => e.state === "En Revisión");
      const hasDone = dayEvents.some(e => e.state === "Cumplido" || e.state === "Resuelta" || e.state === "Cerrada");

      cells.push(
        <button
          key={`day-${d}`}
          type="button"
          onClick={() => {
            setSelectedDate(cellDate);
            setFilterByDate(true);
          }}
          className="btn p-0 d-flex flex-column justify-content-between align-items-center rounded-3 position-relative"
          style={{
            minHeight: "44px",
            width: "100%",
            border: isSelected ? "2.5px solid var(--primary)" : "1px solid var(--header-border)",
            backgroundColor: isSelected 
              ? "color-mix(in srgb, var(--primary) 12%, transparent)" 
              : isToday 
                ? "color-mix(in srgb, var(--primary) 6%, var(--surface-soft))"
                : "var(--surface)",
            boxShadow: isSelected ? "0 4px 10px rgba(59, 130, 246, 0.15)" : "none",
            transform: isSelected ? "scale(1.02)" : "none",
            transition: "all 0.1s ease",
            zIndex: isSelected ? 2 : 1
          }}
        >
          <span 
            className={`small fw-bold m-1 ${isToday ? "text-primary px-1 py-0.5 rounded-circle bg-primary-subtle" : ""}`} 
            style={{ 
              fontSize: "11px",
              color: isToday ? "var(--primary)" : "var(--text)"
            }}
          >
            {d}
          </span>
          <div className="d-flex gap-1 justify-content-center mb-1 w-100 px-1">
            {hasBacklog && (
              <span className="rounded-circle animate-pulse" style={{ width: 5, height: 5, backgroundColor: "#ef4444" }} title="Pendiente" />
            )}
            {hasInProgress && (
              <span className="rounded-circle animate-pulse" style={{ width: 5, height: 5, backgroundColor: "#fbbf24" }} title="En Proceso" />
            )}
            {hasInReview && (
              <span className="rounded-circle" style={{ width: 5, height: 5, backgroundColor: "#3b82f6" }} title="En Auditoría" />
            )}
            {hasDone && (
              <span className="rounded-circle" style={{ width: 5, height: 5, backgroundColor: "#22c55e" }} title="Completado" />
            )}
          </div>
        </button>
      );
    }

    return (
      <main className="flex-fill overflow-auto p-3 p-md-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Encabezado */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: "var(--text)" }}>Panel de Auditoría Técnica de Campo</h4>
            <p className="text-muted mb-0 small" style={{ fontSize: 13 }}>
              Técnico asignado: <strong>Carlos Mendoza</strong> | Distrito: Puente Piedra
            </p>
          </div>
          <span className="badge rounded-pill bg-success px-3 py-2 fw-semibold text-white" style={{ fontSize: 11 }}>
            SECTOR OPERATIVO LIMA NORTE
          </span>
        </div>

        {/* KPIs Técnicos */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border rounded-4 p-3 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 p-2 bg-success-subtle text-success" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
                  <Activity size={24} />
                </div>
                <div>
                  <span className="text-muted d-block small" style={{ fontSize: 10.5 }}>MEDIDORES MONITOREADOS</span>
                  <h4 className="fw-bold mb-0" style={{ color: "var(--text)" }}>{data?.medidoresCount || 0} Activos</h4>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border rounded-4 p-3 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 p-2 bg-danger-subtle text-danger" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span className="text-muted d-block small" style={{ fontSize: 10.5 }}>ÓRDENES ACTIVAS</span>
                  <h4 className="fw-bold mb-0 text-danger">{backlogAlerts.length + inProgressAlerts.length + inReviewAlerts.length} Tareas</h4>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border rounded-4 p-3 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}>
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 p-2 bg-primary-subtle text-primary" style={{ backgroundColor: "rgba(37,99,235,0.1)" }}>
                  <FileText size={24} />
                </div>
                <div>
                  <span className="text-muted d-block small" style={{ fontSize: 10.5 }}>QUEJAS LEGALTECH</span>
                  <h4 className="fw-bold mb-0 text-primary">{claimStatus === "Pendiente" ? "1 Pendiente" : "0 Pendientes"}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: KANBAN / CALENDARIO SPLIT SCREEN */}
        <div className="row g-4 mb-4">
          
          {/* LADO IZQUIERDO: TABLERO KANBAN O CALENDARIO (8 COLUMNAS) */}
          <div className="col-12 col-xl-8">
            <div className="d-flex flex-column gap-4">
              
              {/* Calendario de Planificación de Trabajo (Colapsable y Filtrador) */}
              <div className="card border shadow-sm p-3 rounded-4" style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2 pb-2 border-bottom" style={{ borderColor: "var(--header-border)" }}>
                  <div className="d-flex align-items-center gap-2">
                    <Calendar size={18} className="text-primary" />
                    <h6 className="fw-bold mb-0" style={{ color: "var(--text)", fontSize: 14.5 }}>
                      Planificador Mensual de Trabajo ({monthNames[month]} {year})
                    </h6>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {/* Botones de Mes */}
                    <div className="d-flex gap-1 me-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle p-1" onClick={handlePrevMonth} style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ChevronLeft size={13} />
                      </button>
                      <button type="button" className="btn btn-outline-secondary btn-sm rounded-circle p-1" onClick={handleNextMonth} style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                    {/* Botón Colapsar/Expandir */}
                    <button 
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="btn btn-sm btn-outline-primary px-2.5 py-1 rounded-2"
                      style={{ fontSize: 11.5 }}
                    >
                      {showCalendar ? "Colapsar Calendario" : "Mostrar Calendario"}
                    </button>
                  </div>
                </div>

                {showCalendar && (
                  <>
                    {/* Grid del Calendario */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }} className="mb-2">
                      {daysOfWeek.map((d) => (
                        <div key={d} className="text-center fw-bold py-0.5 text-muted small" style={{ fontSize: 10.5, letterSpacing: '0.5px' }}>
                          {d}
                        </div>
                      ))}
                      {cells}
                    </div>

                    {/* Leyenda del Calendario */}
                    <div className="d-flex flex-wrap gap-3 mt-2 pt-2 border-top" style={{ borderColor: "var(--header-border)", fontSize: 10.5 }}>
                      <span className="small text-muted d-flex align-items-center gap-1">
                        <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: "#ef4444" }} />
                        Pendiente
                      </span>
                      <span className="small text-muted d-flex align-items-center gap-1">
                        <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: "#fbbf24" }} />
                        En Proceso
                      </span>
                      <span className="small text-muted d-flex align-items-center gap-1">
                        <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: "#3b82f6" }} />
                        En Auditoría
                      </span>
                      <span className="small text-muted d-flex align-items-center gap-1">
                        <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: "#22c55e" }} />
                        Completado
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Tablero Kanban Sincronizado */}
              <div className="card border shadow-sm p-3 rounded-4" style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}>
                {/* Control de Filtro Kanban */}
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2 pb-2 border-bottom" style={{ borderColor: "var(--header-border)" }}>
                  <div className="d-flex align-items-center gap-2">
                    <Activity size={16} className="text-primary" />
                    <h6 className="fw-bold mb-0" style={{ color: "var(--text)", fontSize: 14 }}>
                      {filterByDate 
                        ? `Órdenes asignadas: ${formattedSelectedDate}` 
                        : "Mostrando todas las órdenes (Sin filtro)"
                      }
                    </h6>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterByDate(false)}
                      className={`btn btn-xs px-2.5 py-1 rounded-2 transition-all fw-semibold ${
                        !filterByDate ? "btn-primary text-white border-0" : "btn-outline-secondary"
                      }`}
                      style={{ fontSize: 11 }}
                    >
                      Ver todas las fechas
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterByDate(true)}
                      className={`btn btn-xs px-2.5 py-1 rounded-2 transition-all fw-semibold ${
                        filterByDate ? "btn-primary text-white border-0" : "btn-outline-secondary"
                      }`}
                      style={{ fontSize: 11 }}
                    >
                      Filtrar por calendario
                    </button>
                  </div>
                </div>

                <div className="row g-2 flex-grow-1">
                  
                  {/* COLUMNA 1: REPORTES / BACKLOG (To Do) */}
                  <div className="col-12 col-md-3">
                    <div className="rounded-4 p-2 h-100 d-flex flex-column gap-2" style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--header-border)", minHeight: "380px" }}>
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 px-1" style={{ borderColor: "var(--header-border)" }}>
                        <span className="fw-bold text-muted small" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: "4px" }}>
                          <FileText size={12} />
                          COLA DE REPORTES
                        </span>
                        <span className="badge bg-danger rounded-pill text-white" style={{ fontSize: 9.5 }}>{backlogAlerts.length}</span>
                      </div>
                      <div className="d-flex flex-column gap-2 overflow-auto px-1 flex-grow-1" style={{ maxHeight: "350px" }}>
                        {backlogAlerts.length > 0 ? (
                          backlogAlerts.map(alert => (
                            <div 
                              key={alert.id} 
                              onClick={() => setSelectedAlertId(alert.id)}
                              className={`card border-0 border-start border-4 border-danger rounded-3 p-2.5 shadow-sm transition-all ${
                                selectedAlert?.id === alert.id ? "border-primary" : ""
                              }`} 
                              style={{ 
                                cursor: "pointer",
                                backgroundColor: selectedAlert?.id === alert.id ? "var(--accent-surface)" : "var(--surface)",
                                border: selectedAlert?.id === alert.id ? "1px solid var(--accent-border)" : "1px solid var(--header-border)"
                              }}
                            >
                              <div className="fw-bold mb-1" style={{ fontSize: 11, color: "var(--text)" }}>#{alert.id} - {alert.type || "Reporte"}</div>
                              <p className="text-muted mb-2 small text-truncate-2" style={{ fontSize: 10, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {alert.message}
                              </p>
                              <div className="text-muted small" style={{ fontSize: 9 }}>🕒 {alert.timestamp || "Reciente"}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted small py-4 rounded-3 border border-dashed" style={{ backgroundColor: "var(--surface)" }}>
                            Sin órdenes.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* COLUMNA 2: EN PROCESO (In Progress) */}
                  <div className="col-12 col-md-3">
                    <div className="rounded-4 p-2 h-100 d-flex flex-column gap-2" style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--header-border)", minHeight: "380px" }}>
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 px-1" style={{ borderColor: "var(--header-border)" }}>
                        <span className="fw-bold text-muted small" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: "4px" }}>
                          <Wrench size={12} />
                          EN PROCESO
                        </span>
                        <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: 9.5 }}>{inProgressAlerts.length}</span>
                      </div>
                      <div className="d-flex flex-column gap-2 overflow-auto px-1 flex-grow-1" style={{ maxHeight: "350px" }}>
                        {inProgressAlerts.length > 0 ? (
                          inProgressAlerts.map(alert => (
                            <div 
                              key={alert.id} 
                              onClick={() => setSelectedAlertId(alert.id)}
                              className={`card border-0 border-start border-4 border-warning rounded-3 p-2.5 shadow-sm transition-all ${
                                selectedAlert?.id === alert.id ? "border-primary" : ""
                              }`} 
                              style={{ 
                                cursor: "pointer",
                                backgroundColor: selectedAlert?.id === alert.id ? "var(--accent-surface)" : "var(--surface)",
                                border: selectedAlert?.id === alert.id ? "1px solid var(--accent-border)" : "1px solid var(--header-border)"
                              }}
                            >
                              <div className="fw-bold mb-1" style={{ fontSize: 11, color: "var(--text)" }}>#{alert.id} - {alert.type || "Reparación"}</div>
                              <p className="text-muted mb-2 small text-truncate-2" style={{ fontSize: 10, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {alert.message}
                              </p>
                              <div className="text-muted small" style={{ fontSize: 9 }}>🕒 {alert.timestamp || "Reciente"}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted small py-4 rounded-3 border border-dashed" style={{ backgroundColor: "var(--surface)" }}>
                            Sin órdenes.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* COLUMNA 3: AUDITORÍA (In Review) */}
                  <div className="col-12 col-md-3">
                    <div className="rounded-4 p-2 h-100 d-flex flex-column gap-2" style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--header-border)", minHeight: "380px" }}>
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 px-1" style={{ borderColor: "var(--header-border)" }}>
                        <span className="fw-bold text-muted small" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: "4px" }}>
                          <Shield size={12} />
                          AUDITORÍA
                        </span>
                        <span className="badge bg-info text-dark rounded-pill" style={{ fontSize: 9.5 }}>{inReviewAlerts.length}</span>
                      </div>
                      <div className="d-flex flex-column gap-2 overflow-auto px-1 flex-grow-1" style={{ maxHeight: "350px" }}>
                        {inReviewAlerts.length > 0 ? (
                          inReviewAlerts.map(alert => (
                            <div 
                              key={alert.id} 
                              onClick={() => setSelectedAlertId(alert.id)}
                              className={`card border-0 border-start border-4 border-info rounded-3 p-2.5 shadow-sm transition-all ${
                                selectedAlert?.id === alert.id ? "border-primary" : ""
                              }`} 
                              style={{ 
                                cursor: "pointer",
                                backgroundColor: selectedAlert?.id === alert.id ? "var(--accent-surface)" : "var(--surface)",
                                border: selectedAlert?.id === alert.id ? "1px solid var(--accent-border)" : "1px solid var(--header-border)"
                              }}
                            >
                              <div className="fw-bold mb-1" style={{ fontSize: 11, color: "var(--text)" }}>#{alert.id} - {alert.type || "Auditoría"}</div>
                              <p className="text-muted mb-2 small text-truncate-2" style={{ fontSize: 10, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {alert.message}
                              </p>
                              <div className="text-muted small" style={{ fontSize: 9 }}>🕒 {alert.timestamp || "Reciente"}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted small py-4 rounded-3 border border-dashed" style={{ backgroundColor: "var(--surface)" }}>
                            Sin órdenes.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* COLUMNA 4: COMPLETADAS (Done) */}
                  <div className="col-12 col-md-3">
                    <div className="rounded-4 p-2 h-100 d-flex flex-column gap-2" style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--header-border)", minHeight: "380px" }}>
                      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 px-1" style={{ borderColor: "var(--header-border)" }}>
                        <span className="fw-bold text-muted small" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={12} />
                          COMPLETADAS
                        </span>
                        <span className="badge bg-success rounded-pill text-white" style={{ fontSize: 9.5 }}>{doneAlerts.length}</span>
                      </div>
                      <div className="d-flex flex-column gap-2 overflow-auto px-1 flex-grow-1" style={{ maxHeight: "350px" }}>
                        {doneAlerts.length > 0 ? (
                          doneAlerts.map(alert => (
                            <div 
                              key={alert.id} 
                              onClick={() => setSelectedAlertId(alert.id)}
                              className={`card border-0 border-start border-4 border-success rounded-3 p-2.5 shadow-sm transition-all ${
                                selectedAlert?.id === alert.id ? "border-primary" : ""
                              }`} 
                              style={{ 
                                cursor: "pointer",
                                backgroundColor: selectedAlert?.id === alert.id ? "var(--accent-surface)" : "var(--surface)",
                                border: selectedAlert?.id === alert.id ? "1px solid var(--accent-border)" : "1px solid var(--header-border)"
                              }}
                            >
                              <div className="fw-bold mb-1" style={{ fontSize: 11, color: "var(--text)" }}>#{alert.id} - {alert.type}</div>
                              <p className="text-muted mb-2 small text-truncate-2" style={{ fontSize: 10, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {alert.message}
                              </p>
                              <div className="text-muted small" style={{ fontSize: 9 }}>🕒 {alert.timestamp || "Reciente"}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted small py-4 rounded-3 border border-dashed" style={{ backgroundColor: "var(--surface)" }}>
                            Sin órdenes.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* LADO DERECHO: INSPECTOR DE TICKET & AUDITORÍA LEGALTECH (4 COLUMNAS) */}
          <div className="col-12 col-xl-4">
            {selectedAlert ? (
              <div className="card border rounded-4 p-4 shadow-sm h-100 d-flex flex-column" style={{ background: "var(--surface)", borderColor: "var(--header-border)", minHeight: "500px" }}>
                {/* Cabecera del Inspector */}
                <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3" style={{ borderColor: "var(--header-border)" }}>
                  <div>
                    <span className="text-muted small d-block">INSPECTOR JIRA</span>
                    <h5 className="fw-bold mb-0 text-primary">OT-{selectedAlert.id}</h5>
                  </div>
                  <span className={`badge px-3 py-2 rounded-pill fw-bold ${
                    selectedAlert.state === "Pendiente" || selectedAlert.state === "Activa" ? "bg-danger text-white" :
                    selectedAlert.state === "En Proceso" || selectedAlert.state === "En reparación" ? "bg-warning text-dark" :
                    selectedAlert.state === "En Revisión" ? "bg-info text-dark" : "bg-success text-white"
                  }`} style={{ fontSize: 11 }}>
                    {selectedAlert.state}
                  </span>
                </div>

                {/* Detalles de la Alerta */}
                <div className="mb-4 flex-grow-1">
                  <div className="mb-3">
                    <span className="text-muted small d-block">TIPO DE ANOMALÍA</span>
                    <strong style={{ fontSize: 13, color: "var(--text)" }}>{selectedAlert.type || "Reporte General"}</strong>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-muted small d-block">FECHA Y HORA REGISTRADA</span>
                    <span className="d-flex align-items-center gap-1.5" style={{ fontSize: 13, color: "var(--text)" }}>
                      <Clock size={14} className="text-muted" />
                      {selectedAlert.timestamp || "Reciente"}
                    </span>
                  </div>

                  <div className="mb-3">
                    <span className="text-muted small d-block">DESCRIPCIÓN DE LA ANOMALÍA</span>
                    <p className="bg-light p-2.5 rounded-3 mb-0 text-muted" style={{ fontSize: 12.5, lineHeight: 1.4, border: "1px solid var(--header-border)", backgroundColor: "var(--surface-soft)" }}>
                      {selectedAlert.message || selectedAlert.description}
                    </p>
                  </div>

                  <hr style={{ borderColor: "var(--header-border)" }} />

                  {/* WORKFLOW DE TRANSICIÓN */}
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-1.5" style={{ fontSize: 13, color: "var(--text)" }}>
                    <Shield size={16} className="text-primary" />
                    Workflow de Resolución
                  </h6>

                  {/* ESTADO PENDIENTE */}
                  {(selectedAlert.state === "Pendiente" || selectedAlert.state === "Activa") && (
                    <div className="p-3 rounded-4" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                      <button
                        type="button"
                        onClick={() => void updateTechAlertStatus(selectedAlert.id, "En Proceso")}
                        className="btn btn-warning w-100 rounded-3 py-2 fw-semibold text-dark d-flex align-items-center justify-content-center gap-2"
                        style={{ fontSize: 12.5 }}
                      >
                        <Wrench size={14} />
                        Iniciar Reparación en Campo
                      </button>
                    </div>
                  )}

                  {/* ESTADO EN PROCESO */}
                  {(selectedAlert.state === "En Proceso" || selectedAlert.state === "En reparación") && (
                    <div className="p-3 rounded-4" style={{ backgroundColor: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
                      <button
                        type="button"
                        onClick={() => void updateTechAlertStatus(selectedAlert.id, "En Revisión")}
                        className="btn btn-info w-100 rounded-3 py-2 fw-semibold text-dark d-flex align-items-center justify-content-center gap-2"
                        style={{ fontSize: 12.5 }}
                      >
                        <Shield size={14} />
                        Enviar a Auditoría LegalTech
                      </button>
                    </div>
                  )}

                  {/* ESTADO EN REVISIÓN (AUDITORÍA LEGALTECH) */}
                  {selectedAlert.state === "En Revisión" && (
                    <div className="p-3 rounded-4 border-primary bg-light bg-opacity-40" style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--accent-border)" }}>
                      <div className="mb-2">
                        <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 mb-2" style={{ fontSize: 9.5 }}>Expediente Técnico Digital</span>
                        <h6 className="fw-bold mb-1" style={{ fontSize: 13, color: "var(--text)" }}>María Fernanda Quispe Rojas</h6>
                      </div>

                      {/* Lista Interactiva de Checklist */}
                      <div className="mb-3">
                        <div className="d-flex flex-column gap-2" style={{ fontSize: 12 }}>
                          <label className="d-flex align-items-start gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="form-check-input mt-0.5"
                              checked={checklistVal1} 
                              onChange={(e) => setChecklistVal1(e.target.checked)} 
                          />
                            <span className={checklistVal1 ? "text-success text-decoration-line-through fw-semibold" : "text-muted"}>
                              Validar corte programado
                            </span>
                          </label>
                          <label className="d-flex align-items-start gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="form-check-input mt-0.5"
                              checked={checklistVal2} 
                              onChange={(e) => setChecklistVal2(e.target.checked)} 
                            />
                            <span className={checklistVal2 ? "text-success text-decoration-line-through fw-semibold" : "text-muted"}>
                              Correlacionar telemetría
                            </span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void updateTechAlertStatus(selectedAlert.id, "Cumplido");
                          setClaimStatus("Aprobado");
                        }}
                        disabled={!(checklistVal1 && checklistVal2)}
                        className="btn btn-success w-100 rounded-3 py-2 fw-semibold text-white d-flex align-items-center justify-content-center gap-2"
                        style={{ fontSize: 12.5 }}
                      >
                        <CheckCircle2 size={16} />
                        Validar y Aprobar
                      </button>
                    </div>
                  )}

                  {/* ESTADO CUMPLIDO / COMPLETADAS */}
                  {(selectedAlert.state === "Cumplido" || selectedAlert.state === "Resuelta" || selectedAlert.state === "Cerrada") && (
                    <div className="p-3 rounded-4 text-center" style={{ backgroundColor: "rgba(34, 197, 94, 0.05)", border: "1px solid rgba(34, 197, 94, 0.15)" }}>
                      <div className="d-flex justify-content-center mb-2">
                        <CheckCircle2 size={40} className="text-success" />
                      </div>
                      <h6 className="fw-bold text-success mb-1" style={{ fontSize: 13.5 }}>Expediente Concluido</h6>
                      <button
                        type="button"
                        onClick={() => {
                          void updateTechAlertStatus(selectedAlert.id, "En Proceso");
                          setClaimStatus("Pendiente");
                        }}
                        className="btn btn-outline-secondary w-100 rounded-3 py-1.5 fw-semibold d-flex align-items-center justify-content-center gap-2"
                        style={{ fontSize: 11.5 }}
                      >
                        <RefreshCw size={14} />
                        Reabrir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card border rounded-4 p-4 shadow-sm h-100 d-flex flex-column align-items-center justify-content-center text-center text-muted" style={{ background: "var(--surface)", borderColor: "var(--header-border)", minHeight: "500px" }}>
                <FileText size={48} className="mb-3 text-muted" />
                <h6 className="fw-bold mb-1">Inspector de Órdenes</h6>
              </div>
            )}
          </div>
          
        </div>

        {/* SECCIÓN TELEMETRÍA - MEDIDORES EN LÍNEA */}
        <div className="card border rounded-4 p-4 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}>
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: "var(--text)" }}>
            <Activity size={20} className="text-primary" />
            Vigilancia en Línea (Sensores de Red de Puente Piedra)
          </h5>
          <div className="row g-3">
            {technicalAlerts.map((meter) => (
              <div key={meter.id} className="col-12 col-md-4">
                <div className="p-3 rounded-4" style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--header-border)" }}>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold" style={{ fontSize: 13.5, color: "var(--text)" }}>{meter.id}</span>
                    <span className={`badge ${meter.status === "Óptimo" ? "bg-success" : meter.status === "Fuga Activa" ? "bg-danger animate-pulse" : "bg-secondary"}`} style={{ fontSize: 9.5 }}>
                      {meter.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 3: GESTOR MUNICIPAL (ALEXIS MAZA)
  // ==========================================
  if (role === "MUNICIPAL") {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    // Calendar Calculations
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday = 0
    const firstDayOfWeek = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Monday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const handlePrevMonth = () => {
      setCurrentMonth(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
      setCurrentMonth(new Date(year, month + 1, 1));
    };

    const getEventsForDate = (date) => {
      const dStr = date.getDate();
      const mStr = date.getMonth();
      const yStr = date.getFullYear();

      return alerts.filter((alert) => {
        const alertDate = parseAlertDate(alert.timestamp);
        if (!alertDate) return false;
        return alertDate.getDate() === dStr &&
               alertDate.getMonth() === mStr &&
               alertDate.getFullYear() === yStr;
      });
    };

    const getAlertDetails = (alert) => {
      const isFuga = alert.type === "Fuga";
      const state = alert.state;

      let crew = "No asignada";
      let volume = "0 L/min";
      let progress = 0;
      let bacheoStatus = "Pendiente";

      if (isFuga) {
        if (state === "Resuelta" || state === "Cerrada" || state === "Cumplido") {
          crew = "Municipio Obras - Cuadrilla A";
          volume = "150 L/min (Volumen total recuperado)";
          progress = 100;
          bacheoStatus = "Asfaltado y bacheo completado";
        } else if (state === "En Proceso" || state === "En reparación") {
          crew = "Sedapal Emergencias - Cuadrilla C";
          volume = "85 L/min (Fuga activa)";
          progress = 60;
          bacheoStatus = "Tubería descubierta, soldadura en curso";
        } else {
          crew = "Inspector asignado: Pendiente";
          volume = "Estimado: 40-120 L/min";
          progress = 0;
          bacheoStatus = "Pendiente de inspección vial";
        }
      } else {
        crew = "Sedapal Planta Atarjea";
        volume = "Corte total de flujo";
        progress = state === "Cerrada" || state === "Resuelta" || state === "Cumplido" ? 100 : 0;
        bacheoStatus = state === "Cerrada" || state === "Resuelta" || state === "Cumplido" ? "Servicio restablecido" : "Mantenimiento preventivo en progreso";
      }

      return { crew, volume, progress, bacheoStatus };
    };

    const handleAddLeak = async (e) => {
      e.preventDefault();
      if (!newLeakLocation.trim()) return;
      try {
        setAlertsLoading(true);
        const formattedDate = selectedDate.toISOString().slice(0, 10); // "yyyy-MM-dd"
        const payload = {
          location: newLeakLocation.trim(),
          date: formattedDate,
          type: newLeakType,
          status: newLeakType === "Fuga" ? "Pendiente" : "Activa",
          description: newLeakType === "Fuga" 
            ? `Fuga reportada en la vía pública: ${newLeakLocation.trim()}`
            : `Mantenimiento programado: Corte preventivo de red de matriz en ${newLeakLocation.trim()}`
        };
        await api.reportMunicipalLeak(payload);
        await loadAlertsFromDb();
        setNewLeakLocation("");
      } catch (err) {
        console.error("Error al reportar la fuga municipal", err);
      } finally {
        setAlertsLoading(false);
      }
    };

    const updateAlertStatusInCalendar = async (id, newStatus) => {
      try {
        setAlertsLoading(true);
        await api.updateAlertStatus(id, newStatus);
        await loadAlertsFromDb();
      } catch (e) {
        console.error("Error al actualizar el estado de la alerta municipal", e);
      } finally {
        setAlertsLoading(false);
      }
    };

    const formattedSelectedDate = selectedDate.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
    const selectedDateEvents = getEventsForDate(selectedDate);

    // Build calendar grid cells
    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDay = prevTotalDays - firstDayOfWeek + i + 1;
      cells.push(
        <div 
          key={`pad-${i}`} 
          className="text-center d-flex align-items-center justify-content-center text-muted opacity-25 rounded-3" 
          style={{ 
            minHeight: "58px", 
            border: "1px solid var(--header-border)",
            fontSize: "12px",
            backgroundColor: "var(--surface-soft)"
          }}
        >
          {prevDay}
        </div>
      );
    }

    for (let d = 1; d <= totalDays; d++) {
      const cellDate = new Date(year, month, d);
      const dayEvents = getEventsForDate(cellDate);
      const isSelected = selectedDate && 
                        selectedDate.getDate() === d && 
                        selectedDate.getMonth() === month && 
                        selectedDate.getFullYear() === year;

      const isToday = new Date().getDate() === d && 
                      new Date().getMonth() === month && 
                      new Date().getFullYear() === year;

      const hasActiveLeak = dayEvents.some(e => e.type === "Fuga" && e.state !== "Resuelta" && e.state !== "Cerrada" && e.state !== "Cumplido");
      const hasActiveCut = dayEvents.some(e => e.type === "Corte de agua" && e.state !== "Resuelta" && e.state !== "Cerrada" && e.state !== "Cumplido");
      const hasResolved = dayEvents.some(e => e.state === "Resuelta" || e.state === "Cerrada" || e.state === "Cumplido");

      cells.push(
        <button
          key={`day-${d}`}
          onClick={() => setSelectedDate(cellDate)}
          className="btn p-0 d-flex flex-column justify-content-between align-items-center rounded-3 position-relative"
          style={{
            minHeight: "58px",
            width: "100%",
            border: isSelected ? "2.5px solid var(--primary)" : "1px solid var(--header-border)",
            backgroundColor: isSelected 
              ? "color-mix(in srgb, var(--primary) 12%, transparent)" 
              : isToday 
                ? "color-mix(in srgb, var(--primary) 6%, var(--surface-soft))"
                : "var(--surface)",
            boxShadow: isSelected ? "0 4px 15px rgba(59, 130, 246, 0.25)" : "none",
            transform: isSelected ? "scale(1.03)" : "none",
            transition: "all 0.15s ease",
            zIndex: isSelected ? 2 : 1
          }}
        >
          <span 
            className={`small fw-bold m-1 ${isToday ? "text-primary px-1.5 py-0.5 rounded-circle bg-primary-subtle" : ""}`} 
            style={{ 
              fontSize: "12.5px",
              color: isToday ? "var(--primary)" : "var(--text)"
            }}
          >
            {d}
          </span>
          <div className="d-flex gap-1 justify-content-center mb-1.5 w-100 px-1">
            {hasActiveLeak && (
              <span className="rounded-circle animate-pulse" style={{ width: 6, height: 6, backgroundColor: "#ef4444" }} title="Fuga activa" />
            )}
            {hasActiveCut && (
              <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: "#fbbf24" }} title="Corte programado" />
            )}
            {hasResolved && (
              <span className="rounded-circle" style={{ width: 6, height: 6, backgroundColor: "#22c55e" }} title="Incidencia resuelta / Bacheo" />
            )}
          </div>
        </button>
      );
    }

    return (
      <main className="flex-fill overflow-auto p-3 p-md-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Encabezado */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">Dashboard Municipal de Vigilancia Ciudadana</h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Gestor municipal: <strong>Alexis Maza</strong> | Distrito: Puente Piedra
            </p>
          </div>
          <span className="badge rounded-pill bg-primary px-3 py-2 fw-semibold text-white" style={{ fontSize: 11 }}>
            VIGILANCIA HÍDRICA URBANA
          </span>
        </div>

        <div className="row g-4">
          {/* Módulo 1: Calendario de Incidencias Urbanas */}
          <div className="col-12 col-xl-7">
            <div className="card border rounded-4 p-4 shadow-sm h-100" style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: "var(--text)" }}>
                  <Calendar size={20} className="text-primary" />
                  Planificación y Calendario de Incidencias
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold text-primary" style={{ fontSize: "14px" }}>
                    {monthNames[month]} {year}
                  </span>
                  <div className="d-flex gap-1">
                    <button className="btn btn-outline-secondary btn-sm rounded-circle p-1" onClick={handlePrevMonth} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ChevronLeft size={14} />
                    </button>
                    <button className="btn btn-outline-secondary btn-sm rounded-circle p-1" onClick={handleNextMonth} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid del Calendario */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }} className="mb-3">
                {daysOfWeek.map((d) => (
                  <div key={d} className="text-center fw-bold py-1 text-muted small" style={{ fontSize: 11, letterSpacing: '0.5px' }}>
                    {d}
                  </div>
                ))}
                {cells}
              </div>

              {/* Leyenda */}
              <div className="d-flex flex-wrap gap-3 mt-3 pt-3 border-top" style={{ borderColor: "var(--header-border)" }}>
                <span className="small text-muted d-flex align-items-center gap-1.5">
                  <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: "#ef4444" }} />
                  Fuga Activa
                </span>
                <span className="small text-muted d-flex align-items-center gap-1.5">
                  <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: "#fbbf24" }} />
                  Corte Programado
                </span>
                <span className="small text-muted d-flex align-items-center gap-1.5">
                  <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: "#22c55e" }} />
                  Resuelto / Bacheado
                </span>
              </div>
            </div>
          </div>

          {/* Módulo 2: Detalles e Incidentes del Día Seleccionado */}
          <div className="col-12 col-xl-5">
            <div className="d-flex flex-column gap-4 h-100">
              
              {/* Card Inspector de Incidencia del Día */}
              <div className="card border rounded-4 p-4 shadow-sm flex-fill" style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}>
                <h5 className="fw-bold mb-3 text-secondary" style={{ fontSize: "14.5px" }}>
                  Inspector: {formattedSelectedDate}
                </h5>

                {selectedDateEvents.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {selectedDateEvents.map((evt) => {
                      const details = getAlertDetails(evt);
                      return (
                        <div 
                          key={evt.id} 
                          className="p-3 rounded-4 border" 
                          style={{ 
                            backgroundColor: "var(--surface-soft)", 
                            borderColor: "var(--header-border)" 
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="badge rounded-pill d-flex align-items-center gap-1 px-2.5 py-1 fw-bold" style={{ 
                              fontSize: 10,
                              backgroundColor: evt.type === "Fuga" ? "rgba(239, 68, 68, 0.1)" : "rgba(251, 191, 36, 0.1)",
                              color: evt.type === "Fuga" ? "#ef4444" : "#b45309"
                            }}>
                              {evt.type === "Fuga" ? <Activity size={10} /> : <Clock size={10} />}
                              {evt.type.toUpperCase()}
                            </span>
                            <span 
                              className={`badge ${
                                evt.state === "Pendiente" || evt.state === "Activa"
                                  ? "bg-danger text-white animate-pulse" 
                                  : evt.state === "En Proceso" || evt.state === "En reparación"
                                    ? "bg-warning text-dark" 
                                    : "bg-success text-white"
                              }`} 
                              style={{ fontSize: 9.5 }}
                            >
                              {evt.state}
                            </span>
                          </div>

                          <p className="fw-semibold mb-2" style={{ fontSize: 13, color: "var(--text)" }}>
                            {evt.message}
                          </p>

                          <div className="text-muted small d-flex flex-column gap-1 mb-3" style={{ fontSize: 11.5 }}>
                            <div><strong>Cuadrilla:</strong> {details.crew}</div>
                            <div><strong>Pérdida / Flujo:</strong> {details.volume}</div>
                            <div><strong>Estado Bacheo:</strong> {details.bacheoStatus}</div>
                          </div>

                          {/* Bacheo/Reparación Progress Bar */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between small text-muted mb-1" style={{ fontSize: 10.5 }}>
                              <span>Progreso de Obra Vial</span>
                              <span className="fw-bold text-dark">{details.progress}%</span>
                            </div>
                            <div className="progress rounded-pill" style={{ height: 6, backgroundColor: "var(--input-border)" }}>
                              <div 
                                className={`progress-bar rounded-pill ${details.progress === 100 ? "bg-success" : "bg-primary animate-pulse"}`} 
                                role="progressbar" 
                                style={{ width: `${details.progress}%` }} 
                              />
                            </div>
                          </div>

                          {/* Acciones de Workflow Sincronizadas con la BD */}
                          <div className="d-flex gap-2">
                            {(evt.state === "Pendiente" || evt.state === "Activa") && (
                              <button
                                onClick={() => updateAlertStatusInCalendar(evt.id, "En Proceso")}
                                className="btn btn-primary btn-sm flex-fill rounded-3 fw-bold py-1.5"
                                style={{ fontSize: 11 }}
                              >
                                Iniciar Reparación
                              </button>
                            )}
                            {(evt.state === "En Proceso" || evt.state === "En reparación") && (
                              <button
                                onClick={() => updateAlertStatusInCalendar(evt.id, "Resuelta")}
                                className="btn btn-success text-white btn-sm flex-fill rounded-3 fw-bold py-1.5"
                                style={{ fontSize: 11 }}
                              >
                                Finalizar Bacheo y Obra
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted border border-dashed rounded-4 bg-light-subtle">
                    <div className="mb-3">
                      <CheckCircle2 size={42} className="text-success opacity-75" />
                    </div>
                    <h6 className="fw-semibold mb-1" style={{ fontSize: 13.5 }}>Red Hídrica Estable</h6>
                    <p className="small mb-0 text-muted px-4" style={{ fontSize: "11.5px" }}>
                      No se registran incidencias o cortes programados para el {formattedSelectedDate}.
                    </p>
                  </div>
                )}
              </div>

              {/* Formulario Elegante para Programar / Reportar */}
              <div className="card border rounded-4 p-4 shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--header-border)" }}>
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: "14.5px", color: "var(--text)" }}>
                  <Plus size={18} className="text-primary" />
                  Programar / Reportar Evento ({formattedSelectedDate})
                </h5>

                <form onSubmit={handleAddLeak} className="d-flex flex-column gap-2.5">
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-muted small mb-1" style={{ fontSize: 10.5 }}>Tipo de Registro</label>
                      <select 
                        value={newLeakType}
                        onChange={(e) => setNewLeakType(e.target.value)}
                        className="form-select rounded-3 text-subtle" 
                        style={{ fontSize: 12 }}
                      >
                        <option value="Fuga">Fuga en la Vía Pública</option>
                        <option value="Corte de agua">Corte Programado</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted small mb-1" style={{ fontSize: 10.5 }}>Fecha Seleccionada</label>
                      <input 
                        type="text" 
                        disabled 
                        value={selectedDate.toISOString().slice(0, 10)} 
                        className="form-control rounded-3 bg-light-subtle text-muted text-center" 
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-muted small mb-1" style={{ fontSize: 10.5 }}>Ubicación / Calle de la Red</label>
                    <input
                      type="text"
                      value={newLeakLocation}
                      onChange={(e) => setNewLeakLocation(e.target.value)}
                      placeholder="ej: Av. Puente Piedra Cdra 5"
                      className="form-control rounded-3 py-2"
                      style={{ fontSize: 12 }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newLeakLocation.trim() || alertsLoading}
                    className="btn btn-primary rounded-3 w-100 fw-bold py-2 mt-2 d-flex align-items-center justify-content-center gap-1.5"
                    style={{ fontSize: 12.5 }}
                  >
                    {alertsLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      <>
                        <Plus size={14} />
                        Registrar Evento en Red
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}