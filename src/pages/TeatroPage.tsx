import { ArrowLeft, Mic, Theater } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const SCENES = [
  {
    id: "cumplido",
    title: "Recibes un cumplido",
    prompt: "Actúa como El Impostor. Responde en voz alta cómo lo desviarías.",
  },
  {
    id: "limite",
    title: "Te piden de más",
    prompt: "Actúa como El Complaciente. Responde en voz alta cómo cederías.",
  },
];

export default function TeatroPage() {
  const navigate = useNavigate();
  const [sceneId, setSceneId] = useState<string>(SCENES[0]!.id);
  const scene = useMemo(() => SCENES.find((s) => s.id === sceneId) ?? SCENES[0]!, [sceneId]);
  const [status, setStatus] = useState<string | null>(null);

  function simulate() {
    setStatus("Grabación simulada lista. (mock)");
    window.setTimeout(() => setStatus(null), 2200);
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
            <Theater className="h-5 w-5 text-white/80" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">Teatro de sombras</div>
            <div className="mt-1 text-xs text-white/60">{status ?? "mock (v1)"}</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[11px] tracking-[0.18em] text-white/55">ESCENA</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SCENES.map((s) => {
              const active = s.id === sceneId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSceneId(s.id)}
                  className={
                    active
                      ? "rounded-full bg-[#7D5C6B]/70 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10"
                      : "rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white/85 ring-1 ring-white/10 transition hover:bg-white/12"
                  }
                >
                  {s.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white/6 px-5 py-4 ring-1 ring-white/10">
          <div className="text-sm font-semibold text-white">{scene.title}</div>
          <div className="mt-2 text-sm leading-relaxed text-white/70">{scene.prompt}</div>
        </div>

        <button
          type="button"
          onClick={simulate}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7D5C6B] px-4 py-4 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-[#6f5160]"
        >
          <Mic className="h-4 w-4" aria-hidden />
          Grabar (mock)
        </button>
      </div>
    </div>
  );
}

