import { useEffect, useState } from "react";

import { api } from "../api/Aquasmart";

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
    return <div className="p-4 text-muted">Cargando historial de cierres...</div>;
  }

  if (error) {
    return <div className="p-4 text-danger">Error al cargar cierres: {error}</div>;
  }

  const manualCount = history.filter((item) => /Manual/i.test(item.type || "")).length;
  const automaticCount = history.filter((item) => /Automático/i.test(item.type || "")).length;

  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Registro de Cierres</h3>
        <div className="text-muted">Eventos manuales y automáticos de la válvula principal</div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="text-muted small">Cierres manuales</div>
            <div className="display-6 fw-bold">{manualCount}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="text-muted small">Cierres automáticos</div>
            <div className="display-6 fw-bold">{automaticCount}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="text-muted small">Total de eventos</div>
            <div className="display-6 fw-bold">{history.length}</div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0 fw-semibold">Historial</h5>
          <span className="text-muted small">Duración y motivo de cada cierre</span>
        </div>

        <div className="d-flex flex-column gap-3">
          {history.map((item, index) => (
            <div key={`${item.timestamp}-${index}`} className="border rounded-4 p-3 bg-white">
              <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                <div>
                  <div className="fw-semibold">{item.type}</div>
                  <div className="text-muted small">{item.reason}</div>
                </div>
                <div className="text-end">
                  <span className="badge text-bg-light">{item.status}</span>
                  <div className="text-muted small mt-1">{item.timestamp}</div>
                </div>
              </div>
              <div className="mt-3 d-flex flex-wrap gap-2">
                <span className="badge text-bg-primary">Duración: {item.durationMinutes} min</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}