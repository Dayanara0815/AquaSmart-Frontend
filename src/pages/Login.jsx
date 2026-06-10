import { useState } from "react";
import { LogIn, Droplets, Shield, Home, ShoppingBag, Map, Eye, EyeOff } from "lucide-react";
import { api } from "../api/Aquasmart";

export function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Registro de nuevos vecinos y roles
  const [isRegister, setIsRegister] = useState(false);
  const [regNombre, setRegNombre] = useState("");
  const [regPaterno, setRegPaterno] = useState("");
  const [regMaterno, setRegMaterno] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regRole, setRegRole] = useState("DOMESTICO");

  const handleLogin = async (targetEmail, targetPassword) => {
    if (!targetEmail.trim() || !targetPassword.trim()) {
      setError("Por favor, ingresa tu correo y contraseña.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail.trim())) {
      setError("El formato del correo electrónico es inválido.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.loginUser(targetEmail.trim(), targetPassword.trim());
      if (res && !res.error) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("userEmail", res.email);
        localStorage.setItem("userRole", res.rol);
        localStorage.setItem("userFullName", res.fullName);
        localStorage.setItem("userFotoPerfil", res.fotoPerfil || "");
        onLoginSuccess(res);
      } else {
        setError(res.message || "Correo o contraseña incorrectos.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    void handleLogin(email, password);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regNombre.trim() || !regPaterno.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setError("Por favor, completa todos los campos obligatorios (*).");
      return;
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!nameRegex.test(regNombre.trim())) {
      setError("El nombre solo debe contener letras y espacios.");
      return;
    }
    if (!nameRegex.test(regPaterno.trim())) {
      setError("El apellido paterno solo debe contener letras y espacios.");
      return;
    }
    if (regMaterno.trim() && !nameRegex.test(regMaterno.trim())) {
      setError("El apellido materno solo debe contener letras y espacios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setError("El formato del correo electrónico es inválido.");
      return;
    }

    if (regPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError("Las contraseñas ingresadas no coinciden.");
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
        contrasena: regPassword.trim(),
        rol: regRole,
      });

      if (res && !res.error) {
        localStorage.setItem("token", res.token);
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
          maxWidth: "460px",
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          zIndex: 1,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div className="p-4 p-md-5 d-flex flex-column justify-content-center position-relative" style={{ zIndex: 1 }}>
          <div className="d-flex flex-column align-items-center mb-4">
            <div
              className="rounded-3 p-2.5 d-flex align-items-center justify-content-center mb-3"
              style={{
                background: "rgba(59, 130, 246, 0.18)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              <Droplets size={32} className="text-info" />
            </div>
            <h3 className="fw-extrabold tracking-wider mb-1" style={{ letterSpacing: 0.5 }}>
              AquaSmart
            </h3>
            <span className="text-white-50 small" style={{ fontSize: 13 }}>
              Monitoreo IoT y Justicia Hídrica
            </span>
          </div>

          {!isRegister ? (
            <>
              <div className="mb-4 text-center">
                <h4 className="fw-bold text-white mb-1.5" style={{ letterSpacing: "-0.5px" }}>Iniciar Sesión</h4>
                <p className="text-white-50 small mb-0" style={{ fontSize: 12.5 }}>
                  Ingresa tus credenciales para acceder al sistema.
                </p>
              </div>

              {error && (
                <div className="alert alert-danger py-2.5 px-3 rounded-3 border-0 small mb-4" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#fca5a5" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label text-white-50 mb-1" style={{ fontSize: 11.5 }}>Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
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
                <div>
                  <label className="form-label text-white-50 mb-1" style={{ fontSize: 11.5 }}>Contraseña</label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-control rounded-3 py-2.5 text-white border-0 pe-5"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        fontSize: 13,
                        outline: "none",
                      }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="btn position-absolute top-50 translate-middle-y end-0 text-white-50 border-0 bg-transparent py-0 px-3"
                      style={{ zIndex: 10, outline: "none", boxShadow: "none" }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  className="btn btn-primary w-100 rounded-3 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-semibold mt-2"
                  style={{ fontSize: 13.5, background: "#2563eb", border: "0" }}
                >
                  <LogIn size={16} />
                  {loading ? "Iniciando sesión..." : "Ingresar"}
                </button>
              </form>

              {/* Botón para alternar a Registro */}
              <div className="text-center mt-4" style={{ fontSize: 13 }}>
                <span className="text-white-50">¿Eres un vecino nuevo? </span>
                <button
                  onClick={() => {
                    setIsRegister(true);
                    setError("");
                  }}
                  className="btn btn-link text-info p-0 ms-1 fw-bold text-decoration-none"
                  style={{ fontSize: 13 }}
                >
                  Regístrate aquí
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 text-center">
                <h4 className="fw-bold text-white mb-1.5" style={{ letterSpacing: "-0.5px" }}>Nuevo Registro</h4>
                <p className="text-white-50 small mb-0" style={{ fontSize: 12.5 }}>
                  Crea tu cuenta vecinal de AquaSmart.
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
                      placeholder="ej. juan.quispe@correo.com"
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
                    <label className="form-label text-white-50 mb-1" style={{ fontSize: 11.5 }}>Contraseña *</label>
                    <div className="position-relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mín. 6 caracteres"
                        className="form-control rounded-3 py-2 text-white border-0 pe-5"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          fontSize: 13,
                          width: "100%",
                        }}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="btn position-absolute top-50 translate-middle-y end-0 text-white-50 border-0 bg-transparent py-0 px-2.5"
                        style={{ zIndex: 10, outline: "none", boxShadow: "none" }}
                      >
                        {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-white-50 mb-1" style={{ fontSize: 11.5 }}>Confirmar Contraseña *</label>
                    <div className="position-relative">
                      <input
                        type={showRegConfirmPassword ? "text" : "password"}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        className="form-control rounded-3 py-2 text-white border-0 pe-5"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          fontSize: 13,
                          width: "100%",
                        }}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="btn position-absolute top-50 translate-middle-y end-0 text-white-50 border-0 bg-transparent py-0 px-2.5"
                        style={{ zIndex: 10, outline: "none", boxShadow: "none" }}
                      >
                        {showRegConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
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
                  {loading ? "Registrando..." : "Registrar y Acceder"}
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
  );
}
