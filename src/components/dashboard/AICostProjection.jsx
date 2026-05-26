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

  const realConsumption = projection.realConsumption || 0;
  const leakDetected = projection.leakDetected || 8;
  const baseConsumption = projection.baseConsumption || 0;
  const leakEstimate = projection.leakEstimate || 0;

  const chartData = [
    {
      name: "REAL CONSUMO",
      sub: "actual",
      base: realConsumption * LITER_TO_PEN,
      fuga: leakDetected * LITER_TO_PEN,
    },
    {
      name: "PRONÓSTICO IA",
      sub: "end month",
      base: baseConsumption * LITER_TO_PEN,
      fuga: leakEstimate * LITER_TO_PEN,
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
            margin={{ top: 30, right: 20, left: 20, bottom: 10 }}
            barSize={90}
          >
            <CartesianGrid vertical={false} stroke="color-mix(in srgb, var(--muted) 25%, transparent)" />
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
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
              formatter={(value) => [`S/. ${Number(value).toFixed(2)}`]}
            />

            <Bar dataKey="base" stackId="a" radius={[0, 0, 10, 10]}>
              <Cell fill={COLORS.real_base} />
              <Cell fill={COLORS.ia_base} />
              <LabelList
                dataKey="base"
                position="center"
                formatter={(v) => `S/. ${Number(v).toFixed(2)}`}
                style={{ fontSize: 10, fontWeight: 600, fill: "#1e3a8a" }}
              />
            </Bar>

            <Bar
              dataKey="fuga"
              stackId="a"
              radius={[10, 10, 0, 0]}
              label={{
                position: "top",
                formatter: (value, entry) =>
                  `S/. ${((entry?.base || 0) + value).toFixed(2)}`,
                fontSize: 13,
                fontWeight: 600,
                fill: "var(--text)",
                offset: 8,
              }}
            >
              <Cell fill={COLORS.real_fuga} />
              <Cell fill={COLORS.ia_fuga} />
              <LabelList
                dataKey="fuga"
                position="center"
                formatter={(v) => `S/. ${Number(v).toFixed(2)}`}
                style={{ fontSize: 10, fontWeight: 600, fill: "#7f1d1d" }}
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
