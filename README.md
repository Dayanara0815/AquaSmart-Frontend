# 🖥️ AquaSmart - Frontend (Vite + React)

¡Bienvenido al panel web de **AquaSmart**! Esta es una aplicación de interfaz interactiva y de diseño premium (glassmorphism, animaciones fluidas y soporte multi-tema) orientada a la monitorización inteligente y conservación del consumo de agua en tiempo real.

---

## 🚀 Tecnologías Principales

- **Core**: React 18 & Vite
- **Gráficos**: Recharts (adaptable con visualizaciones animadas de costos y consumos en Soles)
- **Documentación**: jsPDF & jsPDF-AutoTable (generación de boletas de consumo estructuradas)
- **Estilos**: Vanilla CSS con un avanzado sistema de variables CSS dinámicas
- **Herramientas**: ES Modules, ESLint, Fetch API

---

## ✨ Características Principales

1. **Monitoreo en Tiempo Real**: Panel de control interactivo que se actualiza automáticamente cada 5 segundos reportando caudal (L/min), volumen acumulado y costo monetario acumulado diario.
2. **Interruptor de Válvula Inteligente**: Botón interactivo para abrir y cerrar la válvula de paso principal. Al cerrar, el flujo cae inmediatamente a `0.0 L/min` y se registra la lectura instantánea en base de datos.
3. **Persistencia de Chat con IA**: Un asistente virtual contextual capaz de responder preguntas sobre tu recibo, consumo de agua o alertas de fugas sin perder el historial ante las recargas automáticas de telemetría.
4. **Boleta PDF Premium**: Exportación de reportes semanales a un formato PDF corporativo de alto contraste, diseñado bajo estándares de accesibilidad WCAG.
5. **Sistema de Temas Dinámico**: Soporte completo para Tema Oscuro y Tema Claro mediante contexto nativo de React, persistido automáticamente según las preferencias de cuenta del usuario.

---

## 🛠️ Requisitos de Entorno

Asegúrate de tener instalado en tu máquina local:
- [Node.js](https://nodejs.org/) (Versión 18.0 o superior recomendada)
- Un gestor de paquetes de Node como `npm` (incluido por defecto con Node.js)

---

## ⚙️ Configuración y Despliegue Local

Sigue estos sencillos pasos para levantar el entorno de desarrollo local:

### 1. Clonar el repositorio y acceder a la carpeta
```bash
git clone <url-del-repositorio>
cd Frontend
```

### 2. Instalar dependencias
Instala todas las dependencias necesarias de Node.js especificadas en el archivo `package.json`:
```bash
npm install
```

### 3. Configurar variables de entorno (Opcional)
Por defecto, el frontend se conectará al backend local en `http://localhost:8080/api`. Si deseas modificar el endpoint de la API, puedes crear un archivo `.env` en la raíz de la carpeta `Frontend`:
```env
VITE_API_URL=http://localhost:8080/api
```

### 4. Ejecutar el servidor de desarrollo
Levanta el servidor rápido de Vite en modo local:
```bash
npm run dev
```
La terminal te proporcionará la dirección local. Por defecto, abre tu navegador en:
👉 [**http://localhost:5173/**](http://localhost:5173/)

### 5. Compilar para producción (Opcional)
Si deseas generar los recursos optimizados y minificados listos para desplegar:
```bash
npm run build
```
Los archivos de distribución listos para subir a producción se crearán en la carpeta `/dist`.

---

## 📁 Estructura de Carpetas Clave

```text
src/
├── api/             # Cliente de conexión fetch con el Backend
├── components/      # Componentes UI reutilizables y secciones del Dashboard
├── contexts/        # Contextos globales de React (Tema y usuario conectado)
├── hooks/           # Custom Hooks para telemetría y consultas periódicas
├── pages/           # Vistas principales (Dashboard, Ajustes, Reportes, Cierres, Notificaciones)
├── App.jsx          # Enrutador principal y cargador de layouts
└── index.css        # Configuración del sistema de diseño (tokens HSL, temas)
```
