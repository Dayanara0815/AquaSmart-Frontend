import { Megaphone } from "lucide-react";

export function WaterCutAlert({ alert }) {
  if (!alert?.active) return null;

  return (
    <div
      className="d-flex align-items-center gap-3 rounded-3 px-4 py-3 mb-3"
      style={{ background: "var(--warn-bg)", border: "1px solid var(--warn-border)" }}
    >
      <Megaphone size={22} color="var(--warn-text)" />
      <span className="fw-bold" style={{ fontSize: 14, color: "var(--text)" }}>
        {alert.message}
      </span>
      <span className="ms-auto text-muted text-nowrap" style={{ fontSize: 13 }}>
        {alert.schedule}
      </span>
    </div>
  );
}