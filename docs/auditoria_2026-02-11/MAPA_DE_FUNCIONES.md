# Mapa de funciones / exports (auto-generado)

Generado: `2026-02-11T18:04:31.977Z`
Commit: `784539c`
Scope: `src/**/*.ts(x)`

> Nota: Esto lista *exports* (incluye componentes React). No describe lógica interna.

## `src/ai/responseComposer.ts`
- `type` `ResponseComposerInput`
- `type` `ResponseComposerOutput`
- `function` `inferPatternTag(input: {
  text?: string;
  trap?: ConziaTrap | null;
  friccion?: ConziaFriccion | null;
}): ConziaPatternTag`
- `function` `composeConziaResponse(input: ResponseComposerInput): ResponseComposerOutput`

## `src/App.tsx`
- `default function` `App()`

## `src/app/AppLayout.tsx`
- `default function` `AppLayout()`

## `src/app/BottomNav.tsx`
- `default function` `BottomNav()`

## `src/app/Header.tsx`
- `default function` `Header()`

## `src/components/charts/Heatmap.tsx`
- `type` `HeatCell`
- `default function` `Heatmap({
  cells,
  title,
}: {
  cells: HeatCell[]; // last 28–35 días
  title: string;
})`

## `src/components/charts/HorizontalBarChart.tsx`
- `type` `HorizontalBarDatum`
- `default function` `HorizontalBarChart({
  data,
  title,
}: {
  data: HorizontalBarDatum[];
  title: string;
})`

## `src/components/charts/LineChart.tsx`
- `default function` `LineChart({
  points,
  title,
}: {
  points: Point[];
  title: string;
})`

## `src/components/charts/MiniSparkline.tsx`
- `default function` `MiniSparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
})`

## `src/components/charts/PatternConstellation.tsx`
- `default function` `PatternConstellation({
  patterns,
  className,
  onSelect,
}: {
  patterns: Pattern[];
  className?: string;
  onSelect?: (patternId: string) => void;
})`

## `src/components/charts/Sparkline.tsx`
- `default function` `Sparkline({
  points,
  title,
  subtitle,
}: {
  points: Point[];
  title: string;
  subtitle?: string;
})`

## `src/components/charts/StackedBarChart.tsx`
- `type` `BarDatum`
- `default function` `StackedBarChart({
  data,
  title,
}: {
  data: BarDatum[];
  title: string;
})`

## `src/components/charts/svgPaths.ts`
- `type` `XY`
- `function` `pointsFromValues(params: {
  values: number[];
  width: number;
  height: number;
  padding: number;
  domain?: { min: number; max: number };
}): XY[]`
- `function` `smoothPath(points: XY[], smoothing): string`
- `function` `areaFromLine(params: { linePath: string; points: XY[]; baselineY: number }): string`

## `src/components/ui/Button.tsx`
- `default function` `Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size })`

## `src/components/ui/Card.tsx`
- `default function` `Card({ className, ...props }: HTMLAttributes<HTMLDivElement>)`

## `src/components/ui/Chip.tsx`
- `default function` `Chip({
  className,
  selected,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean })`

## `src/components/ui/Collapsible.tsx`
- `default function` `Collapsible({
  title,
  description,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
})`

## `src/components/ui/Field.tsx`
- `function` `FieldLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>)`
- `function` `FieldHint({ className, ...props }: HTMLAttributes<HTMLDivElement>)`

## `src/components/ui/GlassSheet.tsx`
- `default function` `GlassSheet({
  open,
  title,
  description,
  onClose,
  children,
  className,
  zIndexClassName = "z-50",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  zIndexClassName?: string;
})`

## `src/components/ui/Input.tsx`
- `default function` `Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>)`

## `src/components/ui/Modal.tsx`
- `default function` `Modal({
  open,
  title,
  description,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
})`

## `src/components/ui/ProgressRing.tsx`
- `default function` `ProgressRing({
  label,
  sublabel,
  value,
  size = 64,
  strokeWidth = 8,
  className,
  ...props
}: Props)`

## `src/components/ui/RadialProgress.tsx`
- `default function` `RadialProgress({
  value,
  size = 220,
  strokeWidth = 14,
  trackColor = "rgba(255,255,255,0.18)",
  className,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  className?: string;
  children?: React.ReactNode;
})`

## `src/components/ui/Range.tsx`
- `default function` `Range({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  className,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  ariaLabel: string;
})`

## `src/components/ui/SegmentedControl.tsx`
- `type` `SegmentedOption`
- `default function` `SegmentedControl({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<SegmentedOption<T>>;
  ariaLabel: string;
})`

## `src/components/ui/Select.tsx`
- `default function` `Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>)`

## `src/components/ui/Sheet.tsx`
- `default function` `Sheet({
  open,
  title,
  description,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
})`

## `src/components/ui/Textarea.tsx`
- `default function` `Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>)`

## `src/components/ui/Toggle.tsx`
- `default function` `Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
})`

## `src/content/shadowPractices.ts`
- `type` `ShadowPractice`
- `const` `SHADOW_PRACTICES`

## `src/content/tests.ts`
- `type` `TestTheme`
- `type` `TestLength`
- `type` `TestQuestion`
- `type` `ConziaTest`
- `const` `TESTS`

## `src/content/tools.ts`
- `type` `QuickTool`
- `const` `QUICK_TOOLS`

## `src/content/truths.ts`
- `type` `UncomfortableTruth`
- `const` `UNCOMFORTABLE_TRUTHS`

## `src/data/seed.ts`
- `function` `loadSeedData(): ConziaSeedData`

## `src/engine/conziaMotor.ts`
- `function` `cutLineForTrap(trap: ConziaTrap): string`
- `function` `conziaGuidanceProfile(input: {
  archetypeDominant: ConziaArchetype;
  archetypeConfidence: number;
  friccionPrincipal: ConziaFriccion;
  costoDominante: string;
  currentMonth?: number;
}): ConziaGuidanceProfile`
- `function` `todayPlanFromProfile(profile: ConziaGuidanceProfile): ConziaTodayPlan`
- `function` `getArchetypeLabel(archetype: ConziaArchetype): string`
- `function` `getArchetypeDescription(archetype: ConziaArchetype, isShadow: boolean): string`

## `src/engine/observacion.ts`
- `function` `narrativeScore(text: string): number`

## `src/metrics/computeMetrics.ts`
- `type` `PatternStatus`
- `type` `ConziaMetrics`
- `function` `computeMetrics(input: {
  entries: ConziaEntry[];
  sessions: ConziaSession[];
  processId: string;
  todayKey: string;
  now?: Date;
}): ConziaMetrics`

## `src/pages/AccesoPage.tsx`
- `default function` `AccesoPage()`

## `src/pages/ArchivoPage.tsx`
- `default function` `ArchivoPage()`

## `src/pages/ArquetipoChatPage.tsx`
- `default function` `ArquetipoChatPage()`

## `src/pages/ArquetiposPage.tsx`
- `default function` `ArquetiposPage()`

## `src/pages/AuthCallbackPage.tsx`
- `default function` `AuthCallbackPage()`

## `src/pages/BootPage.tsx`
- `default function` `BootPage()`

## `src/pages/BovedaPage.tsx`
- `default function` `BovedaPage()`

## `src/pages/CajaEnfrentamientoPage.tsx`
- `default function` `CajaEnfrentamientoPage()`

## `src/pages/CheckoutPage.tsx`
- `default function` `CheckoutPage()`

## `src/pages/ConfiguracionPage.tsx`
- `default function` `ConfiguracionPage()`

## `src/pages/ConsultorioPage.tsx`
- `default function` `ConsultorioPage()`

## `src/pages/CrisisPage.tsx`
- `default function` `CrisisPage()`

## `src/pages/DesahogoPage.tsx`
- `default function` `DesahogoPage()`

## `src/pages/DescargaPage.tsx`
- `default function` `DescargaPage()`

## `src/pages/EntradaPage.tsx`
- `default function` `EntradaPage()`

## `src/pages/EscribirPage.tsx`
- `default function` `EscribirPage()`

## `src/pages/EspejoNegroPage.tsx`
- `default function` `EspejoNegroPage()`

## `src/pages/HoyPage.tsx`
- `default function` `HoyPage()`

## `src/pages/InicioPage.tsx`
- `default function` `InicioPage()`

## `src/pages/IntegracionCompasPage.tsx`
- `default function` `IntegracionCompasPage()`

## `src/pages/IntegracionHerramientasPage.tsx`
- `default function` `IntegracionHerramientasPage()`

## `src/pages/IntegracionPage.tsx`
- `default function` `IntegracionPage()`

## `src/pages/IntegracionRitualPage.tsx`
- `default function` `IntegracionRitualPage()`

## `src/pages/LecturasPage.tsx`
- `default function` `LecturasPage()`

## `src/pages/LoginPage.tsx`
- `default function` `LoginPage()`

## `src/pages/MasPage.tsx`
- `default function` `MasPage()`

## `src/pages/MesaPage.tsx`
- `default function` `MesaPage()`

## `src/pages/ObservacionPage.tsx`
- `default function` `ObservacionPage()`

## `src/pages/OnboardingPage.tsx`
- `default function` `OnboardingPage()`

## `src/pages/PatronesArchivoPage.tsx`
- `default function` `PatronesArchivoPage()`

## `src/pages/PatronesPage.tsx`
- `default function` `PatronesPage()`

## `src/pages/PaymentPage.tsx`
- `default function` `PaymentPage()`

## `src/pages/PerfilPage.tsx`
- `default function` `PerfilPage()`

## `src/pages/PlanesEntradaPage.tsx`
- `default function` `PlanesEntradaPage()`

## `src/pages/PlanesPage.tsx`
- `default function` `PlanesPage()`

## `src/pages/ProcesoPage.tsx`
- `default function` `ProcesoPage()`

## `src/pages/RegistroPage.tsx`
- `default function` `RegistroPage()`

## `src/pages/RepeticionPage.tsx`
- `default function` `RepeticionPage()`

## `src/pages/ResultadosPage.tsx`
- `default function` `ResultadosPage()`

## `src/pages/SesionPage.tsx`
- `default function` `SesionPage()`

## `src/pages/SuenosPage.tsx`
- `default function` `SuenosPage()`

## `src/pages/TeatroPage.tsx`
- `default function` `TeatroPage()`

## `src/pages/TestsPage.tsx`
- `default function` `TestsPage()`

## `src/services/ai/analyzeDesahogo.ts`
- `function` `analyzeDesahogo(params: { text: string, month?: number }): Promise<ConziaDesahogoAnalysis>`

## `src/services/ai/classifyEntry.ts`
- `type` `EntryClassification`
- `function` `classifyEntry(params: { entry: Entry; patterns: Pattern[] }): EntryClassification`

## `src/services/ai/detectPatterns.ts`
- `function` `detectPatterns(params: {
  todayISO?: string;
  entries: Entry[];
  patterns: Pattern[];
}): Pattern[]`

## `src/services/ai/extractShadowTraits.ts`
- `function` `extractShadowTraits(params: {
  rechazo: string;
  envidia: string;
  juicio: string;
}): Promise<ConziaShadowTrait[]>`

## `src/services/ai/generateAlerts.ts`
- `function` `generateAlerts(params: {
  todayISO?: string;
  entries: Entry[];
  intentions: Intention[];
  patterns: Pattern[];
  checkIns: CheckIn[];
}): Alert[]`

## `src/services/ai/generateMirrorStory.ts`
- `function` `generateMirrorStory(params: { pattern: Pattern; evidence?: Entry[] }): Promise<MirrorStory>`

## `src/services/ai/generateReading.ts`
- `function` `generateReading(params: {
  entry: Entry;
  patterns: Pattern[];
  entries?: Entry[];
  todayISO?: string;
}): Promise<Reading>`

## `src/services/ai/generateReflection.ts`
- `function` `generateReflection(params: { entry: Entry; todayISO?: string }): Promise<Reading>`

## `src/services/ai/generateTestReading.ts`
- `type` `TestResult`
- `type` `TestSignal`
- `function` `generateTestReading(params: {
  test: ConziaTest;
  result: TestResult;
  signals: TestSignal[];
  patterns: Pattern[];
  todayISO?: string;
}): Promise<Reading>`

## `src/services/ai/index.ts`
- `re-export` `generateAlerts` from `./generateAlerts`
- `re-export` `classifyEntry` from `./classifyEntry`
- `re-export` `detectPatterns` from `./detectPatterns`
- `re-export` `analyzeDesahogo` from `./analyzeDesahogo`
- `re-export` `extractShadowTraits` from `./extractShadowTraits`
- `re-export` `generateMirrorStory` from `./generateMirrorStory`
- `re-export` `generateReading` from `./generateReading`
- `re-export` `generateReflection` from `./generateReflection`
- `re-export` `generateTestReading` from `./generateTestReading`
- `re-export` `Alert` from `./types`
- `re-export` `AlertKind` from `./types`

## `src/services/ai/types.ts`
- `type` `AlertKind`
- `type` `Alert`

## `src/services/supabase/auth.ts`
- `type` `SupabaseUser`
- `type` `SupabaseSession`
- `function` `signInWithPassword(email: string, password: string): Promise<ApiOk<SupabaseSession> | ApiErr>`
- `function` `signUpWithPassword(email: string, password: string): Promise<
  ApiOk<{ user: SupabaseUser; session?: SupabaseSession }> | ApiErr
>`
- `function` `refreshSession(refreshToken: string): Promise<ApiOk<SupabaseSession> | ApiErr>`
- `function` `exchangeCodeForSession(authCode: string, codeVerifier: string): Promise<ApiOk<SupabaseSession> | ApiErr>`
- `function` `signOut(accessToken: string): Promise<ApiOk<null> | ApiErr>`
- `function` `buildOAuthAuthorizeUrl(args: {
  provider: "google";
  redirectTo: string;
  codeChallenge: string;
}): string`

## `src/services/supabase/config.ts`
- `type` `SupabaseConfig`
- `function` `getSupabaseConfig(): SupabaseConfig`

## `src/state/authStore.tsx`
- `function` `AuthProvider({ children }: { children: React.ReactNode })`
- `function` `useAuth()`

## `src/state/conziaStore.tsx`
- `function` `ConziaProvider({
  children,
  storageKey,
}: {
  children: React.ReactNode;
  storageKey: string;
})`
- `function` `useConzia()`
- `function` `useConziaLookup()`
- `function` `useConziaDerived()`

## `src/state/subscriptionStore.tsx`
- `type` `PlanId`
- `function` `SubscriptionProvider({
  actorId,
  children,
}: {
  actorId: string;
  children: React.ReactNode;
})`
- `function` `useSubscription()`

## `src/types/models.ts`
- `type` `ISODateString`
- `type` `EnergyLevel`
- `type` `ClarityLevel`
- `type` `EntryType`
- `type` `EntryContext`
- `type` `EntryBoundary`
- `type` `EntryReaction`
- `type` `RepeatSignal`
- `type` `Entry`
- `type` `IntentionType`
- `type` `IntentionOutcome`
- `type` `IntentionBlock`
- `type` `Intention`
- `type` `Trend`
- `type` `Pattern`
- `type` `ReadingType`
- `type` `ReadingContent`
- `type` `Reading`
- `type` `VaultNote`
- `type` `MirrorStory`
- `type` `CheckIn`
- `type` `ConziaSeedData`
- `type` `DoorId`
- `type` `ConziaPatternTag`
- `type` `ConziaShadowTrait`
- `type` `ConziaChatTurn`
- `type` `ConziaDoorSummary`
- `type` `ConziaArchetype`
- `type` `ConziaDrivingStyle`
- `type` `ConziaFriccion`
- `type` `ConziaProfile`
- `type` `ConziaProcessStatus`
- `type` `ConziaProcess`
- `type` `ConziaSession`
- `type` `ConziaTrap`
- `type` `ConziaPace`
- `type` `ConziaRecommendedDoor`
- `type` `ConziaGuidanceProfile`
- `type` `ConziaTodayPlan`
- `type` `ConziaDesahogoEmotion`
- `type` `ConziaDesahogoRiskFlag`
- `type` `ConziaDesahogoRecommendedNext`
- `type` `ConziaDesahogoAnalysis`
- `type` `ConziaTherapyEntrySource`
- `type` `ConziaEntrySource`
- `type` `ConziaTherapyEntry`
- `type` `ConziaObservationEntry`
- `type` `ConziaEntry`
- `type` `ConziaChallengeStatus`
- `type` `ConziaChallenge`

## `src/utils/cn.ts`
- `function` `cn(...values: Array<string | false | null | undefined>): string`

## `src/utils/dates.ts`
- `function` `parseISODate(value: string): Date`
- `function` `toISODateOnly(date: Date): string`
- `function` `addDays(date: Date, days: number): Date`
- `function` `diffDays(from: Date, to: Date): number`
- `function` `formatDateLongEsMX(value: string): string`

## `src/utils/id.ts`
- `function` `createId(prefix: string): string`

## `src/utils/pkce.ts`
- `function` `generateCodeVerifier(length): string`
- `function` `createCodeChallenge(verifier: string): Promise<string>`

## `src/utils/useTypewriter.ts`
- `function` `useTypewriter(params: {
  text: string;
  enabled?: boolean;
  speedMs?: number;
  chunkSize?: number;
})`

---

Total exports listados: **208**
