import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { api } from "../../api/Aquasmart";

// Utility to play dynamic sound beeps using Web Audio API
const playBeep = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === "start") {
      // Short high pitch beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime); // 600Hz
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "success") {
      // Double beep (high then higher)
      const playTone = (freq, time, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
        
        osc.start(time);
        osc.stop(time + duration);
      };
      
      playTone(523.25, ctx.currentTime, 0.1); // C5
      playTone(659.25, ctx.currentTime + 0.12, 0.12); // E5
    }
  } catch (e) {
    console.error("Failed to play audio cue:", e);
  }
};

// Utility to play a continuous soft thinking pulse sound using Web Audio API
const startThinkingSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const ctx = new AudioContext();
    let isStopped = false;

    const playPulse = () => {
      if (isStopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(350, ctx.currentTime); // Soft tone
      gain.gain.setValueAtTime(0.04, ctx.currentTime); // Soft volume
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);

      setTimeout(playPulse, 1200);
    };

    playPulse();

    return {
      stop: () => {
        isStopped = true;
        try {
          ctx.close();
        } catch (e) {
          // ignore error during close
        }
      }
    };
  } catch (e) {
    console.error("Failed to start thinking sound:", e);
    return null;
  }
};

// Función para obtener sugerencias específicas según el rol
const getSuggestions = (role) => {
  if (role === "TECNICO") {
    return [
      "¿Cuál es el caudal actual del medidor?",
      "¿Hay alertas activas en PostgreSQL?",
      "¿Cuál es el estado de la válvula?",
      "Explicar estado de órdenes JIRA",
    ];
  }
  if (role === "MUNICIPAL") {
    return [
      "¿Hay alertas activas en el distrito?",
      "¿Cómo están las lecturas del medidor?",
      "¿Cuál es el estado de la válvula principal?",
      "¿Se reportan fugas viales?",
    ];
  }
  if (role === "COMERCIO") {
    return [
      "¿Cuál es mi consumo comercial hoy?",
      "¿Tengo alertas activas?",
      "¿Cuál es el estado de mi válvula?",
      "¿Cuánto he ahorrado por paso de aire?",
    ];
  }
  return [
    "¿Cuánto he consumido hoy?",
    "¿Cuál es el estado de mi válvula?",
    "¿Tengo alertas activas?",
    "¿Cuánto dinero he ahorrado por paso de aire?",
  ];
};

// Función para armar el mensaje de bienvenida adaptativo por rol
const getInitialMessage = (role) => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let text = "¡Hola! Soy **AquaBot**, tu asistente virtual de AquaSmart. Estoy aquí para analizar tus consumos domésticos, alertarte de fugas y ayudarte a ahorrar agua. ¿En qué te puedo asesorar hoy?";
  if (role === "TECNICO") {
    text = "¡Hola! Soy **AquaBot (Consola Técnica)**. Estoy listo para ayudarte a auditar lecturas de medidores, analizar caudales y presiones en bar, y revisar tus órdenes de trabajo JIRA en PostgreSQL. ¿Qué sensor de Puente Piedra auditamos hoy?";
  } else if (role === "MUNICIPAL") {
    text = "¡Hola! Soy **AquaBot (Asistente Municipal)**. Estoy a tu disposición para correlacionar transductores de presión, ver baches reportados en vía pública y gestionar alertas comunitarias. ¿Qué zona distrital analizamos hoy?";
  } else if (role === "COMERCIO") {
    text = "¡Hola! Soy **AquaBot (Asistente Comercial)**. Estoy monitoreando la línea de tu lavandería para asegurar flujo constante de agua y evitar daños por sedimentos o bolsas de aire. ¿Deseas verificar tu consumo comercial hoy?";
  }
  return [{ sender: "bot", text, timestamp: time }];
};

export function AIChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole") || "DOMESTICO";

  const [messages, setMessages] = useState(() => getInitialMessage(userRole));
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // States for Voice Assistant integration
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem("chatVoiceEnabled");
    return saved !== "false"; // Default to enabled
  });

  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const hasSpokenWelcomeRef = useRef(false);
  const latestTranscriptRef = useRef("");
  const thinkingSoundRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const skipWelcomeVoiceRef = useRef(false);

  // Desplazar automáticamente hacia el último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const SUGGESTIONS = getSuggestions(userRole);

  // Synchronize latest transcript ref so that SpeechRecognition callbacks always get the newest value
  useEffect(() => {
    latestTranscriptRef.current = input;
  }, [input]);

  // Clean Markdown, emojis, and formatting for a natural text-to-speech output
  const cleanTextForSpeech = (text) => {
    if (!text) return "";
    let clean = text.replace(/\*\*(.*?)\*\*/g, "$1"); // Bold tags
    clean = clean.replace(/⚠️|💡|💧|🤖|🔥|🚀/g, ""); // Common Emojis
    clean = clean.replace(/S\/\.\s*(\d+(\.\d{2})?)/g, "$1 soles"); // S/. 1.65 -> 1.65 soles
    return clean.trim();
  };

  const speakText = (text) => {
    if (!isVoiceEnabled) return;

    // Cancel any currently playing sound synthesis to prevent overlap
    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "es-ES";

    // Set voice if a Spanish one is available
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find((v) => v.lang.startsWith("es"));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  const speakAnnouncement = (text, callback = null) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find((v) => v.lang.startsWith("es"));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
    if (callback) {
      utterance.onend = () => {
        activeUtteranceRef.current = null;
        callback();
      };
      utterance.onerror = () => {
        activeUtteranceRef.current = null;
        callback();
      };
    }
    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Toggle voice outputs (mute / unmute TTS)
  const handleToggleVoice = () => {
    const nextVal = !isVoiceEnabled;
    setIsVoiceEnabled(nextVal);
    localStorage.setItem("chatVoiceEnabled", String(nextVal));
    if (!nextVal) {
      window.speechSynthesis.cancel();
    }
  };

  // Setup SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "es-ES";

      rec.onstart = () => {
        setIsListening(true);
        playBeep("start");
      };

      rec.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = (finalTranscript || interimTranscript).trim();
        if (currentText) {
          setInput(currentText);

          // Clear previous silence timeout on active input
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          // Rule 1: Say "enviar" to send immediately
          if (currentText.toLowerCase().endsWith("enviar")) {
            const cleanQuery = currentText.slice(0, -6).trim();
            setInput(cleanQuery);
            latestTranscriptRef.current = cleanQuery;
            rec.stop();
            return;
          }

          // Rule 2: 2.5s of silence auto-sends
          silenceTimeoutRef.current = setTimeout(() => {
            rec.stop();
          }, 2500);
        }
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        if (e.error !== "aborted") {
          setIsListening(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        const textToSend = latestTranscriptRef.current.trim();
        if (textToSend) {
          playBeep("success");
          handleSend(textToSend);
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      const msg = "Tu navegador no soporta reconocimiento de voz. Te recomendamos usar Google Chrome o Microsoft Edge.";
      alert(msg);
      speakText(msg);
      return;
    }

    if (isListening) {
      // Cancel recording: abort, reset input, and clear timers to avoid sending
      latestTranscriptRef.current = "";
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      recognitionRef.current.abort();
      setIsListening(false);
    } else {
      // Start recording with voice announcement countdown
      window.speechSynthesis.cancel();
      setInput("");
      latestTranscriptRef.current = "";
      
      speakAnnouncement("Iniciando micrófono en tres, dos, uno.", () => {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error("Start speech failed:", err);
        }
      });
    }
  };

  // Keyboard accessibility shortcuts and onboarding guides
  useEffect(() => {
    if (isOpen) {
      if (isVoiceEnabled && !hasSpokenWelcomeRef.current && !skipWelcomeVoiceRef.current) {
        hasSpokenWelcomeRef.current = true;
        const welcomeText = messages[0]?.text || "";
        const instructionText = "Para hablarme, presiona Alt + V. Cuando termines tu pregunta, di la palabra 'enviar' o simplemente mantente en silencio por tres segundos para que se envíe sola. Para silenciar mis respuestas, presiona Alt + S.";
        speakText(`${welcomeText}. ${instructionText}`);
      }
      skipWelcomeVoiceRef.current = false;
    } else {
      // Cancel TTS, thinking sound and recording on close
      window.speechSynthesis.cancel();
      if (thinkingSoundRef.current) {
        thinkingSoundRef.current.stop();
        thinkingSoundRef.current = null;
      }
      if (isListening && recognitionRef.current) {
        latestTranscriptRef.current = "";
        recognitionRef.current.abort();
      }
    }
  }, [isOpen]);

  // Clean up any thinking sound on component unmount
  useEffect(() => {
    return () => {
      if (thinkingSoundRef.current) {
        thinkingSoundRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Alt + C to toggle chat drawer
      if (e.altKey && key === "c") {
        e.preventDefault();
        setIsOpen((prev) => {
          const nextState = !prev;
          if (nextState) {
            skipWelcomeVoiceRef.current = true;
            speakAnnouncement("Abriendo el chat de AquaSmart.");
          } else {
            window.speechSynthesis.cancel();
          }
          return nextState;
        });
      }

      // Alt + V to toggle microphone
      if (e.altKey && key === "v") {
        e.preventDefault();
        if (!isOpen) {
          skipWelcomeVoiceRef.current = true;
          setIsOpen(true);
          speakAnnouncement("Abriendo el chat de AquaSmart.", () => {
            toggleListening();
          });
        } else {
          toggleListening();
        }
      }

      // Alt + S to toggle sound/voice mute
      if (e.altKey && key === "s") {
        e.preventDefault();
        handleToggleVoice();
        const nextVal = !isVoiceEnabled;
        const msg = nextVal ? "Respuestas de voz activadas" : "Respuestas de voz desactivadas";
        if (nextVal) {
          setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(msg);
            utterance.lang = "es-ES";
            window.speechSynthesis.speak(utterance);
          }, 100);
        }
      }

      // Escape to close or stop listening
      if (e.key === "Escape") {
        if (isListening) {
          e.preventDefault();
          toggleListening();
        } else if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isListening, isVoiceEnabled]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    // Always clear text input
    setInput("");

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // 1. Agregar mensaje del usuario
    const nextMessages = [
      ...messages,
      { sender: "user", text: query, timestamp: time },
    ];
    setMessages(nextMessages);
    setIsTyping(true);

    // Remove "dame un momento para responder" text and instead trigger a soft repetitive thinking sound
    if (thinkingSoundRef.current) {
      thinkingSoundRef.current.stop();
    }
    if (isVoiceEnabled) {
      thinkingSoundRef.current = startThinkingSound();
    }

    // Formatear historial completo para la API (historial conversacional)
    const historyPayload = nextMessages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    try {
      // 2. Consultar a la API contextual de Spring Boot con historial
      const res = await api.askAI(query, userEmail, historyPayload);
      
      setIsTyping(false);
      if (thinkingSoundRef.current) {
        thinkingSoundRef.current.stop();
        thinkingSoundRef.current = null;
      }
      
      const botAnswer = res?.answer || "Lo siento, en este momento no puedo procesar tu consulta. Inténtalo de nuevo más tarde.";

      // 3. Agregar respuesta de la IA
      const finalBotMsg = { sender: "bot", text: botAnswer, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages((prev) => [
        ...prev,
        finalBotMsg,
      ]);
      speakText(botAnswer);
    } catch (err) {
      setIsTyping(false);
      if (thinkingSoundRef.current) {
        thinkingSoundRef.current.stop();
        thinkingSoundRef.current = null;
      }
      const errMsg = "⚠️ Error de conexión: No he podido comunicarme con el servidor backend de AquaSmart. Asegúrate de que el backend esté corriendo correctamente.";
      setMessages((prev) => [
        ...prev,
        { 
          sender: "bot", 
          text: errMsg, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        },
      ]);
      speakText("Error de conexión. No he podido comunicarme con el servidor backend de AquaSmart.");
    }
  };

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
        className="d-flex align-items-center justify-content-center border-0 rounded-circle shadow-lg floating-ai-bubble"
        style={{
          background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
          color: "#fff",
        }}
        aria-label="Abrir asistente de IA (Alt + C)"
        title="Pregunta a AquaBot IA (Alt + C)"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} className="animate-bounce" />}
      </button>
 
      {/* Drawer de Chat */}
      <div
        className={`d-flex flex-column shadow-lg chat-drawer-panel rounded-4 overflow-hidden ${
          isOpen ? "chat-drawer-open" : "chat-drawer-closed"
        }`}
        style={{
          background: "var(--surface)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--header-border)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
        role="dialog"
        aria-label="AquaBot Asistente de IA"
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
          
          <div className="d-flex align-items-center gap-1">
            <button
              onClick={handleToggleVoice}
              className="btn btn-sm btn-link p-0 text-white opacity-70 hover-opacity-100 me-2"
              aria-label={isVoiceEnabled ? "Silenciar respuestas de voz (Alt + S)" : "Activar respuestas de voz (Alt + S)"}
              title={isVoiceEnabled ? "Silenciar respuestas de voz (Alt + S)" : "Activar respuestas de voz (Alt + S)"}
            >
              {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-sm btn-link p-0 text-white opacity-70 hover-opacity-100"
              aria-label="Cerrar chat"
              title="Cerrar chat (Escape)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Historial de Mensajes */}
        <div 
          className="p-3 d-flex flex-column gap-3 bg-light bg-opacity-25"
          style={{ flex: "1 1 0%", minHeight: 0, overflowY: "auto" }}
          aria-live="polite"
          aria-relevant="additions"
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
              disabled={isTyping || isListening}
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
            placeholder={isListening ? "Escuchando... Di tu pregunta y di 'enviar' o haz una pausa." : "Haz una pregunta sobre tu medidor..."}
            className="form-control rounded-pill border-0 px-3"
            style={{ 
              fontSize: 12, 
              backgroundColor: "var(--surface-soft)", 
              color: "var(--text)",
              border: isListening ? "1.5px solid #dc3545" : "none"
            }}
            disabled={isTyping}
            aria-label="Campo de texto de la pregunta"
          />
          
          {/* Botón de Micrófono */}
          <button
            onClick={toggleListening}
            className={`d-flex align-items-center justify-content-center border-0 rounded-circle text-white shadow-sm ${
              isListening ? "voice-record-pulse" : "bg-secondary"
            }`}
            style={{ 
              width: 34, 
              height: 34, 
              flexShrink: 0,
              transition: "all 0.2s ease"
            }}
            disabled={isTyping}
            aria-label={isListening ? "Detener grabación de voz (Escape)" : "Preguntar por voz (Alt + V)"}
            title={isListening ? "Detener grabación (Escape)" : "Preguntar por voz (Alt + V)"}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          <button
            onClick={() => void handleSend()}
            disabled={isTyping || !input.trim() || isListening}
            className="d-flex align-items-center justify-content-center border-0 rounded-circle text-white bg-primary shadow-sm"
            style={{ 
              width: 34, 
              height: 34, 
              flexShrink: 0,
              opacity: isTyping || !input.trim() || isListening ? 0.6 : 1,
              transition: "transform 0.15s"
            }}
            aria-label="Enviar pregunta"
            title="Enviar pregunta"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
