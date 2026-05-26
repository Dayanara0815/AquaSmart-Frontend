import { useState, useEffect } from "react";
import { 
  Droplets, Calendar, Shield, MapPin, Activity, 
  FileText, AlertTriangle, CheckCircle2, User, RefreshCw
} from "lucide-react";
import { api } from "../api/Aquasmart";
import { WaterCutAlert } from "../components/dashboard/WaterCutAlert";
import { WaterStatusCard } from "../components/dashboard/WaterStatusCard";
import { AICostProjection } from "../components/dashboard/AICostProjection";
import { useWaterData } from "../hooks/useWaterData";
import { StatCard } from "../components/ui/StatCard";

export function Dashboard() {
  const { data, loading, error, toggleValve, togglePresence, askAI } = useWaterData();
  const [role, setRole] = useState("DOMESTICO");
  const [userName, setUserName] = useState("María Fernanda");

  // Estado para la simulación interactiva del Técnico
  const [claimStatus, setClaimStatus] = useState("Pendiente"); // Pendiente -> Aprobado
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
  }, [data]);

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

        {/* Panel de Simulación Académica UTP (Fase 2) */}
        <div 
          className="card border-0 rounded-4 p-3 mb-4 shadow-sm"
          style={{
            background: "rgba(34, 211, 238, 0.08)",
            border: "1px solid rgba(34, 211, 238, 0.2)",
          }}
        >
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-3 p-2 bg-info-subtle text-info d-flex align-items-center justify-content-center animate-pulse" style={{ backgroundColor: "rgba(34, 211, 238, 0.15)", color: "#06b6d4" }}>
                <Activity size={22} />
              </div>
              <div>
                <h6 className="fw-bold mb-0 text-info" style={{ color: "#0891b2" }}>
                  🧪 Entorno Académico de Simulación AquaSmart (Fase 2)
                </h6>
                <p className="mb-0 text-muted small mt-0.5" style={{ fontSize: 12.5 }}>
                  Prueba la recepción de alertas automáticas del Municipio e interactúa con el Técnico en tiempo real.
                </p>
              </div>
            </div>
            <button 
              onClick={handleSimulateLeak}
              disabled={alertsLoading}
              className="btn btn-info btn-sm rounded-3 px-3 py-2 fw-semibold text-white d-flex align-items-center gap-2"
              style={{ backgroundColor: "#06b6d4", border: "none" }}
            >
              <RefreshCw size={14} className={alertsLoading ? "spin" : ""} />
              Simular Fuga Vial en Puente Piedra
            </button>
          </div>
        </div>

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
    const handleApproveClaim = () => {
      setClaimStatus("Aprobado");
    };

    return (
      <main className="flex-fill overflow-auto p-3 p-md-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Encabezado */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="fw-bold mb-1">Panel de Auditoría Técnica de Campo</h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Técnico asignado: <strong>Carlos Mendoza</strong> | Distrito: Puente Piedra
            </p>
          </div>
          <span className="badge rounded-pill bg-success px-3 py-2 fw-semibold" style={{ fontSize: 11 }}>
            SECTOR OPERATIVO LIMA NORTE
          </span>
        </div>

        {/* KPIs Técnicos */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border rounded-4 p-3 shadow-sm">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 p-2 bg-success-subtle text-success">
                  <Activity size={24} />
                </div>
                <div>
                  <span className="text-muted d-block" style={{ fontSize: 11 }}>MEDIDORES MONITOREADOS</span>
                  <h4 className="fw-bold mb-0">1,280 Activos</h4>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border rounded-4 p-3 shadow-sm">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 p-2 bg-danger-subtle text-danger">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <span className="text-muted d-block" style={{ fontSize: 11 }}>ALERTAS REPORTADAS HOY</span>
                  <h4 className="fw-bold mb-0">4 Anomalías</h4>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border rounded-4 p-3 shadow-sm">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-3 p-2 bg-primary-subtle text-primary">
                  <FileText size={24} />
                </div>
                <div>
                  <span className="text-muted d-block" style={{ fontSize: 11 }}>RECLAMACIONES DE VECINOS</span>
                  <h4 className="fw-bold mb-0">1 Pendiente</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Módulo 1: Auditoría de Reclamación Activa */}
          <div className="col-12 col-lg-7">
            <div className="card border rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FileText size={20} className="text-primary" />
                Auditoría y Resolución de Reclamaciones (LegalTech)
              </h5>
              
              <div className="rounded-4 p-3 mb-4" style={{ backgroundColor: "var(--surface-soft)", border: "1px solid var(--header-border)" }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-bold" style={{ fontSize: 14 }}>
                    Titular: María Fernanda Quispe Rojas
                  </span>
                  <span 
                    className={`badge px-2 py-1 rounded-pill ${
                      claimStatus === "Pendiente" ? "bg-warning text-dark" : "bg-success text-white"
                    }`}
                    style={{ fontSize: 10 }}
                  >
                    {claimStatus === "Pendiente" ? "En Revisión Técnica" : "Refacturado y Resuelto"}
                  </span>
                </div>
                <p className="text-muted mb-3" style={{ fontSize: 12 }}>
                  <strong>Motivo de Queja:</strong> Cobro excesivo estimado de S/. 23.50 por ingreso de aire acumulado tras corte vecinal el día 20/05/2026.
                </p>

                {/* Evidencia del sensor */}
                <div className="table-responsive mb-3">
                  <table className="table table-sm table-borderless mb-0" style={{ fontSize: 11, color: "var(--text)" }}>
                    <thead>
                      <tr className="text-muted border-bottom" style={{ borderColor: "var(--header-border)" }}>
                        <th>Tipo de Evento</th>
                        <th>Duración</th>
                        <th>Volumen Registrado</th>
                        <th>Costo Impactado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Paso de Aire</td>
                        <td>25 minutos</td>
                        <td>15.2 Litros</td>
                        <td className="text-warning">S/. 23.50</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {claimStatus === "Pendiente" ? (
                  <button 
                    onClick={handleApproveClaim}
                    className="btn btn-success w-100 rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                    style={{ fontSize: 13 }}
                  >
                    <CheckCircle2 size={18} />
                    Validar Evidencia y Aprobar Refacturación
                  </button>
                ) : (
                  <div className="alert alert-success py-2 px-3 rounded-3 d-flex align-items-center gap-2" style={{ fontSize: 12.5 }}>
                    <CheckCircle2 size={18} className="text-success" />
                    <span>
                      <strong>✓ Evidencia validada:</strong> Se ha generado un crédito de <strong>S/. 23.50</strong> a favor de la usuaria en su siguiente facturación.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Módulo 2: Estado de Medidores del Distrito */}
          <div className="col-12 col-lg-5">
            <div className="card border rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <Activity size={20} className="text-primary" />
                Medidores en Línea (Puente Piedra)
              </h5>

              <div className="d-flex flex-column gap-3">
                {technicalAlerts.map((meter) => (
                  <div 
                    key={meter.id} 
                    className="p-3 rounded-4" 
                    style={{ 
                      backgroundColor: "var(--surface-soft)", 
                      border: "1px solid var(--header-border)" 
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold" style={{ fontSize: 13 }}>{meter.id}</span>
                      <span 
                        className={`badge ${
                          meter.status === "Óptimo" 
                            ? "bg-success" 
                            : meter.status === "Fuga Activa" 
                              ? "bg-danger animate-pulse" 
                              : "bg-secondary"
                        }`}
                        style={{ fontSize: 9 }}
                      >
                        {meter.status}
                      </span>
                    </div>
                    <p className="text-muted mb-2" style={{ fontSize: 11.5 }}>
                      📍 {meter.address}
                    </p>
                    <div className="d-flex align-items-center justify-content-between" style={{ fontSize: 11 }}>
                      <span className="text-muted">Caudal: <strong>{meter.flow}</strong></span>
                      <span className="text-muted">Presión: <strong>{meter.pressure}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Módulo Adicional: Gestión de Fugas en Base de Datos PostgreSQL */}
              <h5 className="fw-bold mt-4 mb-3 d-flex align-items-center gap-2 border-top pt-3" style={{ borderColor: "var(--header-border)" }}>
                <Shield size={20} className="text-primary" />
                Órdenes de Trabajo Hídricas (PostgreSQL)
              </h5>

              <div className="d-flex flex-column gap-2">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className="p-3 rounded-4" 
                      style={{ 
                        backgroundColor: "var(--surface-soft)",
                        border: "1px solid var(--header-border)" 
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold" style={{ fontSize: 13 }}>
                          {alert.type || "Anomalía"} #{alert.id}
                        </span>
                        <span 
                          className={`badge ${
                            alert.state === "Pendiente" || alert.state === "Activa"
                              ? "bg-danger text-white animate-pulse" 
                              : alert.state === "En Proceso" || alert.state === "En reparación"
                                ? "bg-warning text-dark" 
                                : alert.state === "En Revisión"
                                  ? "bg-info text-dark"
                                  : alert.state === "Fallado" || alert.state === "Rechazado"
                                    ? "bg-secondary text-white"
                                    : "bg-success text-white"
                          }`}
                          style={{ fontSize: 9 }}
                        >
                          {alert.state}
                        </span>
                      </div>
                      <p className="text-muted mb-2" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                        {alert.message}
                      </p>
                      <div className="d-flex align-items-center justify-content-between mb-2 text-muted" style={{ fontSize: 10.5 }}>
                        <span>🕒 {alert.timestamp || "Reciente"}</span>
                      </div>
                      
                      {/* Botones de acción colaborativa de la Base de Datos estilo JIRA */}
                      {(alert.state === "Pendiente" || alert.state === "Activa") && (
                        <button
                          onClick={() => void handleUpdateStatus(alert.id, "En Proceso")}
                          className="btn btn-warning btn-sm w-100 rounded-3 py-1.5 fw-semibold text-dark mt-1"
                          style={{ fontSize: 12 }}
                        >
                          🛠️ Iniciar Reparación
                        </button>
                      )}
                      {(alert.state === "En Proceso" || alert.state === "En reparación") && (
                        <div className="d-flex gap-2 mt-1">
                          <button
                            onClick={() => void handleUpdateStatus(alert.id, "En Revisión")}
                            className="btn btn-info btn-sm flex-fill rounded-3 py-1.5 fw-semibold text-dark"
                            style={{ fontSize: 12 }}
                          >
                            🔍 Enviar a Revisión
                          </button>
                          <button
                            onClick={() => void handleUpdateStatus(alert.id, "Fallado")}
                            className="btn btn-danger btn-sm flex-fill rounded-3 py-1.5 fw-semibold text-white"
                            style={{ fontSize: 12 }}
                          >
                            ❌ Reportar Fallo
                          </button>
                        </div>
                      )}
                      {alert.state === "En Revisión" && (
                        <button
                          onClick={() => void handleUpdateStatus(alert.id, "Cumplido")}
                          className="btn btn-success btn-sm w-100 rounded-3 py-1.5 fw-semibold text-white mt-1"
                          style={{ fontSize: 12 }}
                        >
                          ✅ Completar Tarea (Cumplido)
                        </button>
                      )}
                      {(alert.state === "Fallado" || alert.state === "Rechazado") && (
                        <button
                          onClick={() => void handleUpdateStatus(alert.id, "En Proceso")}
                          className="btn btn-warning btn-sm w-100 rounded-3 py-1.5 fw-semibold text-dark mt-1"
                          style={{ fontSize: 12 }}
                        >
                          🔄 Reabrir e Iniciar Trabajo
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted small py-3">
                    No hay órdenes de trabajo registradas en la base de datos relacional.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 3: GESTOR MUNICIPAL (ALEXIS MAZA)
  // ==========================================
  if (role === "MUNICIPAL") {
    const handleAddLeak = async (e) => {
      e.preventDefault();
      if (!newLeakLocation.trim()) return;
      try {
        setAlertsLoading(true);
        await api.reportMunicipalLeak(newLeakLocation.trim());
        await loadAlertsFromDb();
        setNewLeakLocation("");
      } catch (err) {
        console.error("Error al reportar la fuga municipal", err);
      } finally {
        setAlertsLoading(false);
      }
    };

    return (
      <main className="flex-fill overflow-auto p-3 p-md-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Encabezado */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="fw-bold mb-1">Dashboard Municipal de Vigilancia Ciudadana</h4>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
              Gestor municipal: <strong>Alexis Maza</strong> | Distrito: Puente Piedra
            </p>
          </div>
          <span className="badge rounded-pill bg-warning text-dark px-3 py-2 fw-semibold" style={{ fontSize: 11 }}>
            VIGILANCIA HÍDRICA URBANA
          </span>
        </div>

        {/* Alerta de rotura de matriz */}
        <div className="alert alert-danger border rounded-4 p-3 mb-4 d-flex align-items-start gap-3">
          <div className="rounded-3 p-2 bg-danger-subtle text-danger d-flex align-items-center justify-content-center">
            <AlertTriangle size={22} className="animate-pulse" />
          </div>
          <div>
            <h6 className="fw-bold mb-1">⚠️ Alerta Crítica Vecinal: Posible Rotura de Matriz Detectada</h6>
            <p className="mb-0 text-muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              El algoritmo de correlación comunitaria reporta que **83% de los medidores en la Manzana 4 (Lotes 10-20)** de Puente Piedra reportan una caída de presión repentina a <strong>0.2 bar</strong> de forma simultánea. Se ha notificado automáticamente a las cuadrillas de reparación técnica de Sedapal.
            </p>
          </div>
        </div>

        <div className="row g-4">
          {/* Módulo 1: Mapa y Correlación */}
          <div className="col-12 col-lg-6">
            <div className="card border rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <MapPin size={20} className="text-primary" />
                Mapa de Correlación de Presión Cero
              </h5>
              
              <div 
                className="rounded-4 p-4 d-flex align-items-center justify-content-center flex-column gap-2 mb-2"
                style={{
                  minHeight: 220,
                  backgroundColor: "var(--surface-soft)",
                  border: "1px dashed var(--header-border)",
                }}
              >
                <div className="d-flex gap-3 mb-2 flex-wrap justify-content-center">
                  <div className="px-3 py-2 rounded-3 bg-success-subtle text-success text-center" style={{ fontSize: 12 }}>
                    <strong>Mza 1</strong><br />1.8 bar
                  </div>
                  <div className="px-3 py-2 rounded-3 bg-success-subtle text-success text-center" style={{ fontSize: 12 }}>
                    <strong>Mza 2</strong><br />1.6 bar
                  </div>
                  <div className="px-3 py-2 rounded-3 bg-success-subtle text-success text-center" style={{ fontSize: 12 }}>
                    <strong>Mza 3</strong><br />1.9 bar
                  </div>
                  <div className="px-3 py-2 rounded-3 bg-danger-subtle text-danger text-center animate-pulse" style={{ fontSize: 12, border: '1px solid #ef4444' }}>
                    <strong>Mza 4</strong><br />0.2 bar ⚠️
                  </div>
                </div>
                <p className="text-muted text-center mt-2 mb-0" style={{ fontSize: 12, maxWidth: 350 }}>
                  *Los transductores de presión envían datos por Wi-Fi cada 3s. El sistema correlaciona caídas para evitar reportes falsos.
                </p>
              </div>
            </div>
          </div>

          {/* Módulo 2: Registro de Fugas y Bacheo Vial */}
          <div className="col-12 col-lg-6">
            <div className="card border rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <Activity size={20} className="text-primary" />
                Reporte de Fugas en Vía Pública y Bacheo
              </h5>

              <div className="d-flex flex-column gap-3 mb-3">
                {alerts.filter(a => a.type === "Fuga").length > 0 ? (
                  alerts.filter(a => a.type === "Fuga").map((leak) => (
                    <div 
                      key={leak.id} 
                      className="p-3 rounded-4" 
                      style={{ 
                        backgroundColor: "var(--surface-soft)", 
                        border: "1px solid var(--header-border)" 
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold" style={{ fontSize: 13.5 }}>{leak.message}</span>
                        <span 
                          className={`badge ${
                            leak.state === "Pendiente" || leak.state === "Activa"
                              ? "bg-danger text-white animate-pulse" 
                              : leak.state === "En Proceso" || leak.state === "En reparación"
                                ? "bg-warning text-dark" 
                                : leak.state === "En Revisión"
                                  ? "bg-info text-dark"
                                  : leak.state === "Fallado" || leak.state === "Rechazado"
                                    ? "bg-secondary text-white"
                                    : "bg-success text-white"
                          }`} 
                          style={{ fontSize: 9 }}
                        >
                          {leak.state}
                        </span>
                      </div>
                      <p className="text-muted mb-0 small">
                        <strong>Fecha de reporte:</strong> {leak.timestamp || "Reciente"} | <strong>Canal:</strong> Reporte Municipal
                      </p>
                    </div>
                  ))
                ) : (
                  streetLeaks.map((leak) => (
                    <div 
                      key={leak.id} 
                      className="p-3 rounded-4" 
                      style={{ 
                        backgroundColor: "var(--surface-soft)", 
                        border: "1px solid var(--header-border)" 
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span className="fw-bold" style={{ fontSize: 13 }}>{leak.location}</span>
                        <span className="badge bg-warning text-dark" style={{ fontSize: 9 }}>{leak.status}</span>
                      </div>
                      <p className="text-muted mb-0" style={{ fontSize: 11 }}>
                        <strong>Caudal Estimado:</strong> {leak.size} | <strong>Cuadrilla:</strong> {leak.crew}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Agregar Reporte */}
              <form onSubmit={handleAddLeak} className="d-flex gap-2 mt-2">
                <input
                  type="text"
                  value={newLeakLocation}
                  onChange={(e) => setNewLeakLocation(e.target.value)}
                  placeholder="ej: Av. Puente Piedra Cdra 5"
                  className="form-control rounded-3 py-2"
                  style={{
                    fontSize: 12.5,
                  }}
                />
                <button
                  type="submit"
                  disabled={!newLeakLocation.trim()}
                  className="btn btn-primary rounded-3 px-3 fw-semibold"
                  style={{ fontSize: 13 }}
                >
                  Reportar Fuga
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}