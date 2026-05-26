import { useState } from "react";
import { LogIn, Droplets, Shield, Home, ShoppingBag, Map } from "lucide-react";
import { api } from "../api/Aquasmart";

export function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Registro de nuevos vecinos y roles
  const [isRegister, setIsRegister] = useState(false);
  const [regNombre, setRegNombre] = useState("");
  const [regPaterno, setRegPaterno] = useState("");
  const [regMaterno, setRegMaterno] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState("DOMESTICO");

  const USERS = [
    {
      name: "María Fernanda Quispe",
      email: "maria.quispe@example.com",
      role: "DOMESTICO",
      label: "Vecino Doméstico",
      desc: "Monitoreo, válvula solenoide, presencia y asistente IA.",
      icon: Home,
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.15)",
    },
    {
      name: "Luis Condori",
      email: "luis.condori@example.com",
      role: "COMERCIO",
      label: "Pequeño Comercio",
      desc: "Protección de maquinaria y análisis de costos en lavanderías.",
      icon: ShoppingBag,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.15)",
    },
    {
      name: "Carlos Mendoza",
      email: "carlos.mendoza@example.com",
      role: "TECNICO",
      label: "Técnico Sedapal",
      desc: "Auditoría de presiones, estado de medidores y validación de reclamos.",
      icon: Shield,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.15)",
    },
    {
      name: "Alexis Maza",
      email: "alexis.maza@example.com",
      role: "MUNICIPAL",
      label: "Gestor Municipal",
      desc: "Monitoreo urbano, roturas de matrices y bacheo en vía pública.",
      icon: Map,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.15)",
    },
  ];

  const handleLogin = async (targetEmail) => {
    setLoading(true);
    setError("");
    try {
      const user = await api.getCurrentUser(targetEmail);
      if (user && !user.error) {
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userRole", user.rol);
        localStorage.setItem("userFullName", user.fullName);
        localStorage.setItem("userFotoPerfil", user.fotoPerfil || "");
        onLoginSuccess(user);
      } else {
        setError("Usuario no encontrado en la base de datos PostgreSQL.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    void handleLogin(email.trim());
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regNombre.trim() || !regPaterno.trim() || !regEmail.trim()) {
      setError("Por favor, completa los campos obligatorios (*).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.registerUser({
        nombre: regNombre.trim(),
        apellidoPaterno: regPaterno.trim(),
        apellidoMaterno: regMaterno.trim(),
        correo: regEmail.trim(),
        rol: regRole,
      });

      if (res && !res.error) {
        localStorage.setItem("userEmail", res.email);
        localStorage.setItem("userRole", res.rol);
        localStorage.setItem("userFullName", res.fullName);
        localStorage.setItem("userFotoPerfil", res.fotoPerfil || "");
        onLoginSuccess(res);
      } else {
        setError(res.message || "Error al registrar en PostgreSQL.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 px-3 text-white"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        fontFamily: "'Inter', sans-serif",
        color: "#ffffff",
        "--text": "#ffffff",
        "--muted": "rgba(255, 255, 255, 0.5)",
      }}
    >
      <div
        className="card border-0 rounded-4 shadow-lg overflow-hidden position-relative"
        style={{
          width: 800,
          maxWidth: "100%",
          background: "rgba(30, 41, 59, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="row g-0">
          {/* Lado izquierdo - Presentación del Proyecto */}
          <div
            className="col-12 col-md-5 d-none d-md-flex flex-column justify-content-between p-5 text-white"
            style={{
              background: "linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)",
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-4">
                <Droplets size={32} className="text-info" />
                <span className="fs-3 fw-bold" style={{ letterSpacing: 0.5 }}>
                  AquaSmart
                </span>
              </div>
              <h3 className="fw-bold mb-3">Justicia Hídrica y Monitoreo IoT</h3>
              <p className="text-white-50" style={{ fontSize: 13, lineHeight: 1.6 }}>
                Plataforma web con Inteligencia Artificial para la detección temprana de fugas, control preventivo de la red y generación de evidencias.
              </p>
            </div>
            <div>
              <small className="text-white-50">UTP - Diseño de Productos y Servicios</small>
            </div>
          </div>

          {/* Lado derecho - Login Form / Roles Select / Registro */}
          <div className="col-12 col-md-7 p-4 p-md-5 text-white d-flex flex-column justify-content-center">
            {!isRegister ? (
              <>
                <div className="text-center text-md-start mb-4">
                  <h4 className="fw-bold text-white mb-1">Iniciar Sesión</h4>
                  <p className="text-white-50" style={{ fontSize: 13 }}>
                    Selecciona un rol académico para interactuar con la plataforma AquaSmart.
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 px-3 rounded-3" style={{ fontSize: 13 }}>
                    {error}
                  </div>
                )}

                {/* Listado de roles interactivos */}
                <div className="d-flex flex-column gap-2 mb-3">
                  {USERS.map((user) => {
                    const Icon = user.icon;
                    return (
                      <button
                        key={user.email}
                        onClick={() => void handleLogin(user.email)}
                        disabled={loading}
                        className="btn text-start border-0 rounded-4 p-3 d-flex align-items-center gap-3 text-white"
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                          e.currentTarget.style.border = `1px solid ${user.color}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                          e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.05)";
                        }}
                      >
                        <div
                          className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                          style={{ backgroundColor: user.bgColor, color: user.color }}
                        >
                          <Icon size={22} />
                        </div>
                        <div className="flex-fill">
                          <div className="d-flex align-items-center justify-content-between">
                            <span className="fw-semibold text-white" style={{ fontSize: 14 }}>
                              {user.name}
                            </span>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: user.bgColor,
                                color: user.color,
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              {user.label}
                            </span>
                          </div>
                          <p className="text-white-50 mb-0 mt-1" style={{ fontSize: 11, lineHeight: 1.4 }}>
                            {user.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Formulario alternativo por credenciales */}
                <div className="d-flex align-items-center gap-2 my-2 text-white-50" style={{ fontSize: 12 }}>
                  <hr className="flex-fill border-light opacity-25" />
                  <span>O INGRESA CON CORREO</span>
                  <hr className="flex-fill border-light opacity-25" />
                </div>

                <form onSubmit={handleSubmit} className="mt-1">
                  <div className="mb-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@usuario.com"
                      className="form-control rounded-3 py-2 text-white border-0"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        fontSize: 13,
                      }}
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="btn btn-primary w-100 rounded-3 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    style={{ fontSize: 14 }}
                  >
                    <LogIn size={18} />
                    {loading ? "Iniciando..." : "Ingresar con correo"}
                  </button>
                </form>

                {/* Botón para alternar a Registro */}
                <div className="text-center mt-3" style={{ fontSize: 13.5 }}>
                  <span className="text-white-50">¿Quieres agregar un vecino o rol? </span>
                  <button
                    onClick={() => {
                      setIsRegister(true);
                      setError("");
                    }}
                    className="btn btn-link text-info p-0 ms-1 fw-bold text-decoration-none"
                    style={{ fontSize: 13.5 }}
                  >
                    Regístralo Aquí
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center text-md-start mb-4">
                  <h4 className="fw-bold text-white mb-1">Registrar Nuevo Vecino/Rol</h4>
                  <p className="text-white-50" style={{ fontSize: 13 }}>
                    Ingresa los datos para guardarlos de forma persistente en PostgreSQL.
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 px-3 rounded-3" style={{ fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="d-flex flex-column gap-3">
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-white-50 mb-1" style={{ fontSize: 12 }}>Nombre *</label>
                      <input
                        type="text"
                        required
                        value={regNombre}
                        onChange={(e) => setRegNombre(e.target.value)}
                        placeholder="ej. Juan"
                        className="form-control rounded-3 py-2 text-white border-0"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          fontSize: 13,
                        }}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-white-50 mb-1" style={{ fontSize: 12 }}>Apellido Paterno *</label>
                      <input
                        type="text"
                        required
                        value={regPaterno}
                        onChange={(e) => setRegPaterno(e.target.value)}
                        placeholder="ej. Quispe"
                        className="form-control rounded-3 py-2 text-white border-0"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          fontSize: 13,
                        }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-white-50 mb-1" style={{ fontSize: 12 }}>Apellido Materno</label>
                      <input
                        type="text"
                        value={regMaterno}
                        onChange={(e) => setRegMaterno(e.target.value)}
                        placeholder="ej. Flores"
                        className="form-control rounded-3 py-2 text-white border-0"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          fontSize: 13,
                        }}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-white-50 mb-1" style={{ fontSize: 12 }}>Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="ej. juan.quispe@example.com"
                        className="form-control rounded-3 py-2 text-white border-0"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          fontSize: 13,
                        }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-white-50 mb-1" style={{ fontSize: 12 }}>Rol en el Sistema *</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="form-select rounded-3 py-2 text-white border-0"
                      style={{
                        backgroundColor: "rgba(30, 41, 59, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        fontSize: 13,
                      }}
                      disabled={loading}
                    >
                      <option value="DOMESTICO" className="bg-dark">Vecino (Uso Doméstico)</option>
                      <option value="COMERCIO" className="bg-dark">Pequeño Comercio (Lavandería)</option>
                      <option value="TECNICO" className="bg-dark">Técnico de Campo (Sedapal)</option>
                      <option value="MUNICIPAL" className="bg-dark">Gestor Municipal (Vigilancia)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-success w-100 rounded-3 py-2 fw-semibold mt-2"
                    style={{ fontSize: 14 }}
                  >
                    {loading ? "Registrando..." : "Registrar y Acceder ✓"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError("");
                    }}
                    className="btn btn-link text-white-50 text-decoration-none fw-semibold p-0 mt-1"
                    style={{ fontSize: 13.5 }}
                    disabled={loading}
                  >
                    Volver a Iniciar Sesión
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
