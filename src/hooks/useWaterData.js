import { useState, useEffect, useCallback } from "react";
import { api } from "../api/aquasmart";

// ─── Mock data (eliminar cuando el backend esté listo) ───────────────────────
const MOCK = {
  status:       "Óptimo",
  litersToday:  120,
  costToday:    0.60,
  currentFlow:  0.0,
  valveOpen:    true,
  isHome:       true,
  lastUpdated:  "Hace 5 minutos",
  alert: {
    active:    true,
    message:   "AVISO DE CORTE DE AGUA",
    schedule:  "Mañana de 8:00 a.m. - 2:00 p.m.",
  },
  aiProjection: {
    projectedBill:   110.0,
    realConsumption: 45,
    aiEstimate:      30,
    leakDetected:    8,
    leakEstimate:    8,
    baseConsumption: 22,
    aiMessage:
      "Tu patrón de consumo indica una posible fuga silenciosa durante la madrugada. " +
      "Solicítanos revisar la válvula de baño. Esto podría inflar tu recibo en S/. 23.50 adicionales si no se corrige.",
  },
};
// ─────────────────────────────────────────────────────────────────────────────

export function useWaterData() {
  const [data, setData]       = useState(MOCK);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // ── Descomentar para conectar al backend ──────────────────────────────────
  // const fetchData = useCallback(async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const [status, projection, alerts] = await Promise.all([
  //       api.getWaterStatus(),
  //       api.getAIProjection(),
  //       api.getAlerts(),
  //     ]);
  //     setData({ ...status, aiProjection: projection, alert: alerts[0] ?? null });
  //   } catch (err) {
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);
  //
  // useEffect(() => {
  //   fetchData();
  //   const interval = setInterval(fetchData, 30_000); // polling cada 30s
  //   return () => clearInterval(interval);
  // }, [fetchData]);
  // ─────────────────────────────────────────────────────────────────────────

  const toggleValve = async () => {
    // await api.setValve(!data.valveOpen);
    setData((prev) => ({ ...prev, valveOpen: !prev.valveOpen }));
  };

  const togglePresence = async () => {
    // await api.setHomePresence(!data.isHome);
    setData((prev) => ({ ...prev, isHome: !prev.isHome }));
  };

  return { data, loading, error, toggleValve, togglePresence };
}