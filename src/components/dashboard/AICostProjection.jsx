import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const COLORS = {
  real_base: "#60a5fa",
  real_fuga: "#fca5a5",
  ia_base: "#86efac",
  ia_fuga: "#fb923c",
};

export function AICostProjection({ projection, onAskAI }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const q = input.trim();
    if (!q) return;
    onAskAI?.(q);
    setInput("");
  };
  const LITER_TO_PEN = 0.005; // S/. 5.0 per m3 / 1000 liters

  const realConsumption = projection.realConsumption ?? 0;
  const leakDetected = projection.leakDetected ?? 0;
  const baseConsumption = projection.baseConsumption ?? 0;
  const leakEstimate = projection.leakEstimate ?? 0;

  const chartData = [
    {
      name: "REAL CONSUMO",
      sub: "actual",
      base: realConsumption * LITER_TO_PEN,
      fuga: (leakDetected * LITER_TO_PEN) || 0.000001,
      total: (realConsumption + leakDetected) * LITER_TO_PEN,
    },
    {
      name: "PRONÓSTICO IA",
      sub: "end month",
      base: baseConsumption * LITER_TO_PEN,
      fuga: (leakEstimate * LITER_TO_PEN) || 0.000001,
      total: (baseConsumption + leakEstimate) * LITER_TO_PEN,
    },
  ];

  return (
    <div
      className="rounded-4 p-4 h-100 d-flex flex-column gap-4"
      style={{
        background: "var(--surface)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        border: "1px solid var(--header-border)",
      }}
    >
      {/* HEADER */}
      <div className="d-flex align-items-center gap-2">
        <span
          className="d-flex align-items-center justify-content-center rounded-circle fw-bold"
          style={{
            width: 34,
            height: 34,
            background: "var(--accent-surface)",
            color: "#2563eb",
            fontSize: 13,
          }}
        >
          IA
        </span>
        <div>
          <h6
            className="mb-0 fw-bold"
            style={{ fontSize: 13, color: "var(--text)" }}
          >
            Proyección de Costos
          </h6>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            Análisis inteligente mensual
          </span>
        </div>
      </div>

      {/* MONTO */}
      <div>
        <span className="text-muted" style={{ fontSize: 11 }}>
          Proyección Recibo
        </span>
        <h2 className="fw-bold mb-0" style={{ color: "var(--text)", fontSize: 34 }}>
          S/. {(projection.projectedBill || 0).toFixed(2)}
        </h2>
      </div>

      {/* CHART */}
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 35, right: 20, left: 20, bottom: 10 }}
            barSize={90}
          >
            <defs>
              <linearGradient id="colorRealBase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.35}/>
              </linearGradient>
              <linearGradient id="colorRealFuga" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.35}/>
              </linearGradient>
              <linearGradient id="colorIABase" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#86efac" stopOpacity={0.35}/>
              </linearGradient>
              <linearGradient id="colorIAFuga" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.95}/>
                <stop offset="100%" stopColor="#fb923c" stopOpacity={0.35}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="color-mix(in srgb, var(--header-border) 60%, transparent)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              height={40}
              tick={({ x, y, payload, index }) => (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={14}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill="var(--subtle)"
                  >
                    {payload.value}
                  </text>
                  <text
                    x={0}
                    y={0}
                    dy={26}
                    textAnchor="middle"
                    fontSize={9}
                    fill="var(--muted)"
                  >
                    {chartData[index].sub}
                  </text>
                </g>
              )}
            />
            <YAxis hide />
            <Tooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const baseVal = payload[0]?.value || 0;
                  const fugaVal = payload[1]?.value || 0;
                  const totalVal = baseVal + fugaVal;
                  const isIA = label?.includes("IA") || label?.includes("PRONÓSTICO");
                  return (
                    <div
                      className="p-3 rounded-4 shadow-lg border"
                      style={{
                        background: "var(--surface)",
                        backdropFilter: "blur(12px)",
                        borderColor: "var(--header-border)",
                        color: "var(--text)",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <div className="fw-bold mb-2 border-bottom pb-1" style={{ borderColor: "var(--header-border)", fontSize: "11px", letterSpacing: "0.5px" }}>
                        {label}
                      </div>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between align-items-center gap-4">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: isIA ? "#10b981" : "#3b82f6" }} />
                            Consumo Base:
                          </span>
                          <span className="fw-bold">S/. {baseVal.toFixed(2)}</span>
                        </div>
                        {fugaVal >= 0.01 && (
                          <div className="d-flex justify-content-between align-items-center gap-4">
                            <span className="text-muted d-flex align-items-center gap-1.5">
                              <span className="rounded-circle" style={{ width: 8, height: 8, backgroundColor: isIA ? "#f97316" : "#ef4444" }} />
                              Fuga/Pérdidas:
                            </span>
                            <span className="fw-semibold text-danger">S/. {fugaVal.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="d-flex justify-content-between align-items-center gap-4 border-top pt-2 mt-1 fw-bold" style={{ borderColor: "var(--header-border)" }}>
                          <span>Total Estimado:</span>
                          <span className="text-primary" style={{ fontSize: "13px" }}>S/. {totalVal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Bar dataKey="base" stackId="a" radius={[0, 0, 10, 10]}>
              <Cell fill="url(#colorRealBase)" />
              <Cell fill="url(#colorIABase)" />
            </Bar>

            <Bar
              dataKey="fuga"
              stackId="a"
              radius={[10, 10, 0, 0]}
            >
              <Cell fill="url(#colorRealFuga)" />
              <Cell fill="url(#colorIAFuga)" />
              <LabelList
                dataKey="total"
                position="top"
                formatter={(v) => v > 0 ? `S/. ${Number(v).toFixed(2)}` : ""}
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fill: "var(--text)",
                }}
                offset={8}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* IA MESSAGE */}
      <div
        className="rounded-4 p-3"
        style={{ background: "var(--accent-surface)", border: "1px solid var(--accent-border)" }}
      >
        <p
          className="mb-0"
          style={{ fontSize: 12, color: "var(--subtle)", lineHeight: 1.5 }}
        >
          <span className="fw-semibold" style={{ color: "#2563eb" }}>
            Análisis IA:
          </span>{" "}
          {projection.aiMessage || "Analizando datos..."}
        </p>
      </div>

      {/* INDICACIÓN DE ASISTENTE */}
      <div 
        className="rounded-4 p-3 mt-auto text-center"
        style={{ 
          background: "rgba(37, 99, 235, 0.05)", 
          border: "1px dashed rgba(37, 99, 235, 0.25)" 
        }}
      >
        <span style={{ fontSize: 11.5, color: "var(--subtle)" }}>
          💬 ¿Deseas conversar? Usa el **asistente flotante AquaBot IA** en la esquina inferior derecha para revisar tu historial de conversación y realizar consultas de telemetría en tiempo real.
        </span>
      </div>
    </div>
  );
}
