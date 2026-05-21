import { WaterCutAlert }    from "../components/dashboard/WaterCutAlert";
import { WaterStatusCard }  from "../components/dashboard/WaterStatusCard";
import { AICostProjection } from "../components/dashboard/AICostProjection";
import { useWaterData }     from "../hooks/useWaterData";

export function Dashboard() {
  const { data, loading, error, toggleValve, togglePresence } = useWaterData();

  if (loading) {
    return (
      <div className="d-flex flex-fill align-items-center justify-content-center text-muted">
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex flex-fill align-items-center justify-content-center text-danger">
        Error al cargar datos: {error}
      </div>
    );
  }

  const handleAskAI = (question) => {
    // TODO: conectar a api.askAI(question) cuando el backend esté listo
    console.log("Pregunta IA:", question);
  };

  return (
    <main className="flex-fill overflow-auto p-3 p-md-4">
      <WaterCutAlert alert={data.alert} />
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <WaterStatusCard
            data={data}
            onToggleValve={toggleValve}
            onTogglePresence={togglePresence}
          />
        </div>
        <div className="col-12 col-lg-6">
          <AICostProjection
            projection={data.aiProjection}
            onAskAI={handleAskAI}
          />
        </div>
      </div>
    </main>
  );
}