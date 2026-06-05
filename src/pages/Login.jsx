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
      className="d-flex align-items-center justify-content-center min-vh-100 px-3 position-relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #070a13 0%, #0f172a 100%)",
        fontFamily: "'Inter', sans-serif",
        color: "#ffffff",
      }}
    >
      {/* BACKGROUND ORBS */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "50vw",
          height: "50vw",
          maxWidth: "600px",
          maxHeight: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-5%",
          width: "50vw",
          height: "50vw",
          maxWidth: "600px",
          maxHeight: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="card border-0 rounded-4 shadow-lg overflow-hidden position-relative w-100"
        style={{
          maxWidth: "920px",
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          zIndex: 1,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="row g-0">
          {/* Lado izquierdo - Presentación del Proyecto */}
          <div
            className="col-12 col-md-5 d-none d-md-flex flex-column justify-content-between p-5 text-white position-relative"
            style={{
              background: "linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)",
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Soft decorative light on the left side */}
            <div
              style={{
                position: "absolute",
                top: "20%",
                left: "20%",
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.2)",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />
            
            <div className="position-relative" style={{ zIndex: 1 }}>
              <div className="d-flex align-items-center gap-2.5 mb-4">
                <div
                  className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                  style={{
                    background: "rgba(59, 130, 246, 0.18)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <Droplets size={26} className="text-info" />
                </div>
                <span className="fs-4 fw-extrabold tracking-wider" style={{ letterSpacing: 0.5 }}>
                  AquaSmart
                </span>
              </div>
              <h4 className="fw-bold mb-3 mt-4" style={{ lineHeight: 1.3 }}>
                Monitoreo IoT y Justicia Hídrica
              </h4>
              <p className="text-white-50 small mb-4" style={{ lineHeight: 1.6 }}>
                Plataforma web con Inteligencia Artificial para la mitigación del cobro indebido de aire, auditoría de campo de Sedapal y detección automatizada de fugas silenciosas.
              </p>
              
              <div className="d-flex flex-column gap-3.5 mt-4">
                <div className="d-flex align-items-start gap-2">
                  <span className="text-info fw-bold">✓</span>
                  <span className="text-white-50" style={{ fontSize: 12 }}>Telemetría ultrasónica en tiempo real</span>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <span className="text-info fw-bold">✓</span>
                  <span className="text-white-50" style={{ fontSize: 12 }}>Bloqueo preventivo de paso de aire</span>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <span className="text-info fw-bold">✓</span>
                  <span className="text-white-50" style={{ fontSize: 12 }}>Asistencia de IA adaptada a cada rol</span>
                </div>
              </div>
            </div>
            
            <div className="position-relative mt-5" style={{ zIndex: 1 }}>
              <div className="border-top pt-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <span className="text-white-50 d-block" style={{ fontSize: 10, letterSpacing: 0.5 }}>PROYECTO ACADÉMICO</span>
                <strong style={{ fontSize: 11.5 }}>UTP - Diseño de Productos y Servicios</strong>
              </div>
            </div>
          </div>

          {/* Lado derecho - Login Form / Roles Select / Registro */}
          <div className="col-12 col-md-7 p-4 p-md-5 d-flex flex-column justify-content-center position-relative" style={{ zIndex: 1 }}>
            {!isRegister ? (
              <>
                <div className="mb-4 text-center text-md-start">
                  <h4 className="fw-bold text-white mb-1.5" style={{ letterSpacing: "-0.5px" }}>Iniciar Sesión</h4>
                  <p className="text-white-50 small" style={{ fontSize: 12.5 }}>
                    Elige un perfil para simular las interacciones de AquaSmart en Puente Piedra.
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger py-2.5 px-3 rounded-3 border-0 small mb-4" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5" }}>
                    {error}
                  </div>
                )}

                {/* Listado de roles en Cuadrícula Premium (2x2 Grid) */}
                <div className="row g-3 mb-4">
                  {USERS.map((user) => {
                    const Icon = user.icon;
                    return (
                      <div key={user.email} className="col-12 col-sm-6">
                        <button
                          type="button"
                          onClick={() => void handleLogin(user.email)}
                          disabled={loading}
                          className="btn text-start border-0 rounded-4 p-3 d-flex flex-column justify-content-between h-100 w-100 position-relative transition-all"
                          style={{
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            minHeight: "120px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                            e.currentTarget.style.border = `1px solid ${user.color}`;
                            e.currentTarget.style.transform = "translateY(-3px)";
                            e.currentTarget.style.boxShadow = `0 10px 20px -10px ${user.color}44`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                            e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.05)";
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center w-100 mb-2">
                            <div
                              className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                              style={{ backgroundColor: user.bgColor, color: user.color }}
                            >
                              <Icon size={18} />
                            </div>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: user.bgColor,
                                color: user.color,
                                fontSize: 9,
                                fontWeight: 700,
                              }}
                            >
                              {user.role}
                            </span>
                          </div>
                          <div>
                            <strong className="text-white d-block" style={{ fontSize: 13.5 }}>
                              {user.name}
                            </strong>
                            <span className="text-white-50 d-block mt-0.5" style={{ fontSize: 10.5, lineHeight: 1.3 }}>
                              {user.label}
                            </span>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Formulario alternativo por credenciales */}
                <div className="d-flex align-items-center gap-3 my-3 text-white-50" style={{ fontSize: 11, letterSpacing: 0.5 }}>
                  <hr className="flex-fill border-light opacity-10 m-0" />
                  <span>O INGRESA CON CORREO</span>
                  <hr className="flex-fill border-light opacity-10 m-0" />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@usuario.com"
                      className="form-control rounded-3 py-2.5 text-white border-0"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        fontSize: 13,
                        outline: "none",
                      }}
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="btn btn-primary w-100 rounded-3 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    style={{ fontSize: 13.5, background: "#2563eb", border: "0" }}
                  >
                    <LogIn size={16} />
                    {loading ? "Cargando..." : "Ingresar con correo"}
                  </button>
                </form>

                {/* Botón para alternar a Registro */}
                <div className="text-center mt-4" style={{ fontSize: 13 }}>
                  <span className="text-white-50">¿Deseas agregar un vecino o rol? </span>
                  <button
                    onClick={() => {
                      setIsRegister(true);
                      setError("");
                    }}
                    className="btn btn-link text-info p-0 ms-1 fw-bold text-decoration-none"
                    style={{ fontSize: 13 }}
                  >
                    Regístralo aquí
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 text-center text-md-start">
                  <h4 className="fw-bold text-white mb-1.5" style={{ letterSpacing: "-0.5px" }}>Nuevo Registro</h4>
                  <p className="text-white-50 small" style={{ fontSize: 12.5 }}>
                    Ingresa los datos para guardarlos en la base de datos de PostgreSQL.
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger py-2.5 px-3 rounded-3 border-0 small mb-4" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="d-flex flex-column gap-3">
                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-white-50 mb-1" style={{ fontSize: 11.5 }}>Nombre *</label>
                      <input
                        type="text"
                        required
                        value={regNombre}
                        onChange={(e) => setRegNombre(e.target.value)}
                        placeholder="ej. Juan"
                        className="form-control rounded-3 py-2 text-white border-0"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          fontSize: 13,
                        }}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-white-50 mb-1" style={{ fontSize: 11.5 }}>Apellido Paterno *</label>
                      <input
                        type="text"
                        required
                        value={regPaterno}
                        onChange={(e) => setRegPaterno(e.target.value)}
                        placeholder="ej. Quispe"
                        className="form-control rounded-3 py-2 text-white border-0"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          fontSize: 13,
                        }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-white-50 mb-1" style={{ fontSize: 11.5 }}>Apellido Materno</label>
                      <input
                        type="text"
                        value={regMaterno}
                        onChange={(e) => setRegMaterno(e.target.value)}
                        placeholder="ej. Flores"
                        className="form-control rounded-3 py-2 text-white border-0"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          fontSize: 13,
                        }}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label text-white-50 mb-1" style={{ fontSize: 11.5 }}>Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="ej. juan.quispe@example.com"
                        className="form-control rounded-3 py-2 text-white border-0"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          fontSize: 13,
                        }}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-white-50 mb-1" style={{ fontSize: 11.5 }}>Rol en el Sistema *</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="form-select rounded-3 py-2 text-white border-0"
                      style={{
                        backgroundColor: "#1e293b",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        fontSize: 13,
                      }}
                      disabled={loading}
                    >
                      <option value="DOMESTICO">Vecino (Uso Doméstico)</option>
                      <option value="COMERCIO">Pequeño Comercio (Lavandería)</option>
                      <option value="TECNICO">Técnico de Campo (Sedapal)</option>
                      <option value="MUNICIPAL">Gestor Municipal (Vigilancia)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-success w-100 rounded-3 py-2.5 fw-semibold mt-2 border-0"
                    style={{ fontSize: 13.5, backgroundColor: "#10b981" }}
                  >
                    {loading ? "Registrando..." : "Registrar y Acceder ✓"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError("");
                    }}
                    className="btn btn-link text-white-50 text-decoration-none fw-semibold p-0 mt-1 small"
                    style={{ fontSize: 13 }}
                    disabled={loading}
                  >
                    Volver a iniciar sesión
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
