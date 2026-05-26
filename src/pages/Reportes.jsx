import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import { api } from "../api/Aquasmart";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const defaultFrom = new Date(today);
defaultFrom.setDate(today.getDate() - 6);

const FALLBACK = {
  from: defaultFrom.toISOString().slice(0, 10),
  to: isoToday,
  period: "Últimos 7 días",
  totalLiters: 1055.9,
  averageLiters: 150.84,
  peakDay: "mié",
  peakLiters: 214.9,
  anomalyCount: 1,
  dailyConsumption: [],
};

export function Reportes() {
  const [data, setData] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromDate, setFromDate] = useState(FALLBACK.from);
  const [toDate, setToDate] = useState(FALLBACK.to);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail");
        const report = await api.getWeeklyReport(fromDate, toDate, userEmail);
        if (!active) return;

        setData({
          ...FALLBACK,
          ...report,
          dailyConsumption: report?.dailyConsumption ?? [],
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err.message || "No se pudo cargar el reporte");
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
  }, [fromDate, toDate, reloadToken]);

  const handleRefresh = () => {
    setReloadToken((current) => current + 1);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Colores corporativos de AquaSmart
      const PRIMARY_COLOR = [37, 99, 235]; // #2563eb
      const TEXT_COLOR = [31, 41, 55]; // #1f2937
      const MUTED_COLOR = [107, 114, 128]; // #6b7280
      const ACCENT_RED = [239, 68, 68]; // #ef4444

      // 1. Encabezado Premium
      doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
      doc.rect(0, 0, 210, 40, "F"); // Barra superior azul

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text("AquaSmart", 14, 26);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Monitoreo Inteligente de Agua", 14, 32);

      const todayStr = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });
      doc.setFontSize(9);
      doc.text(`Generado: ${todayStr}`, 140, 28);

      // Title below header bar
      doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("BOLETA DE CONSUMO SEMANAL", 14, 52);

      // 2. Información del Titular y Medidor
      doc.setDrawColor(229, 231, 235); // Borde gris claro
      doc.rect(14, 58, 182, 35); // Rectángulo contenedor

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("INFORMACIÓN DE LA CUENTA", 18, 64);

      const titularName = data.titularName || localStorage.getItem("userFullName") || "María Fernanda Quispe Rojas";
      const medidorId = data.medidorId || "ASM-2048";

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("Titular:", 18, 72);
      doc.setFont("helvetica", "bold");
      doc.text(titularName, 45, 72);

      doc.setFont("helvetica", "normal");
      doc.text("Código Medidor:", 18, 78);
      doc.setFont("helvetica", "bold");
      doc.text(medidorId, 45, 78);

      doc.setFont("helvetica", "normal");
      doc.text("Dirección:", 18, 84);
      doc.setFont("helvetica", "bold");
      doc.text("Av. La Marina 1420, San Miguel", 45, 84);

      // Derecha
      doc.setFont("helvetica", "normal");
      doc.text("Periodo Reportado:", 120, 72);
      doc.setFont("helvetica", "bold");
      doc.text(`${fromDate} a ${toDate}`, 152, 72);

      doc.setFont("helvetica", "normal");
      doc.text("Tarifa Aplicada:", 120, 78);
      doc.setFont("helvetica", "bold");
      doc.text("S/. 5.00 por m³", 152, 78);

      doc.setFont("helvetica", "normal");
      doc.text("Tarifa por Litro:", 120, 84);
      doc.setFont("helvetica", "bold");
      doc.text("S/. 0.005 por litro", 152, 84);

      // 3. Tarjetas Resumen (Monto Total, Litros Totales, Promedio Diario)
      const startY = 100;

      // Card 1: Consumo Total
      doc.setDrawColor(203, 213, 225); // Borde gris claro (#cbd5e1)
      doc.setFillColor(248, 250, 252); // Fondo gris azulado muy suave (#f8fafc)
      doc.rect(14, startY, 56, 22, "FD");
      doc.setTextColor(71, 85, 105); // Texto de etiqueta gris oscuro (#475569)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("CONSUMO TOTAL", 18, startY + 6);
      doc.setTextColor(15, 23, 42); // Texto de valor negro/azul muy oscuro (#0f172a)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${data.totalLiters.toFixed(1)} L`, 18, startY + 16);

      // Card 2: Monto Total
      doc.setDrawColor(191, 219, 254); // Borde azul suave (#bfdbfe)
      doc.setFillColor(239, 246, 255); // Fondo azul muy suave (#eff6ff)
      doc.rect(77, startY, 56, 22, "FD");
      doc.setTextColor(30, 64, 175); // Texto de etiqueta azul (#1e40af)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("MONTO TOTAL ESTIMADO", 81, startY + 6);
      doc.setTextColor(29, 78, 216); // Texto de valor azul vibrante (#1d4ed8)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`S/. ${(data.totalLiters * 0.005).toFixed(2)}`, 81, startY + 16);

      // Card 3: Promedio Diario
      doc.setDrawColor(203, 213, 225); // Borde gris claro (#cbd5e1)
      doc.setFillColor(248, 250, 252); // Fondo gris azulado muy suave (#f8fafc)
      doc.rect(140, startY, 56, 22, "FD");
      doc.setTextColor(71, 85, 105); // Texto de etiqueta gris oscuro (#475569)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("PROMEDIO DIARIO", 144, startY + 6);
      doc.setTextColor(15, 23, 42); // Texto de valor negro/azul muy oscuro (#0f172a)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${data.averageLiters.toFixed(1)} L`, 144, startY + 16);

      // Restaurar colores por defecto para evitar sangrado de estilos
      doc.setDrawColor(0, 0, 0);
      doc.setFillColor(255, 255, 255);

      // 4. Tabla de Detalle de Consumo Diario
      const tableData = data.dailyConsumption.map((day) => {
        const liters = day.liters || 0;
        const cost = liters * 0.005;
        const status = day.anomaly ? "ANÓMALO (Posible Fuga/Aire)" : "Normal";
        return [
          day.date || "-",
          day.dayLabel || "-",
          `${liters.toFixed(1)} L`,
          `S/. ${cost.toFixed(2)}`,
          status,
        ];
      });

      autoTable(doc, {
        startY: 128,
        head: [["Fecha", "Día", "Consumo (Litros)", "Costo (S/.)", "Estado"]],
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: PRIMARY_COLOR,
          fontSize: 10,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center" },
          1: { halign: "center" },
          2: { halign: "right" },
          3: { halign: "right" },
          4: { halign: "center" },
        },
        bodyStyles: {
          fontSize: 9,
          textColor: TEXT_COLOR,
        },
        didParseCell: (dataCell) => {
          if (dataCell.section === "body" && dataCell.column.index === 4) {
            if (dataCell.cell.raw && dataCell.cell.raw.includes("ANÓMALO")) {
              dataCell.cell.styles.textColor = ACCENT_RED;
              dataCell.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      // 5. Pie de Página / Nota de IA
      const finalY = doc.lastAutoTable.finalY + 10;

      // Caja de análisis inteligente
      doc.setDrawColor(191, 219, 254); // Borde azul suave #bfdbfe
      doc.setFillColor(239, 246, 255); // Fondo azul suave #eff6ff
      doc.rect(14, finalY, 182, 20, "FD");

      doc.setTextColor(29, 78, 216); // Texto azul oscuro #1d4ed8
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Análisis Inteligente AquaSmart:", 18, finalY + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]); // Establecer color gris oscuro para el texto de la nota
      const notes = data.anomalyCount > 0
        ? `Se han detectado ${data.anomalyCount} días con consumo anómalo (fugas o aire en tuberías). Le sugerimos revisar sus válvulas y tuberías internas para evitar cargos extras en su recibo.`
        : "Su patrón de consumo se mantiene dentro de los límites óptimos. No se han detectado anomalías significativas de flujo de aire o fugas esta semana.";
      
      const splitNotes = doc.splitTextToSize(notes, 172);
      doc.text(splitNotes, 18, finalY + 13);

      // Pie legal y de copyright
      doc.setTextColor(MUTED_COLOR[0], MUTED_COLOR[1], MUTED_COLOR[2]);
      doc.setFontSize(8);
      doc.text("AquaSmart S.A.C. – Tecnología IoT para un consumo de agua inteligente y sostenible.", 14, 285);
      doc.text("Este documento es una boleta informativa oficial del consumo registrado por el sensor ultrasónico.", 14, 289);

      // Descargar archivo
      doc.save(`boleta-consumo-semanal-${fromDate}-a-${toDate}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al generar el PDF: " + err.message);
    }
  };

  const chartData = data.dailyConsumption.map((item) => ({
    ...item,
    fill: item.anomaly ? "#ef4444" : "#3b82f6",
  }));

  if (loading) {
    return <div className="p-4 text-muted">Cargando reporte semanal...</div>;
  }

  if (error) {
    return <div className="p-4 text-danger">Error al cargar reportes: {error}</div>;
  }

  return (
    <div className="p-3 p-md-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Historial de Consumo Semanal</h3>
        <div className="text-muted">{data.period}</div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label">Desde</label>
            <input className="form-control" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label">Hasta</label>
            <input className="form-control" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="col-12 col-md-4 d-flex gap-2">
            <button className="btn btn-outline-primary flex-fill" onClick={handleRefresh}>
              Aplicar filtro
            </button>
            <button className="btn btn-primary flex-fill" onClick={handleExportPDF}>
              Exportar PDF (Boleta)
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="text-muted small">Consumo total</div>
            <div className="display-6 fw-bold">{data.totalLiters.toFixed(1)} L</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="text-muted small">Promedio diario</div>
            <div className="display-6 fw-bold">{data.averageLiters.toFixed(1)} L</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <div className="text-muted small">Días anómalos</div>
            <div className="display-6 fw-bold">{data.anomalyCount}</div>
            <div className="text-muted small mt-2">Pico de consumo</div>
            <div className="display-6 fw-bold">{data.peakLiters.toFixed(1)} L</div>
            <div className="text-muted">{data.peakDay}</div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="mb-0 fw-semibold">Consumo por día</h5>
          <span className="text-muted small">Rojos: día anómalo</span>
        </div>

        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayLabel" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="liters" radius={[8, 8, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.date} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}