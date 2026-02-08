import { VenetianMask, MessageCircle, Theater } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ArchetypeCard = {
  id: string;
  name: string;
  hint: string;
};

const SEED: ArchetypeCard[] = [
  { id: "critico", name: "El Crítico", hint: "Perfeccionismo como protección." },
  { id: "complaciente", name: "El Complaciente", hint: "Ceder para no perder." },
  { id: "impostor", name: "El Impostor", hint: "Miedo a ser visto de verdad." },
];

export default function ArquetiposPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100svh] px-6 pb-10 pt-14">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[26px] font-semibold tracking-tight text-white">Arquetipos</div>
          <div className="mt-2 text-sm text-white/65">Confrontación dirigida, no conversación infinita.</div>
        </div>
      </div>

      <div className="mt-7 rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
        <div className="text-[11px] tracking-[0.18em] text-white/55">LABORATORIO</div>
        <div className="mt-3 text-sm text-white/70">
          Aquí aparecen “personas” de tu sombra. No te consuelan. Te explican su lógica.
        </div>

        <div className="mt-5 space-y-3">
          {SEED.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(`/arquetipos/${encodeURIComponent(a.id)}`)}
              className="flex w-full items-center justify-between gap-4 rounded-3xl bg-white/6 px-5 py-4 text-left ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.995]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <VenetianMask className="h-5 w-5 text-white/80" aria-hidden />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-white">{a.name}</div>
                  <div className="mt-1 text-xs text-white/60">{a.hint}</div>
                </div>
              </div>
              <MessageCircle className="h-4 w-4 text-white/50" aria-hidden />
            </button>
          ))}
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="text-[11px] tracking-[0.18em] text-white/55">TEATRO DE SOMBRAS</div>
          <div className="mt-3 text-sm text-white/70">
            No hablas con tu sombra: actúas como ella. Luego CONZIA te devuelve lo que quedó al descubierto.
          </div>
          <button
            type="button"
            onClick={() => navigate("/teatro")}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/12"
          >
            <Theater className="h-4 w-4" aria-hidden />
            Abrir Teatro (mock)
          </button>
        </div>
      </div>
    </div>
  );
}
