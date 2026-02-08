import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import GlassSheet from "../components/ui/GlassSheet";
import { FieldHint, FieldLabel } from "../components/ui/Field";
import { TESTS, type XmiTest } from "../content/tests";
import { generateTestReading } from "../services/ai";
import { useSubscription } from "../state/subscriptionStore";
import { useXmi } from "../state/xmiStore";
import type { Reading } from "../types/models";
import { toISODateOnly } from "../utils/dates";

type LikertValue = 0 | 1 | 2 | 3 | 4;
const LIKERT: Array<{ value: LikertValue; label: string }> = [
  { value: 0, label: "Nunca" },
  { value: 1, label: "Rara vez" },
  { value: 2, label: "A veces" },
  { value: 3, label: "Frecuente" },
  { value: 4, label: "Casi siempre" },
];

type Result = {
  avg: number;
  severity: "bajo" | "medio" | "alto";
};

function severityFromAvg(avg: number): Result["severity"] {
  if (avg < 1.3) return "bajo";
  if (avg < 2.6) return "medio";
  return "alto";
}

function resultCopy(test: XmiTest, result: Result): { suggests: string; tone: string } {
  const base =
    result.severity === "alto"
      ? "Esto sugiere un patrón sostenido, no un mal día."
      : result.severity === "medio"
        ? "Esto sugiere un patrón activo intermitente."
        : "Esto sugiere una señal baja. Aun así, observa la repetición.";

  const themeLine =
    test.theme === "límites"
      ? "En límites, la trampa suele ser ceder temprano y pagar tarde."
      : test.theme === "evitación"
        ? "En evitación, lo ‘productivo’ puede ser una forma limpia de no mirar."
        : test.theme === "rumiación"
          ? "En rumiación, parece análisis, pero suele ser control."
          : test.theme === "apego"
            ? "En apego, la señal externa reemplaza la claridad."
            : test.theme === "autoestima"
              ? "En autoestima, el permiso externo se disfraza de ‘consideración’."
              : "En desgaste, sostener de más se vuelve identidad.";

  const tone =
    result.severity === "alto"
      ? "No lo negocies con explicación. Nómbralo."
      : result.severity === "medio"
        ? "No lo endulces. Obsérvalo con precisión."
        : "No te confíes. La baja señal no siempre es ausencia.";

  return { suggests: `${base} ${themeLine}`, tone };
}

export default function TestsPage() {
  const { state, dispatch } = useXmi();
  const sub = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locked = !sub.derived.hasSystem;
  const todayISO = toISODateOnly(new Date());

  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const activeTest = useMemo(() => (activeTestId ? TESTS.find((t) => t.id === activeTestId) : undefined), [activeTestId]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, LikertValue | undefined>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [resonance, setResonance] = useState<null | boolean>(null);
  const [readingBusy, setReadingBusy] = useState(false);
  const [testReading, setTestReading] = useState<Reading | null>(null);

  const preselectTestId = searchParams.get("testId");

  const grouped = useMemo(() => {
    const byTheme = new Map<string, XmiTest[]>();
    for (const t of TESTS) byTheme.set(t.theme, [...(byTheme.get(t.theme) ?? []), t]);
    return [...byTheme.entries()].map(([theme, tests]) => ({
      theme,
      tests: tests.slice().sort((a, b) => (a.length < b.length ? -1 : 1)),
    }));
  }, []);

  const suggestedPattern = useMemo(() => {
    if (!activeTest?.suggestedPatternId) return undefined;
    return state.patterns.find((p) => p.id === activeTest.suggestedPatternId);
  }, [activeTest?.suggestedPatternId, state.patterns]);

  function startTest(id: string) {
    setActiveTestId(id);
    setStep(0);
    setAnswers({});
    setResult(null);
    setResonance(null);
    setReadingBusy(false);
    setTestReading(null);
  }

  function exitTest() {
    setActiveTestId(null);
    setStep(0);
    setAnswers({});
    setResult(null);
    setResonance(null);
    setReadingBusy(false);
    setTestReading(null);
  }

  function answerCurrent(v: LikertValue) {
    if (!activeTest) return;
    const q = activeTest.questions[step];
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: v }));
  }

  function computeResult(): Result {
    if (!activeTest) return { avg: 0, severity: "bajo" };
    const values = activeTest.questions.map((q) => {
      const a = answers[q.id] ?? 0;
      const scored = q.reverse ? (4 - a) : a;
      return scored;
    });
    const avg = values.reduce((acc, v) => acc + v, 0) / Math.max(1, values.length);
    return { avg: Math.round(avg * 100) / 100, severity: severityFromAvg(avg) };
  }

  function scoreQuestion(q: XmiTest["questions"][number], answer: LikertValue | undefined): number {
    const v = answer ?? 0;
    return q.reverse ? (4 - v) : v;
  }

  function buildTopSignals(test: XmiTest, limit: number): Array<{ questionId: string; text: string; score: number }> {
    return test.questions
      .map((q) => ({
        questionId: q.id,
        text: q.text,
        score: scoreQuestion(q, answers[q.id]),
      }))
      .sort((a, b) => b.score - a.score)
      .filter((s) => s.score >= 2)
      .slice(0, limit);
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!activeTest || !result) {
        setTestReading(null);
        setReadingBusy(false);
        return;
      }
      if (locked) {
        setTestReading(null);
        setReadingBusy(false);
        return;
      }

      setReadingBusy(true);
      try {
        const signals = buildTopSignals(activeTest, 6);
        const reading = await generateTestReading({
          test: activeTest,
          result: { avg: result.avg, severity: result.severity },
          signals,
          patterns: state.patterns,
          todayISO,
        });
        if (cancelled) return;
        dispatch({ type: "add_reading", reading });
        setTestReading(reading);
      } finally {
        if (!cancelled) setReadingBusy(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [activeTest, dispatch, locked, result, state.patterns, todayISO]);

  useEffect(() => {
    if (!preselectTestId) return;
    if (activeTestId) return;
    if (!TESTS.some((t) => t.id === preselectTestId)) return;
    startTest(preselectTestId);
  }, [activeTestId, preselectTestId]);

  const progressPct = useMemo(() => {
    if (!activeTest) return 0;
    return Math.round(((step + 1) / activeTest.questions.length) * 100);
  }, [activeTest, step]);

  const currentAnswer = useMemo(() => {
    if (!activeTest) return undefined;
    const q = activeTest.questions[step];
    if (!q) return undefined;
    return answers[q.id];
  }, [activeTest, answers, step]);

  return (
    <>
      <div className="min-h-[100svh] px-6 pb-10 pt-14 space-y-4">
        {locked ? (
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">Tests (modo básico)</h2>
                <p className="mt-1 text-sm text-outer-space/70">
                  En modo básico los tests se muestran como ejemplo, pero no activan Caja.
                </p>
              </div>
              <Button variant="primary" onClick={() => navigate("/planes")}>
                Ver planes
              </Button>
            </div>
          </Card>
        ) : null}

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Tests (con propósito)</h2>
              <p className="mt-1 text-sm text-outer-space/70">
                No diagnostican. No etiquetan. Activan lectura y confrontación.
              </p>
            </div>
            <Button variant="primary" disabled={locked} onClick={() => navigate("/caja")}>
              Caja
            </Button>
          </div>

          <div className="mt-5 grid gap-4">
            {grouped.map((g) => (
              <div key={g.theme} className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-5 py-5">
                <div className="text-sm font-semibold tracking-tight text-outer-space">{g.theme}</div>
                <div className="mt-4 grid grid-cols-1 gap-3">
                  {g.tests.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        startTest(t.id);
                      }}
                      className="rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4 text-left transition hover:bg-mint-cream"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold tracking-tight text-outer-space">{t.title}</div>
                        <div className="text-xs text-outer-space/60">
                          {t.length === "corto" ? "Corto" : "Largo"} · {t.questions.length}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-outer-space/70">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold tracking-tight">Qué pasa con el resultado</h3>
          <p className="mt-1 text-sm text-outer-space/70">
            Formato fijo: “Esto sugiere…” + conexión con patrón + CTA.
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
              <div className="text-sm font-medium text-outer-space">Esto sugiere…</div>
              <div className="mt-1 text-sm text-outer-space/75">
                Resultado alto no significa “mal”. Significa repetición.
              </div>
            </div>
            <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
              <div className="text-sm font-medium text-outer-space">Esto se conecta con tu patrón…</div>
              <div className="mt-1 text-sm text-outer-space/75">
                Se propone un patrón probable para activar la Caja.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <GlassSheet
        open={activeTestId !== null}
        title={activeTest?.title ?? "Test"}
        description={activeTest ? `${activeTest.theme} · ${activeTest.questions.length} preguntas` : undefined}
        onClose={exitTest}
      >
        {!activeTest ? null : result ? (
          (() => {
            const copy = resultCopy(activeTest, result);
            return (
              <div className="space-y-4">
                <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
                  <div className="text-xs text-morning-blue">Resultado</div>
                  <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">
                    {result.severity.toUpperCase()} · promedio {result.avg}
                  </div>
                  <div className="mt-2 text-sm text-outer-space/75">{copy.suggests}</div>
                  <div className="mt-2 text-sm text-outer-space/75">{copy.tone}</div>
                </div>

                {suggestedPattern ? (
                  <div className="rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4">
                    <div className="text-xs text-morning-blue">Conexión probable</div>
                    <div className="mt-1 text-sm font-semibold tracking-tight text-outer-space">
                      {suggestedPattern.name}
                    </div>
                    <div className="mt-2 text-sm text-outer-space/75">
                      Esto no te define. Te muestra estructura para elegir distinto.
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-morning-blue">Lectura del test</div>
                      <div className="mt-1 text-sm text-outer-space/75">
                        Formato fijo. Sin frases genéricas.
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!testReading}
                      onClick={() => {
                        if (!testReading) return;
                        exitTest();
                        navigate(`/lecturas?readingId=${encodeURIComponent(testReading.id)}`);
                      }}
                    >
                      Ver en Lecturas
                    </Button>
                  </div>

                  {readingBusy ? (
                    <div className="mt-4 text-sm text-outer-space/70">Generando lectura…</div>
                  ) : testReading ? (
                    <div className="mt-4 space-y-4">
                      <div className="text-xs text-outer-space/60">
                        Base: {testReading.content.loQueVeo}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-outer-space/70">Esto sugiere</div>
                        <div className="mt-1 text-sm text-outer-space/85">{testReading.content.contencion}</div>
                      </div>
                      {testReading.content.patron ? (
                        <div>
                          <div className="text-xs font-medium text-outer-space/70">Patrón</div>
                          <div className="mt-1 text-sm text-outer-space/85">{testReading.content.patron}</div>
                        </div>
                      ) : null}
                      <div>
                        <div className="text-xs font-medium text-outer-space/70">Lo que evitas</div>
                        <div className="mt-1 text-sm text-outer-space/85">{testReading.content.loQueEvitas}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-outer-space/70">Pregunta</div>
                        <div className="mt-1 text-sm text-outer-space/85">{testReading.content.pregunta}</div>
                      </div>
                      {testReading.content.accionMinima ? (
                        <div>
                          <div className="text-xs font-medium text-outer-space/70">Acción mínima</div>
                          <div className="mt-1 text-sm text-outer-space/85">{testReading.content.accionMinima}</div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-outer-space/70">Sin lectura.</div>
                  )}
                </div>

                <div className="rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-4">
                  <FieldLabel>¿Te resonó?</FieldLabel>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant={resonance === true ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setResonance(true)}
                    >
                      Sí
                    </Button>
                    <Button
                      variant={resonance === false ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setResonance(false)}
                    >
                      No
                    </Button>
                  </div>
                  <FieldHint className="mt-2">
                    Resonancia = señal para Caja. No es validación emocional.
                  </FieldHint>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => startTest(activeTest.id)}>Repetir</Button>
                  <Button onClick={exitTest}>Cerrar</Button>
                  {suggestedPattern ? (
                    <Button
                      variant="primary"
                      disabled={locked}
                      onClick={() => navigate(`/caja?patternId=${encodeURIComponent(suggestedPattern.id)}`)}
                    >
                      Entrar a Caja de Enfrentamiento
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })()
        ) : (
          (() => {
            const q = activeTest.questions[step]!;
            const current = currentAnswer;
            return (
              <div className="space-y-4">
                <div className="rounded-xl bg-white ring-1 ring-gainsboro/70 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-xs text-morning-blue">
                      Pregunta {step + 1} de {activeTest.questions.length}
                    </div>
                    <div className="text-xs text-outer-space/60">{progressPct}%</div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-gainsboro/70 overflow-hidden">
                    <div className="h-full bg-camel" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="mt-4 text-sm font-semibold tracking-tight text-outer-space">{q.text}</div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {LIKERT.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => answerCurrent(opt.value)}
                      className={
                        current === opt.value
                          ? "rounded-xl bg-outer-space px-4 py-3 text-left text-sm text-white"
                          : "rounded-xl bg-mint-cream/70 ring-1 ring-gainsboro/60 px-4 py-3 text-left text-sm text-outer-space/80 hover:bg-mint-cream"
                      }
                      aria-pressed={current === opt.value}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                    Anterior
                  </Button>
                  {step < activeTest.questions.length - 1 ? (
                    <Button
                      variant="primary"
                      onClick={() => setStep((s) => Math.min(activeTest.questions.length - 1, s + 1))}
                      disabled={currentAnswer === undefined}
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => setResult(computeResult())}
                      disabled={currentAnswer === undefined}
                    >
                      Ver resultado
                    </Button>
                  )}
                </div>
              </div>
            );
          })()
        )}
      </GlassSheet>
    </>
  );
}
