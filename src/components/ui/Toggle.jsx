import { Moon, Sun } from "lucide-react";

/**
 * Toggle.jsx
 * Componente reutilizable tipo switch ON/OFF.
 *
 * Props:
 * - checked: estado actual del switch (true/false)
 * - onChange: función que se ejecuta al cambiar el estado
 * - disabled: deshabilita el switch (opcional)
 */

export function Toggle({
  checked,
  onChange,
  disabled = false,
  mode = "switch",
}) {
  if (mode === "theme") {
    const iconColor = "var(--text)";
    const bg = "var(--surface-soft, #f1f5f9)";

    return (
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        aria-label={checked ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        title={checked ? "Cambiar a claro" : "Cambiar a oscuro"}
        disabled={disabled}
        className="d-inline-flex align-items-center justify-content-center border-0 rounded-pill"
        style={{
          width: 42,
          height: 28,
          background: bg,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.2s ease",
        }}
      >
        {checked ? <Sun size={16} color={iconColor} /> : <Moon size={16} color={iconColor} />}
      </button>
    );
  }

  return (
    <div

      // Accesibilidad:
      // indica que este elemento funciona como un switch.
      role="switch"

      // Indica si el switch está activado o no.
      aria-checked={checked}

      // Cuando se hace click:
      // - verifica que NO esté deshabilitado
      // - cambia el estado actual
      onClick={() =>
        !disabled && onChange(!checked)
      }

      // Estilos del contenedor principal del switch.
      style={{

        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked
          ? "#3b82f6"
          : "#d1d5db",
        position: "relative",
        cursor: disabled
          ? "not-allowed"
          : "pointer",

        // Reduce opacidad si disabled=true.
        opacity: disabled ? 0.5 : 1,

        // Animación suave del fondo.
        transition: "background 0.2s",

        // Evita que el componente se reduzca
        // dentro de contenedores flex.
        flexShrink: 0,
      }}
    >

      {/* Bolita blanca del switch */}
      <span
        style={{
          // Permite mover libremente la bolita
          // dentro del contenedor.
          position: "absolute",
          // Posición vertical.
          top: 3,
          // Posición horizontal dinámica:
          // derecha = activo
          // izquierda = apagado
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}