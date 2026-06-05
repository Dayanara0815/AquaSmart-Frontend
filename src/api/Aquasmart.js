// URL base de la API.
// Primero intenta usar la variable de entorno VITE_API_URL.
// Si no existe, usa localhost como fallback.
const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";


// Función genérica para hacer peticiones HTTP al backend.
// endpoint -> ruta específica (ej: /alerts)
// options -> configuración extra (method, body, headers, etc.)
async function request(endpoint, options = {}) {

  // Obtiene el token JWT guardado en el navegador.
  // Si el usuario inició sesión, aquí estará almacenado.
  const token = localStorage.getItem("token");


  // Hace la petición HTTP usando fetch.
  const res = await fetch(`${BASE_URL}${endpoint}`, {

    // Configuración de headers.
    headers: {

      // Indica que enviaremos/recibiremos JSON.
      "Content-Type": "application/json",

      // Si existe token:
      // agrega Authorization: Bearer <token>
      // Si no existe, no agrega nada.
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),

      // Permite agregar headers extra desde options.
      ...options.headers,
    },

    // Agrega configuraciones extra:
    // method, body, etc.
    ...options,
  });


  // Si la respuesta NO fue exitosa (404, 500, 401, etc.)
  // lanza un error.
  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }


  // Convierte la respuesta JSON del backend
  // a objeto JavaScript.
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  return null;
}

async function requestText(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }

  return res.text();
}


// Objeto que agrupa todas las funciones de la API.
export const api = {

  // GET /water/status
  // Obtiene estado del agua.
  getWaterStatus: (email) => {
    const suffix = email ? `?email=${encodeURIComponent(email)}` : "";
    return request(`/water/status${suffix}`);
  },


  // GET /ai/projection
  // Obtiene proyección o análisis IA.
  getAIProjection: (email) => {
    const suffix = email ? `?email=${encodeURIComponent(email)}` : "";
    return request(`/ai/projection${suffix}`);
  },


  // GET /alerts
  // Obtiene alertas del sistema.
  getAlerts: () =>
    request("/alerts"),

  // GET /water/medidores
  // Obtiene lista de medidores y sensores reales.
  getMedidores: () =>
    request("/water/medidores"),

  // GET /user/current
  // Obtiene información básica del usuario (titular) conectado.
  getCurrentUser: (email) => {
    const suffix = email ? `?email=${encodeURIComponent(email)}` : "";
    return request(`/user/current${suffix}`);
  },

  // GET /user/theme
  getUserTheme: () =>
    request("/user/theme"),

  // POST /user/theme
  setUserTheme: (theme) =>
    request("/user/theme", {
      method: "POST",
      body: JSON.stringify({ theme }),
    }),

  // POST /user/register
  registerUser: (userData) =>
    request("/user/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  updateProfilePicture: (email, fotoPerfil) =>
    request("/user/profile-picture", {
      method: "POST",
      body: JSON.stringify({ email, fotoPerfil }),
    }),

  reportMunicipalLeak: (payload) => {
    const body = typeof payload === "string" ? { location: payload } : payload;
    return request("/alerts/municipal", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateAlertStatus: (id, status) =>
    request(`/alerts/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),


  // GET /alerts/{index}
  // Obtiene el detalle de una alerta específica.
  getAlertDetail: (index) =>
    request(`/alerts/${index}`),


  // GET /water/valve/history
  // Obtiene el historial de cierres de la válvula.
  getValveHistory: () =>
    request("/water/valve/history"),


  // GET /reports/weekly
  // Obtiene el historial semanal de consumo.
  getWeeklyReport: (from, to, email) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (email) params.set("email", email);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request(`/reports/weekly${suffix}`);
  },



  // GET /settings/notifications
  // Obtiene la configuración de notificaciones.
  getNotificationSettings: () =>
    request("/settings/notifications"),


  // PUT /settings/notifications
  // Actualiza la configuración de notificaciones.
  updateNotificationSettings: (settings) =>
    request("/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),


  // PUT /water/valve
  // Cambia estado de la válvula.
  // open puede ser true o false.
  setValve: (open, email) => {
    const suffix = email ? `?email=${encodeURIComponent(email)}` : "";
    return request(`/water/valve${suffix}`, {
      method: "PUT",
      body: JSON.stringify({ open }),
    });
  },


  // PUT /water/presence
  // Indica si hay personas en casa.
  setHomePresence: (home, email) => {
    const suffix = email ? `?email=${encodeURIComponent(email)}` : "";
    return request(`/water/presence${suffix}`, {
      method: "PUT",
      body: JSON.stringify({ home }),
    });
  },


  // PUT /water/autoclose
  // Configura si se debe cerrar automáticamente la válvula por fugas cuando se está en casa.
  setAutoClose: (autoClose, email) => {
    const suffix = email ? `?email=${encodeURIComponent(email)}` : "";
    return request(`/water/autoclose${suffix}`, {
      method: "PUT",
      body: JSON.stringify({ autoClose }),
    });
  },


  // POST /ai/chat
  // Envía una pregunta a la IA.
  askAI: (question, email, history) =>
    request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ question, email, history }),
    }),
};