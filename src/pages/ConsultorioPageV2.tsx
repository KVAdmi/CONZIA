import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/authStore";
import Button from "../components/ui/Button";
import Textarea from "../components/ui/Textarea";
import { MessageCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ConsultorioPageV2() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bienvenido al consultorio. Este es un espacio seguro para explorar lo que necesites. ¿Qué te trae hoy?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  async function sendMessage() {
    if (!input.trim() || isThinking) return;

    const userMessage = input.trim();
    setInput("");
    
    // Agregar mensaje del usuario
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsThinking(true);

    try {
      // Llamar a Claude
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `Eres un terapeuta junguiano experto en trabajo con la sombra.

Tu estilo:
- Empático pero directo
- No das consejos superficiales
- Haces preguntas que incomodan
- Señalas patrones y contradicciones
- Usas metáforas y símbolos
- Hablas en español mexicano natural

Tu objetivo:
- Ayudar al usuario a ver su sombra
- Detectar patrones de evitación
- Hacer preguntas que revelen verdades incómodas
- Contener emocionalmente pero sin rescatar

Responde en 2-3 párrafos máximo. Sé conciso y profundo.`
            },
            ...messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Agregar respuesta del asistente
      setMessages(prev => [...prev, { role: "assistant", content: assistantMessage }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Disculpa, hubo un error. ¿Puedes repetir lo que dijiste?" 
      }]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Sesión requerida</h2>
          <p className="text-white/80 mb-6">Inicia sesión para acceder al consultorio</p>
          <Button onClick={() => navigate("/login")}>Iniciar sesión</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl">
            <MessageCircle className="w-6 h-6 text-[#DDB273]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Consultorio — Diálogo Guiado</h1>
            <p className="text-sm text-white/50">Sesión activa</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-[#DDB273] text-slate-900"
                    : "bg-white/10 text-white backdrop-blur-md"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-md text-white p-4 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              rows={2}
              disabled={isThinking}
              className="flex-1 bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl p-4 resize-none"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isThinking}
              className="self-end px-6 py-3 bg-[#DDB273] hover:bg-[#DDB273]/90 text-slate-900 font-semibold rounded-xl"
            >
              {isThinking ? "..." : "Enviar"}
            </Button>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              onClick={() => {
                if (confirm("¿Cerrar la sesión? Se guardará el historial.")) {
                  navigate("/");
                }
              }}
              variant="secondary"
              className="flex-1"
            >
              Cerrar sesión
            </Button>
          </div>

          <p className="text-xs text-white/40 mt-3 text-center">
            Cierra la sesión para salir. El historial se guarda automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
