import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, Droplets } from "lucide-react";
import { api } from "../../api/Aquasmart";

export function AIChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "¡Hola! Soy **AquaBot**, tu asistente virtual de AquaSmart. Estoy aquí para analizar tus consumos, verificar el estado de tu válvula y ayudarte a ahorrar agua. ¿En qué te puedo asesorar hoy?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole") || "DOMESTICO";

  // Desplazar automáticamente hacia el último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Sugerencias rápidas
  const SUGGESTIONS = [
    "¿Cuánto he consumido hoy?",
    "¿Cuál es el estado de mi válvula?",
    "¿Tengo alertas activas?",
    "¿Cuánto dinero he ahorrado por paso de aire?",
  ];

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    if (!textToSend) {
      setInput("");
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // 1. Agregar mensaje del usuario
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: query, timestamp: time },
    ]);

    setIsTyping(true);

    try {
      // 2. Consultar a la API contextual de Spring Boot
      const res = await api.askAI(query, userEmail);
      
      setIsTyping(false);
      
      const botAnswer = res?.answer || "Lo siento, en este momento no puedo procesar tu consulta. Inténtalo de nuevo más tarde.";

      // 3. Agregar respuesta de la IA
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: botAnswer, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { 
          sender: "bot", 
          text: "⚠️ **Error de conexión**: No he podido comunicarme con el servidor backend de AquaSmart para extraer tus datos. Asegúrate de que el backend esté corriendo correctamente.", 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        },
      ]);
    }
  };

  // No renderizar para el Técnico o el Gestor Municipal si se desea restringir,
  // pero el asistente es sumamente útil para todos. Vamos a dejarlo activo para todos,
  // o limitarlo al Vecino/Comercio. Como cada rol es diferente, tenerlo para Vecino es el principal caso de uso.
  if (userRole === "TECNICO" || userRole === "MUNICIPAL") {
    return null;
  }

  // Helper para renderizar texto con negritas markdown simples
  const renderMessageText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="position-fixed d-flex align-items-center justify-content-center border-0 rounded-circle shadow-lg floating-ai-bubble"
        style={{
          bottom: "85px",
          right: "24px",
          width: "56px",
          height: "56px",
          background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
          color: "#fff",
          zIndex: 1040,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        aria-label="Abrir asistente de IA"
        title="Pregunta a AquaBot IA"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="animate-bounce" />}
      </button>

      {/* Drawer de Chat */}
      <div
        className={`position-fixed d-flex flex-column shadow-lg chat-drawer-panel rounded-4 overflow-hidden ${
          isOpen ? "chat-drawer-open" : "chat-drawer-closed"
        }`}
        style={{
          bottom: "155px",
          right: "24px",
          width: "360px",
          height: "460px",
          background: "var(--surface)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--header-border)",
          zIndex: 1040,
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
      >
        {/* Cabecera del Chat */}
        <div
          className="d-flex align-items-center justify-content-between p-3 text-white"
          style={{
            background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div className="position-relative">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 36, height: 36, background: "rgba(34, 211, 238, 0.15)", border: "1px solid #06b6d4" }}
              >
                <Sparkles size={18} className="text-info" />
              </div>
              <span 
                className="position-absolute rounded-circle bg-success border border-white"
                style={{ width: 10, height: 10, bottom: 0, right: 0 }}
              />
            </div>
            <div>
              <h6 className="mb-0 fw-bold small leading-tight" style={{ fontSize: 13.5 }}>AquaBot IA</h6>
              <span className="text-muted small" style={{ fontSize: 10.5, color: "#a5f3fc" }}>Asistente en vivo • En línea</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-sm btn-link p-0 text-white opacity-70 hover-opacity-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Historial de Mensajes */}
        <div 
          className="flex-fill overflow-auto p-3 d-flex flex-column gap-3 bg-light bg-opacity-25"
          style={{ maxHeight: "calc(100% - 130px)" }}
        >
          {messages.map((msg, index) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={index}
                className={`d-flex flex-column ${isBot ? "align-items-start" : "align-items-end"}`}
              >
                <div
                  className={`rounded-4 px-3 py-2 max-w-85 ${
                    isBot 
                      ? "bg-white text-dark shadow-sm border border-light" 
                      : "bg-primary text-white"
                  }`}
                  style={{ 
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    borderBottomLeftRadius: isBot ? 4 : 16,
                    borderBottomRightRadius: isBot ? 16 : 4,
                  }}
                >
                  {renderMessageText(msg.text)}
                </div>
                <span className="text-muted mt-1" style={{ fontSize: 9 }}>
                  {msg.timestamp}
                </span>
              </div>
            );
          })}

          {isTyping && (
            <div className="d-flex flex-column align-items-start">
              <div
                className="rounded-4 px-3 py-2 bg-white text-dark shadow-sm border border-light d-flex align-items-center gap-1"
                style={{ 
                  borderBottomLeftRadius: 4,
                  fontSize: 12.5,
                }}
              >
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugerencias Rápidas */}
        <div 
          className="d-flex gap-2 overflow-auto px-3 py-2 border-top"
          style={{ 
            whiteSpace: "nowrap", 
            scrollbarWidth: "none", 
            msOverflowStyle: "none",
            borderColor: "var(--header-border)"
          }}
        >
          {SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => void handleSend(sug)}
              className="btn btn-outline-secondary btn-xs rounded-pill px-2.5 py-1 text-truncate"
              style={{ fontSize: 10.5, borderColor: "var(--header-border)" }}
              disabled={isTyping}
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Barra de Entrada de Texto */}
        <div 
          className="p-2.5 border-top d-flex align-items-center gap-2"
          style={{ borderColor: "var(--header-border)", background: "var(--surface)" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Haz una pregunta sobre tu medidor..."
            className="form-control rounded-pill border-0 px-3"
            style={{ fontSize: 12, backgroundColor: "var(--surface-soft)", color: "var(--text)" }}
            disabled={isTyping}
          />
          <button
            onClick={() => void handleSend()}
            disabled={isTyping || !input.trim()}
            className="d-flex align-items-center justify-content-center border-0 rounded-circle text-white bg-primary shadow-sm"
            style={{ 
              width: 34, 
              height: 34, 
              opacity: isTyping || !input.trim() ? 0.6 : 1,
              transition: "transform 0.15s"
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
