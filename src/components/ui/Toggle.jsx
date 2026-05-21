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
}) {
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