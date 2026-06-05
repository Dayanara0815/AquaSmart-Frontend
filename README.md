<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Recharts-3182BD?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Recharts" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
</div>

<h1 align="center">🖥️ AquaSmart - Frontend (Panel Web de Control Hídrico)</h1>

<p align="center">
  Aplicación web interactiva, moderna y premium para la monitorización de telemetría, control de electroválvulas y auditoría técnica en AquaSmart.
</p>

<div align="center">
  <h3>
    <a href="https://aquasmart-1vhz.onrender.com">🚀 VER APLICACIÓN EN VIVO (DEPLOY EN RENDER)</a>
  </h3>
</div>

---

## 🌟 Sobre el Proyecto

El frontend de **AquaSmart** es una interfaz web de diseño sofisticado y premium construida con **React 18** y **Vite**. Incorpora efectos de *glassmorphism*, micro-animaciones fluidas y soporte multi-tema (claro/oscuro) adaptándose visualmente de forma impecable en computadoras y dispositivos móviles. Está diseñado bajo estándares WCAG para garantizar la legibilidad e interconexión fluida con la API del backend.

---

## ✨ Funcionalidades Principales

La interfaz cuenta con cuatro perfiles de usuario dinámicos (Vecino Doméstico, Comercio, Técnico de Campo y Gestor Municipal).

### 📊 Dashboard Residencial y Comercial
- **Métricas en Vivo:** Visualización del caudal actual (`L/min`), volumen acumulado diario (`L`) y costo monetario proyectado en tiempo real.
- **Control de Válvula & Presencia:** Conmutadores interactivos para abrir la válvula, notificar presencia en casa y activar la preferencia de **Cierre automático por fuga**.
- **Gráficos de Proyección IA:** Barras interactivas de Recharts sin ruido visual que detallan costos base y recargos por fugas de agua.

### 🤖 AquaBot (Chat con IA)
- **Cajón de Chat Responsivo:** Caja flotante optimizada para móviles que mantiene una conversación fluida y con memoria del historial en base de datos.
- **Sugerencias contextuales:** Chips con preguntas rápidas y guiadas basadas en el rol del usuario logueado.

### 👷 Panel de Trabajo JIRA (Técnico de Campo)
- **Tablero Kanban Interactivo:** Organización de tareas técnicas en 4 columnas.
- **Auditoría LegalTech:** Checklist interactivo obligatorio de tres pasos para habilitar el recálculo y la refacturación digital en el inspector de tickets.

### 📅 Calendario Municipal (Gestor)
- **Cronograma de Cortes:** Cuadrícula de fechas con puntos de colores adaptativos que indican incidentes y permiten programar mantenimientos de la red.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** React 18 & Vite
- **Visualización de Datos:** Recharts (SVG animados)
- **Generación de Reportes:** jsPDF & jsPDF-AutoTable
- **Estilos:** Vanilla CSS y Variables CSS dinámicas
- **Despliegue:** Render (Static Site)

---

## 🚀 Despliegue Local (Para Desarrolladores)

Si deseas levantar el frontend localmente en tu máquina:

1. **Clonar el repositorio:**
```bash
git clone https://github.com/Dayanara0815/AquaSmart.git
cd AquaSmart/Frontend
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar Variables de Entorno (Opcional):**
Crea un archivo `.env` en la raíz de la carpeta `Frontend`:
```env
VITE_API_URL=http://localhost:8080/api
```

4. **Ejecutar el servidor local de desarrollo:**
```bash
npm run dev
```
Navega a `http://localhost:5173/` en tu navegador.

---

## 🔑 Despliegue en Producción (Render)

Al configurar tu **Static Site** en Render apuntando al subdirectorio `Frontend`, establece las siguientes variables de entorno:

| Key | Value (Ejemplo de Producción) |
| :--- | :--- |
| **`VITE_API_URL`** | `https://aquasmart-backend-5wfp.onrender.com/api` |

Y configura el proceso de construcción con:
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
