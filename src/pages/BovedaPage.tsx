import { ChevronRight, FileText, Fingerprint, Flame, Lock, Shield, Unlock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import GlassSheet from "../components/ui/GlassSheet";
import Textarea from "../components/ui/Textarea";
import { useAuth } from "../state/authStore";
import { useXmi } from "../state/xmiStore";
import type { VaultNote } from "../types/models";
import { formatDateLongEsMX, toISODateOnly } from "../utils/dates";
import { createId } from "../utils/id";

function pillClassName(): string {
  return "inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10 backdrop-blur-md";
}

function tileClassName(): string {
  return "flex w-full items-center justify-between gap-4 rounded-3xl bg-[#0b1220]/72 px-5 py-4 text-left ring-1 ring-white/10 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] transition hover:bg-[#0b1220]/78 active:scale-[0.995]";
}

function primaryButtonClassName(): string {
  return "w-full rounded-2xl bg-[#7D5C6B] px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/15 shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:bg-[#6f5160] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none";
}

function quietButtonClassName(): string {
  return "w-full rounded-2xl bg-white/10 px-5 py-4 text-center text-sm font-semibold tracking-wide text-white ring-1 ring-white/12 transition hover:bg-white/12 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none";
}

const darkFieldClassName =
  "bg-white/10 text-white ring-white/12 placeholder:text-white/35 focus:ring-white/25 disabled:bg-white/8 disabled:ring-white/10";

export default function BovedaPage() {
  const { state, dispatch } = useXmi();
  const auth = useAuth();
  const navigate = useNavigate();
  const todayISO = toISODateOnly(new Date());
  const vaultKey =
    auth.actorId === "local" ? "concia_v1_vault_unlocked" : `concia_v1_vault_unlocked_${auth.actorId}`;

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(vaultKey) === "1";
    } catch {
      return false;
    }
  });
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ashText, setAshText] = useState("");
  const [activeSheet, setActiveSheet] = useState<null | "compose" | "ash" | "notes" | "note">(null);
  const [openNote, setOpenNote] = useState<VaultNote | null>(null);

  const notes = useMemo(() => {
    return [...state.vaultNotes].slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [state.vaultNotes]);

  useEffect(() => {
    if (unlocked) {
      setPin("");
      setPinError(null);
    }
  }, [unlocked]);

  function unlockWithPin() {
    const clean = pin.trim();
    const ok = /^\d{4,}$/.test(clean);
    if (!ok) {
      setPinError("PIN inválido. Usa al menos 4 dígitos.");
      return;
    }
    try {
      localStorage.setItem(vaultKey, "1");
    } catch {
      // ignore
    }
    setUnlocked(true);
  }

  function unlockMockBio() {
    try {
      localStorage.setItem(vaultKey, "1");
    } catch {
      // ignore
    }
    setUnlocked(true);
  }

  function lockVault() {
    try {
      localStorage.removeItem(vaultKey);
    } catch {
      // ignore
    }
    setUnlocked(false);
    setActiveSheet(null);
    setOpenNote(null);
  }

  function seal() {
    const clean = content.trim();
    if (clean.length < 3) return;
    const note: VaultNote = {
      id: createId("v"),
      date: todayISO,
      title: title.trim() ? title.trim() : undefined,
      content: clean,
      sealed: true,
    };
    dispatch({ type: "add_vault_note", vaultNote: note });
    setTitle("");
    setContent("");
    setActiveSheet("notes");
  }

  function destroyAsh() {
    setAshText("");
    setActiveSheet(null);
  }

  return (
    <>
      <div className="min-h-[100svh] px-6 pb-10 pt-14">
        <div className="flex items-start justify-between gap-4 text-white">
          <div>
            <div className="text-[26px] font-semibold tracking-tight">Bóveda</div>
            <div className="mt-2 text-sm text-white/65">
              Fuera del sistema. No se analiza. No se mide.
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={pillClassName()}>{formatDateLongEsMX(todayISO)}</div>
            {unlocked ? (
              <button type="button" onClick={lockVault} className={pillClassName()}>
                <Lock className="h-4 w-4" aria-hidden />
                Bloquear
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-7 space-y-3">
          {!unlocked ? (
            <div className="rounded-[34px] bg-[#0b1220]/72 ring-1 ring-white/10 backdrop-blur-xl px-6 pb-6 pt-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <Shield className="h-5 w-5 text-white/80" aria-hidden />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-white">Desbloqueo</div>
                  <div className="mt-1 text-xs text-white/60">mock (v1)</div>
                </div>
              </div>

              <div className="mt-5 text-sm text-white/70 leading-relaxed">
                En v1 es mock. Sirve para que el flujo exista desde el día 1. En fase 2: cifrado, biometría real,
                exportación segura.
              </div>

              <div className="mt-5">
                <div className="text-xs font-medium text-white/75">PIN</div>
                <Input
                  className={`mt-2 ${darkFieldClassName}`}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  inputMode="numeric"
                  placeholder="••••"
                />
                {pinError ? <div className="mt-2 text-xs text-white/65">{pinError}</div> : null}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2">
                <button type="button" onClick={unlockWithPin} className={primaryButtonClassName()}>
                  <span className="inline-flex items-center justify-center gap-2">
                    <Unlock className="h-4 w-4" aria-hidden />
                    Desbloquear
                  </span>
                </button>
                <button type="button" onClick={unlockMockBio} className={quietButtonClassName()}>
                  <span className="inline-flex items-center justify-center gap-2">
                    <Fingerprint className="h-4 w-4" aria-hidden />
                    Biometría (mock)
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          {unlocked ? (
            <>
              <button type="button" onClick={() => setActiveSheet("compose")} className={tileClassName()}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <FileText className="h-4 w-4 text-white/80" aria-hidden />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-white">Sellar nota</div>
                    <div className="mt-1 text-xs text-white/60">Escritura privada. Archivo sellado.</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/50" aria-hidden />
              </button>

              <button type="button" onClick={() => setActiveSheet("ash")} className={tileClassName()}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <Flame className="h-4 w-4 text-white/80" aria-hidden />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-white">Modo ceniza</div>
                    <div className="mt-1 text-xs text-white/60">Escribe y destruye. No se guarda.</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/50" aria-hidden />
              </button>

              <button type="button" onClick={() => setActiveSheet("notes")} className={tileClassName()}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <Lock className="h-4 w-4 text-white/80" aria-hidden />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-white">Notas selladas</div>
                    <div className="mt-1 text-xs text-white/60">
                      {notes.length ? `${notes.length} nota(s) · archivo (no feed)` : "Sin notas todavía"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/50" aria-hidden />
              </button>
            </>
          ) : null}

          <div className="rounded-3xl bg-[#0b1220]/55 ring-1 ring-white/10 backdrop-blur-md px-5 py-4 text-sm text-white/70 leading-relaxed">
            Nada de aquí entra a patrones. Nada de aquí genera lecturas.
            <div className="mt-3">
              <button
                type="button"
                onClick={() => navigate("/escribir")}
                className="inline-flex items-center justify-center rounded-full bg-white/10 px-3 py-2 text-xs text-white/85 ring-1 ring-white/10 transition hover:bg-white/12"
              >
                Ir a Escribir
              </button>
            </div>
          </div>
        </div>
      </div>

      <GlassSheet
        open={activeSheet === "compose"}
        title="Sellar nota"
        description="Privado. Fuera del sistema."
        onClose={() => setActiveSheet(null)}
      >
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-white/75">Título (opcional)</div>
            <Input
              className={`mt-2 ${darkFieldClassName}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre breve"
            />
          </div>
          <div>
            <div className="text-xs font-medium text-white/75">Contenido</div>
            <Textarea
              className={`mt-2 min-h-[220px] ${darkFieldClassName}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Aquí no hay lectura. Solo archivo sellado."
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button type="button" onClick={() => setContent("")} className={quietButtonClassName()}>
              Limpiar
            </button>
            <button
              type="button"
              onClick={seal}
              className={primaryButtonClassName()}
              disabled={content.trim().length < 3}
            >
              Sellar
            </button>
          </div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={activeSheet === "ash"}
        title="Modo ceniza"
        description="Escribe y destruye. No se guarda."
        onClose={() => setActiveSheet(null)}
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/8 ring-1 ring-white/10 px-5 py-4 text-sm text-white/75">
            Lo que escribas se destruye con un gesto. No queda registro.
          </div>
          <Textarea
            className={`min-h-[220px] ${darkFieldClassName}`}
            value={ashText}
            onChange={(e) => setAshText(e.target.value)}
            placeholder="Escribe. Luego destruye."
          />
          <div className="grid grid-cols-1 gap-2">
            <button type="button" onClick={() => setAshText("")} className={quietButtonClassName()}>
              Limpiar
            </button>
            <button
              type="button"
              onClick={destroyAsh}
              className={primaryButtonClassName()}
              disabled={ashText.trim().length < 3}
            >
              Destruir
            </button>
          </div>
        </div>
      </GlassSheet>

      <GlassSheet
        open={activeSheet === "notes"}
        title="Notas selladas"
        description="Archivo. No feed. No análisis."
        onClose={() => setActiveSheet(null)}
      >
        <div className="space-y-2">
          {notes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setOpenNote(n);
                setActiveSheet("note");
              }}
              className="w-full rounded-3xl bg-white/6 px-5 py-4 text-left ring-1 ring-white/10 transition hover:bg-white/8 active:scale-[0.995]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight text-white">{n.title ?? "Nota sellada"}</div>
                  <div className="mt-1 text-xs text-white/55">{formatDateLongEsMX(n.date)}</div>
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/45" aria-hidden />
              </div>
              <div className="mt-2 text-sm text-white/70 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                {n.content}
              </div>
            </button>
          ))}
          {notes.length === 0 ? <div className="text-sm text-white/65">Sin notas selladas todavía.</div> : null}
        </div>
      </GlassSheet>

      <GlassSheet
        open={activeSheet === "note" && openNote !== null}
        title={openNote?.title ?? "Nota sellada"}
        description={openNote ? formatDateLongEsMX(openNote.date) : undefined}
        onClose={() => {
          setOpenNote(null);
          setActiveSheet(null);
        }}
      >
        {openNote ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/6 ring-1 ring-white/10 px-5 py-4 text-sm text-white/80 whitespace-pre-wrap">
              {openNote.content}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setActiveSheet("notes")}
                className={quietButtonClassName()}
              >
                Volver a notas
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenNote(null);
                  setActiveSheet(null);
                }}
                className={primaryButtonClassName()}
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </GlassSheet>
    </>
  );
}
