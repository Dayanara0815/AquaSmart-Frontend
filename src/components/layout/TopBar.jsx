import { Menu, Bell, User } from "lucide-react";

export function TopBar({ onMenuToggle }) {
  return (
    <header
      className="d-flex align-items-center justify-content-between bg-white border-bottom"
      style={{ height: 64, paddingLeft: 32, paddingRight: 32 }}
    >
      <div className="d-flex align-items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="btn btn-sm d-lg-none border-0 bg-transparent"
        >
          <Menu size={20} />
        </button>
        <span className="fw-bold text-primary" style={{ fontSize: 22 }}>
          AquaSmart
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2" style={{ fontSize: 14 }}>
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 32, height: 32, background: "#f3f4f6" }}
          >
            <User size={16} color="#6b7280" />
          </div>
          <span className="fw-medium text-dark">Usuario X</span>
        </div>

        <div className="position-relative">
          <button
            className="d-flex align-items-center justify-content-center border-0 rounded-circle bg-transparent p-0"
            style={{ width: 36, height: 36 }}
          >
            <Bell size={20} color="#6b7280" />
          </button>
          <span
            className="position-absolute bg-danger rounded-circle"
            style={{ width: 8, height: 8, top: 4, right: 4 }}
          />
        </div>
      </div>
    </header>
  );
}