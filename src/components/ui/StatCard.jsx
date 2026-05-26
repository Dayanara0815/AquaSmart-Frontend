/**
 * StatCard.jsx
 * Card reusable para mostrar una estadística con un ícono,
 * etiqueta y valor.
 */

export function StatCard({ icon: Icon, label, value, unit }) {
  return (
    <div
      className="flex-fill rounded-4 p-4 text-center"
      style={{
        background: "var(--accent-surface)",
        boxShadow: "0 4px 12px rgba(37,99,235,.10)",
        border: "1px solid var(--accent-border)",
      }}
    >
      {/* Ícono */}
      {Icon && (
        <Icon
          size={34}
          color="#2563eb"
          className="mb-2"
        />
      )}

      {/* Etiqueta */}
      <p
        className="fw-semibold mb-2"
        style={{
          fontSize: 12,
          color: "var(--subtle)",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </p>

      {/* Valor */}
      <h5
        className="fw-bold mb-0"
        style={{ color: "#2563eb" }}
      >
        {value}

        {/* Unidad opcional */}
        {unit && (
          <span
            className="fw-normal ms-1"
            style={{
              fontSize: 13,
              color: "var(--muted)",
            }}
          >
            {unit}
          </span>
        )}
      </h5>
    </div>
  );
}