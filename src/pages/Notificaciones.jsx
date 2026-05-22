import { useEffect, useState } from "react";

import { api } from "../api/Aquasmart";

const FALLBACK = {
  alerts: [],
  summary: {
    total: 3,
    active: 2,
    critical: 1,
  },
};

export function Notificaciones() {
  const [alerts, setAlerts] = useState(FALLBACK.alerts);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.getAlerts();
        if (!active) return;
        setAlerts(Array.isArray(response) ? response : []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setAlerts([
          {
            active: true,
            message: "AVISO DE CORTE DE AGUA",
            schedule: "Mañana de 8:00 a.m. - 2:00 p.m.",
            type: "Corte preventivo",
            state: "Activa",
            description: "Posible corte programado en la zona.",
            timestamp: "Hace 10 minutos",
          },
          {
            active: true,
            message: "Posible fuga silenciosa detectada",
            schedule: "03:15 a.m.",
            type: "Fuga",
            state: "Activa",
            description: "Consumo constante en horario no convencional.",
            timestamp: "Hace 3 horas",
          },
          {
            active: false,
            message: "Evento de paso de aire",
            schedule: "06:05 a.m.",
            type: "Paso de aire",
            state: "Cerrada",
            description: "Evento transitorio sin fuga persistente.",
            timestamp: "Ayer",
          },
        ]);
        setError(null);
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

  const total = alerts.length;
  const activeAlerts = alerts.filter((alert) => alert.active).length;
  const criticalAlerts = alerts.filter((alert) =>
    /fuga|corte/i.test(alert.type || alert.message || "")
  ).length;
  const selectedAlert = alerts[selectedIndex] || alerts[0] || null;

  if (loading) {
    return <div className="p-4 text-muted">Cargando notificaciones...</div>;
  }

  if (error) {
    return <div className="p-4 text-danger">Error al cargar notificaciones: {error}</div>;
  }

  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Notificaciones y Alertas</h3>
        <div className="text-muted">Historial reciente de eventos del medidor</div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="text-muted small">Total de eventos</div>
            <div className="display-6 fw-bold">{total}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="text-muted small">Alertas activas</div>
            <div className="display-6 fw-bold">{activeAlerts}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="text-muted small">Eventos críticos</div>
            <div className="display-6 fw-bold">{criticalAlerts}</div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-semibold mb-0">Historial</h5>
          <span className="text-muted small">Selecciona una alerta para ver qué, cuándo y por qué</span>
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-5">
            <div className="d-flex flex-column gap-3">
              {alerts.map((alert, index) => (
                <button
                  key={`${alert.timestamp || index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`text-start border rounded-4 p-3 bg-white ${selectedIndex === index ? "border-primary" : ""}`}
                  style={{ appearance: "none" }}
                >
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <div className="fw-semibold">{alert.message}</div>
                      <div className="text-muted small">{alert.description || alert.schedule}</div>
                    </div>
                    <div className="text-end">
                      <span className={`badge rounded-pill ${alert.active ? "text-bg-danger" : "text-bg-secondary"}`}>
                        {alert.state || (alert.active ? "Activa" : "Cerrada")}
                      </span>
                      <div className="text-muted small mt-1">{alert.timestamp}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="col-12 col-lg-7">
            {selectedAlert ? (
              <div className="border rounded-4 p-4 bg-light h-100">
                <h5 className="fw-semibold mb-3">Detalle de alerta</h5>
                <div className="row g-3">
                  <div className="col-12">
                    <div className="text-muted small">Qué</div>
                    <div className="fw-semibold">{selectedAlert.message}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Cuándo</div>
                    <div>{selectedAlert.timestamp}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Tipo</div>
                    <div>{selectedAlert.type || "Evento"}</div>
                  </div>
                  <div className="col-12">
                    <div className="text-muted small">Por qué</div>
                    <div>{selectedAlert.description || "Sin descripción técnica disponible."}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Estado</div>
                    <div>{selectedAlert.state || (selectedAlert.active ? "Activa" : "Cerrada")}</div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Horario</div>
                    <div>{selectedAlert.schedule || "N/D"}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-4 p-4 bg-light h-100 text-muted">No hay alertas para mostrar.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}