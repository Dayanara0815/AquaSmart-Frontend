import { Droplets, Calendar } from "lucide-react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";

import { Toggle } from "../ui/Toggle";
import { StatCard } from "../ui/StatCard";

// Componente del medidor circular
function WaterGauge({ liters, maxLiters = 300 }) {
  // Calcula porcentaje del consumo
  const percentage = Math.min((liters / maxLiters) * 100, 100);

  return (
    <div
      style={{
        width: 120,
        height: 120,
        position: "relative",
      }}
    >
      {/* Círculo de progreso */}
      <CircularProgressbar
        value={percentage}
        styles={buildStyles({
          // Color progreso
          pathColor: "#3b82f6",

          // Fondo gris
          trailColor: "#e5e7eb",

          // Línea redondeada
          strokeLinecap: "round",
        })}
      />

      {/* Ícono centrado */}
      <div className="position-absolute top-50 start-50 translate-middle">
        <Droplets size={30} color="#60a5fa" />
      </div>
    </div>
  );
}

// Card principal
export function WaterStatusCard({ data, onToggleValve, onTogglePresence }) {
  return (
    <div className="card border rounded-4 p-4 h-100">
      {/* Estado */}
      <div className="text-center mb-2">
        <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
          <span className="text-muted" style={{ fontSize: 13 }}>
            Estado:
          </span>

          {/* Badge de estado */}
          <span
            className="badge rounded-pill px-3 py-2"
            style={{
              backgroundColor: "#dcfce7",
              color: "#15803d",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {data.status}
          </span>
        </div>

        {/* Litros consumidos hoy */}
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
          {data.litersToday} Litros hoy
        </p>
      </div>

      {/* Medidor circular */}
      <div className="d-flex justify-content-center my-3">
        <WaterGauge liters={data.litersToday} />
      </div>

      {/* Card de costo */}
      <div
        className="text-center rounded-4 py-3 mb-3"
        style={{
          background: "rgba(59,130,246,.08)",
        }}
      >
        <p
          className="text-uppercase fw-semibold mb-1"
          style={{
            fontSize: 11,
            letterSpacing: 1,
            color: "#64748b",
          }}
        >
          Costo De Hoy
        </p>

        <h4 className="fw-bold mb-0" style={{ color: "#2563eb" }}>
          S/. {data.costToday.toFixed(2)}
        </h4>
      </div>

      {/* Toggles */}
      <div className="d-flex flex-column gap-2 mb-3">
        {/* Toggle válvula */}
        <div className="d-flex align-items-center justify-content-between">
          <span style={{ fontSize: 13 }} className="text-secondary">
            Estado de Válvula:{" "}
            <span className="text-dark">
              {data.valveOpen ? "Abierto" : "Cerrado"}
            </span>
          </span>

          <Toggle checked={data.valveOpen} onChange={onToggleValve} />
        </div>

        {/* Toggle presencia */}
        <div className="d-flex align-items-center justify-content-between">
          <span style={{ fontSize: 13 }} className="text-secondary">
            Se encuentra en casa:{" "}
            <span className="text-dark">{data.isHome ? "Sí" : "No"}</span>
          </span>

          <Toggle checked={data.isHome} onChange={onTogglePresence} />
        </div>

        {/* Última actualización */}
        <p className="text-muted mb-0" style={{ fontSize: 11 }}>
          Última actualización: {data.lastUpdated}
        </p>
      </div>

      {/* Estadísticas */}
      <div className="d-flex gap-3">
        <StatCard
          icon={Droplets}
          label="USO ACTUAL"
          value={data.currentFlow}
          unit="L/min"
        />

        <StatCard
          icon={Calendar}
          label="USO DE HOY"
          value={data.litersToday}
          unit="L"
        />
      </div>
    </div>
  );
}
