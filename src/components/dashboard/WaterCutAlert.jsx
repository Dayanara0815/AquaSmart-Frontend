import { Megaphone } from "lucide-react";

export function WaterCutAlert({ alert }) {
  if (!alert?.active) return null;

  return (
    <div
      className="d-flex align-items-center gap-3 rounded-3 px-4 py-3 mb-3"
      style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
    >
      <Megaphone size={22} color="#d97706" />
      <span className="fw-bold text-dark" style={{ fontSize: 14 }}>
        {alert.message}
      </span>
      <span className="ms-auto text-muted text-nowrap" style={{ fontSize: 13 }}>
        {alert.schedule}
      </span>
    </div>
  );
}