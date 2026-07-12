import { useEffect, useState, useContext } from "react";
import { User, Upload, Eye } from "lucide-react";
import { api } from "../api/Aquasmart";
import { ThemeContext } from "../contexts/ThemeContext";

const DEFAULT_SETTINGS = {
  airAlertsEnabled: true,
  leakAlertsEnabled: true,
  nightSilenceEnabled: true,
  silentFrom: "22:00",
  silentTo: "08:00",
  criticalOverrideEnabled: true,
};

export function Ajustes() {
  const { daltonismEnabled, toggleDaltonism } = useContext(ThemeContext);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Estados de perfil de usuario
  const [userEmail, setUserEmail] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoMessage, setPhotoMessage] = useState(null);

  useEffect(() => {
    let active = true;

    // Inicializar datos del usuario actual
    setUserEmail(localStorage.getItem("userEmail") || "");
    setUserFullName(localStorage.getItem("userFullName") || "");
    setFotoPerfil(localStorage.getItem("userFotoPerfil") || "");

    const load = async () => {
      try {
        const response = await api.getNotificationSettings();
        if (!active) return;
        setSettings({ ...DEFAULT_SETTINGS, ...response });
      } catch {
        if (!active) return;
        setSettings(DEFAULT_SETTINGS);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setPhotoMessage({ type: "error", text: "El archivo supera el límite recomendado de 2MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      setFotoPerfil(base64String);
      setPhotoMessage(null);
      await saveProfilePhoto(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setFotoPerfil("");
    setPhotoMessage(null);
    await saveProfilePhoto("");
  };

  const saveProfilePhoto = async (base64) => {
    setPhotoSaving(true);
    try {
      const res = await api.updateProfilePicture(userEmail, base64);
      if (res && !res.error) {
        localStorage.setItem("userFotoPerfil", base64);
        setPhotoMessage({ type: "success", text: "¡Foto de perfil guardada con éxito en PostgreSQL! Recargando interfaz..." });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setPhotoMessage({ type: "error", text: res.message || "Error al actualizar la foto en la base de datos." });
      }
    } catch (err) {
      setPhotoMessage({ type: "error", text: "Error de conexión al guardar la foto de perfil." });
    } finally {
      setPhotoSaving(false);
    }
  };

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await api.updateNotificationSettings(settings);
      setSettings((current) => ({ ...current, ...response }));
      setMessage("Configuración de notificaciones actualizada correctamente.");
    } catch (error) {
      setMessage(error.message || "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-muted">Cargando ajustes...</div>;
  }

  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Ajustes de la Cuenta</h3>
        <div className="text-muted">Gestiona tu foto de perfil y tus preferencias del medidor</div>
      </div>

      {/* Tarjeta de Perfil de Usuario */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mx-auto mb-4" style={{ maxWidth: 760 }}>
        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
          <User size={20} className="text-primary" />
          Mi Perfil de Usuario
        </h5>

        <div className="row align-items-center g-4">
          <div className="col-12 col-sm-3 d-flex justify-content-center">
            <div 
              className="position-relative rounded-circle overflow-hidden border border-2 border-primary d-flex align-items-center justify-content-center bg-light shadow-sm"
              style={{ width: 110, height: 110 }}
            >
              {fotoPerfil ? (
                <img 
                  src={fotoPerfil} 
                  alt="Vista previa" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              ) : (
                <div className="text-center text-muted">
                  <User size={48} className="opacity-50" />
                </div>
              )}
            </div>
          </div>

          <div className="col-12 col-sm-9 text-center text-sm-start">
            <h5 className="fw-bold mb-1">{userFullName || "Usuario AquaSmart"}</h5>
            <p className="text-muted small mb-3">{userEmail || "correo@ejemplo.com"}</p>

            <div className="d-flex flex-column gap-2 align-items-center align-items-sm-start">
              <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center justify-content-sm-start">
                <label className="btn btn-primary btn-sm rounded-3 px-3 py-2 cursor-pointer position-relative mb-0 d-flex align-items-center gap-2">
                  <Upload size={14} />
                  <span>Subir Foto desde PC</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="d-none" 
                    onChange={handleFileChange}
                    disabled={photoSaving}
                  />
                </label>

                {fotoPerfil && (
                  <button 
                    onClick={handleRemovePhoto} 
                    className="btn btn-outline-danger btn-sm rounded-3 px-3 py-2"
                    disabled={photoSaving}
                  >
                    Eliminar Foto
                  </button>
                )}
              </div>
              <small className="text-muted" style={{ fontSize: 11 }}>
                Tamaño máximo recomendado: 2MB. La foto se guardará de forma permanente en la BD.
              </small>
            </div>
          </div>
        </div>

        {photoMessage && (
          <div className={`alert ${photoMessage.type === "success" ? "alert-success" : "alert-danger"} mt-3 mb-0 py-2 px-3 rounded-3`} style={{ fontSize: 13.5 }}>
            {photoMessage.text}
          </div>
        )}
      </div>

      {/* Tarjeta de Notificaciones */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mx-auto" style={{ maxWidth: 760 }}>
        <div className="d-flex flex-column gap-3">
          <label className="d-flex align-items-center justify-content-between gap-3">
            <span>Alertar por paso de aire</span>
            <input
              type="checkbox"
              className="form-check-input"
              checked={settings.airAlertsEnabled}
              onChange={(e) => updateField("airAlertsEnabled", e.target.checked)}
            />
          </label>

          <label className="d-flex align-items-center justify-content-between gap-3">
            <span>Alertar por fuga</span>
            <input
              type="checkbox"
              className="form-check-input"
              checked={settings.leakAlertsEnabled}
              onChange={(e) => updateField("leakAlertsEnabled", e.target.checked)}
            />
          </label>

          <label className="d-flex align-items-center justify-content-between gap-3">
            <span>Horario de silencio</span>
            <input
              type="checkbox"
              className="form-check-input"
              checked={settings.nightSilenceEnabled}
              onChange={(e) => updateField("nightSilenceEnabled", e.target.checked)}
            />
          </label>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Silenciar desde</label>
              <input
                type="time"
                className="form-control"
                value={settings.silentFrom}
                onChange={(e) => updateField("silentFrom", e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Silenciar hasta</label>
              <input
                type="time"
                className="form-control"
                value={settings.silentTo}
                onChange={(e) => updateField("silentTo", e.target.value)}
              />
            </div>
          </div>

          <label className="d-flex align-items-center justify-content-between gap-3">
            <span>Ignorar silencio en eventos críticos</span>
            <input
              type="checkbox"
              className="form-check-input"
              checked={settings.criticalOverrideEnabled}
              onChange={(e) => updateField("criticalOverrideEnabled", e.target.checked)}
            />
          </label>

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 pt-2">
            <div className="text-muted small">Los cambios se guardan en la sesión actual de prueba.</div>
            <button className="btn btn-primary px-4" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>

          {message && <div className="alert alert-info mb-0">{message}</div>}
        </div>
      </div>

      {/* Tarjeta de Accesibilidad */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mx-auto mt-4" style={{ maxWidth: 760 }}>
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <Eye size={20} className="text-primary" />
          Accesibilidad y Ayuda Visual
        </h5>
        
        <div className="p-3 bg-light rounded-3 mb-3 border border-light">
          <div className="fw-semibold text-dark mb-1">¿Tienes problemas con los colores?</div>
          <div className="text-muted small" style={{ lineHeight: 1.5 }}>
            Permítenos ayudarte: Si eres daltonico o tienes dificultades para percibir o distinguir ciertos colores (como el rojo y el verde), activa esta opción para aplicar colores de alto contraste que faciliten tu navegación.
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between">
          <span className="fw-medium">Activar Modo Daltonismo</span>
          <div className="form-check form-switch mb-0">
            <input
              type="checkbox"
              className="form-check-input cursor-pointer"
              id="daltonism-toggle"
              checked={daltonismEnabled}
              onChange={(e) => toggleDaltonism(e.target.checked)}
              style={{ width: "2.8em", height: "1.4em" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}