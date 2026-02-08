import { ArrowLeft, VenetianMask } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type Msg = { role: "user" | "archetype"; text: string };

function titleFromId(id: string): string {
  if (id === "critico") return "El Crítico";
  if (id === "complaciente") return "El Complaciente";
  if (id === "impostor") return "El Impostor";
  return "Arquetipo";
}

export default function ArquetipoChatPage() {
  const navigate = useNavigate();
  const params = useParams();
  const archetypeId = params.id ?? "arquetipo";
  const title = useMemo(() => titleFromId(archetypeId), [archetypeId]);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      role: "archetype",
      text: "No te voy a consolar. Dime qué estás intentando evitar con tu explicación.",
    },
  ]);

  function send() {
    const clean = input.trim();
    if (!clean) return;
    setMessages((prev) => [...prev, { role: "user", text: clean }, { role: "archetype", text: "Mock: te escuché. Ahora sé específico." }]);
    setInput("");
  }

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-12">
      <button
        type="button"
        onClick={() => navigate("/arquetipos")}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/12"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver
      </button>

      <div className="mt-6 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <VenetianMask className="h-5 w-5 text-white/80" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">{title}</div>
            <div className="mt-1 text-xs text-white/60">chat mock (sin IA real)</div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={
                m.role === "user"
                  ? "ml-10 rounded-3xl bg-[#7D5C6B]/70 px-4 py-3 text-sm text-white ring-1 ring-white/10"
                  : "mr-10 rounded-3xl bg-white/6 px-4 py-3 text-sm text-white/75 ring-1 ring-white/10"
              }
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/45 ring-1 ring-white/10 outline-none"
            placeholder="Escribe una línea."
          />
          <button
            type="button"
            onClick={send}
            className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
