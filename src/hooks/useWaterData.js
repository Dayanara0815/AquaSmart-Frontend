import { useState, useEffect, useCallback } from "react";
import { api } from "../api/Aquasmart";

const FALLBACK = {
  status: "Óptimo",
  litersToday: 120,
  costToday: 0.6,
  currentFlow: 0.0,
  valveOpen: true,
  isHome: true,
  lastUpdated: "Hace 5 minutos",
  alert: {
    active: true,
    message: "AVISO DE CORTE DE AGUA",
    schedule: "Mañana de 8:00 a.m. - 2:00 p.m.",
    type: "Corte preventivo",
    state: "Activa",
    description: "Posible corte programado en la zona.",
    timestamp: "Hace 10 minutos",
  },
  aiProjection: {
    projectedBill: 110.0,
    realConsumption: 45,
    aiEstimate: 30,
    leakDetected: 8,
    leakEstimate: 8,
    baseConsumption: 22,
    aiMessage:
      "Tu patrón de consumo indica una posible fuga silenciosa durante la madrugada. " +
      "Solicita revisar la válvula de baño. Esto podría inflar tu recibo en S/. 23.50 adicionales si no se corrige.",
  },
};

function normalizeStatus(status, previous = FALLBACK) {
  if (!status) {
    return previous;
  }

  return {
    status: status.status ?? previous.status,
    litersToday: Number(status.litersToday ?? previous.litersToday),
    costToday: Number(status.costToday ?? previous.costToday),
    currentFlow: Number(status.currentFlow ?? previous.currentFlow),
    valveOpen: Boolean(status.valveOpen ?? previous.valveOpen),
    isHome: Boolean(status.isHome ?? previous.isHome),
    lastUpdated: status.lastUpdated ?? previous.lastUpdated,
    alert: status.alert ?? previous.alert,
    aiProjection: status.aiProjection ?? previous.aiProjection,
  };
}

function getFriendlyError(error) {
  if (!error) return "Error desconocido";
  return error.message || "Error de conexión";
}

export function useWaterData() {
  const [data, setData] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customAiMessage, setCustomAiMessage] = useState(null);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [statusResult, projectionResult, alertsResult] = await Promise.allSettled([
        api.getWaterStatus(),
        api.getAIProjection(),
        api.getAlerts(),
      ]);

      const status = statusResult.status === "fulfilled" ? statusResult.value : null;
      const projection = projectionResult.status === "fulfilled" ? projectionResult.value : null;
      const alerts = alertsResult.status === "fulfilled" ? alertsResult.value : null;

      if (!status || !projection) {
        throw new Error(
          [statusResult, projectionResult]
            .filter((result) => result.status === "rejected")
            .map((result) => result.reason?.message || "Error de conexión")
            .join("; ") || "Error de conexión"
        );
      }

      setData((current) => ({
        ...normalizeStatus(status, current),
        aiProjection: projection ?? current.aiProjection,
        alert: alerts?.[0] ?? status?.alert ?? current.alert,
      }));
      setError(null);
    } catch (err) {
      setError(getFriendlyError(err));
      setData((current) => normalizeStatus(current, FALLBACK));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData({ silent: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleValve = async () => {
    const nextOpen = !data.valveOpen;

    try {
      const response = await api.setValve(nextOpen);
      setData((current) => ({
        ...current,
        valveOpen: response?.open ?? nextOpen,
        lastUpdated: response?.timestamp ?? current.lastUpdated,
      }));
      setError(null);
    } catch (err) {
      setError(getFriendlyError(err));
    }
  };

  const togglePresence = async () => {
    const nextHome = !data.isHome;

    try {
      const response = await api.setHomePresence(nextHome);
      setData((current) => ({
        ...current,
        isHome: response?.home ?? nextHome,
        lastUpdated: response?.timestamp ?? current.lastUpdated,
      }));
      setError(null);
    } catch (err) {
      setError(getFriendlyError(err));
    }
  };

  const askAI = async (question) => {
    if (!question?.trim()) {
      return null;
    }

    try {
      const response = await api.askAI(question.trim());
      if (response?.answer) {
        setCustomAiMessage(response.answer);
      }
      setError(null);
      return response;
    } catch (err) {
      setError(getFriendlyError(err));
      return null;
    }
  };

  const dataWithCustomMessage = {
    ...data,
    aiProjection: {
      ...data.aiProjection,
      aiMessage: customAiMessage || data.aiProjection.aiMessage,
    },
  };

  return {
    data: dataWithCustomMessage,
    loading,
    error,
    toggleValve,
    togglePresence,
    askAI,
    refresh: fetchData,
  };
}