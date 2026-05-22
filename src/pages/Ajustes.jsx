import { useEffect, useState } from "react";

import { api } from "../api/Aquasmart";

const DEFAULT_SETTINGS = {
  airAlertsEnabled: true,
  leakAlertsEnabled: true,
  nightSilenceEnabled: true,
  silentFrom: "22:00",
  silentTo: "08:00",
  criticalOverrideEnabled: true,
};

export function Ajustes() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await api.getNotificationSettings();
        if (!active) return;
        setSettings({ ...DEFAULT_SETTINGS, ...response });
      } catch {
        if (!active) return;
        setSettings(DEFAULT_SETTINGS);
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

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await api.updateNotificationSettings(settings);
      setSettings((current) => ({ ...current, ...response }));
      setMessage("Configuración actualizada correctamente.");
    } catch (error) {
      setMessage(error.message || "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Cargando ajustes...</div>;
  }

  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Ajustes de Notificaciones</h3>
        <div className="text-muted">Silencio nocturno y reglas críticas</div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mx-auto" style={{ maxWidth: 760 }}>
        <div className="d-flex flex-column gap-3">
          <label className="d-flex align-items-center justify-content-between gap-3">
            <span>Alertar por paso de aire</span>
            <input
              type="checkbox"
              className="form-check-input"
              checked={settings.airAlertsEnabled}
              onChange={(e) => updateField("airAlertsEnabled", e.target.checked)}
            />
          </label>

          <label className="d-flex align-items-center justify-content-between gap-3">
            <span>Alertar por fuga</span>
            <input
              type="checkbox"
              className="form-check-input"
              checked={settings.leakAlertsEnabled}
              onChange={(e) => updateField("leakAlertsEnabled", e.target.checked)}
            />
          </label>

          <label className="d-flex align-items-center justify-content-between gap-3">
            <span>Horario de silencio</span>
            <input
              type="checkbox"
              className="form-check-input"
              checked={settings.nightSilenceEnabled}
              onChange={(e) => updateField("nightSilenceEnabled", e.target.checked)}
            />
          </label>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Silenciar desde</label>
              <input
                type="time"
                className="form-control"
                value={settings.silentFrom}
                onChange={(e) => updateField("silentFrom", e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Silenciar hasta</label>
              <input
                type="time"
                className="form-control"
                value={settings.silentTo}
                onChange={(e) => updateField("silentTo", e.target.value)}
              />
            </div>
          </div>

          <label className="d-flex align-items-center justify-content-between gap-3">
            <span>Ignorar silencio en eventos críticos</span>
            <input
              type="checkbox"
              className="form-check-input"
              checked={settings.criticalOverrideEnabled}
              onChange={(e) => updateField("criticalOverrideEnabled", e.target.checked)}
            />
          </label>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 pt-2">
            <div className="text-muted small">Los cambios se guardan en la sesión actual de prueba.</div>
            <button className="btn btn-primary px-4" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

          {message && <div className="alert alert-info mb-0">{message}</div>}
        </div>
      </div>
    </div>
  );
}