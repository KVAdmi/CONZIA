# MOTORES DE CONZIA

Este directorio contiene los **5 motores críticos** que impulsan la lógica terapéutica de CONZIA. Cada motor es independiente y puede ser usado en diferentes partes de la aplicación.

---

## 📋 Motores Disponibles

### 1️⃣ **Motor de Arquetipos** (`archetypeEngine.ts`)

Calcula y recalcula los scores de los 4 arquetipos junguianos (Guerrero, Rey, Amante, Mago).

**Funciones principales:**
- `calculateInitialScores(responses)` - Calcula scores iniciales del test de 20 preguntas
- `recalculateScores(currentScores, shadowTraits, completedChallenges)` - Recalcula semanalmente
- `extractShadowTraits(traits)` - Extrae rasgos de sombra de un array de strings
- `getArchetypeStatus(score)` - Determina si un arquetipo está dominante, equilibrado o en sombra
- `generateRecommendations(scores)` - Genera recomendaciones basadas en los scores

**Uso:**
```typescript
import { calculateInitialScores, recalculateScores } from "@/engine";

const scores = calculateInitialScores(testResponses);
const newScores = recalculateScores(scores, shadowTraits, challenges);
```

---

### 2️⃣ **Motor de Resistencia** (`resistanceEngine.ts`)

Mide el nivel de resistencia del usuario (0-100) usando 7 indicadores ponderados.

**Funciones principales:**
- `calculateResistanceIndex(indicators)` - Calcula el índice de resistencia
- `getResistanceMetrics(indicators)` - Obtiene métricas completas con nivel y color
- `calculateSurfaceLanguage(text)` - Calcula % de lenguaje superficial
- `calculateRepetitionRate(entries)` - Calcula tasa de repetición de temas
- `calculateChallengeAvoidance(challenges)` - Calcula % de evitación de retos
- `calculateEmotionalFlatness(entries)` - Calcula aplanamiento emocional
- `checkResistanceTriggers(index, indicators)` - Verifica alertas de resistencia
- `determineExperienceAdjustments(index)` - Ajusta la experiencia según resistencia

**Uso:**
```typescript
import { getResistanceMetrics, checkResistanceTriggers } from "@/engine";

const metrics = getResistanceMetrics(indicators);
const alerts = checkResistanceTriggers(metrics.resistance_index, indicators);
```

---

### 3️⃣ **Motor de Sistema de Mes** (`monthEngine.ts`)

Determina la fase terapéutica del usuario (Catarsis, Elucidación, Integración) y genera el system prompt correspondiente.

**Funciones principales:**
- `determineCurrentMonth(programStartDate)` - Determina el mes actual (1, 2, 3)
- `getSystemPrompt(month, daysUntilNextPhase)` - Obtiene el system prompt específico
- `checkPhaseTransition(daysInProgram)` - Verifica si hay transición de fase
- `validateProgramIntegrity(programStartDate, currentMonth)` - Valida integridad del programa
- `buildClaudeContext(month, daysInProgram, additionalContext)` - Construye contexto para Claude
- `getWelcomeMessage(month)` - Genera mensaje de bienvenida según el mes
- `isFeatureUnlocked(feature, currentMonth)` - Verifica si una feature está desbloqueada

**Uso:**
```typescript
import { determineCurrentMonth, getSystemPrompt } from "@/engine";

const monthStatus = determineCurrentMonth(user.program_start_date);
const systemPrompt = getSystemPrompt(monthStatus.current_month, monthStatus.days_until_next_phase);
```

---

### 4️⃣ **Motor de Retos** (`challengeEngine.ts`)

Genera retos personalizados basados en el arquetipo más débil, tema detectado y mes actual.

**Funciones principales:**
- `generateChallenge(shadowArchetype, theme, currentMonth, resistanceIndex)` - Genera un reto personalizado
- `validateChallengeCompletion(userReflection, validationCriteria)` - Valida si el usuario completó el reto
- `extractDominantTheme(entries)` - Extrae el tema dominante de las entradas recientes

**Uso:**
```typescript
import { generateChallenge, validateChallengeCompletion } from "@/engine";

const challenge = generateChallenge("guerrero", "relaciones", 1, 50);
const validation = validateChallengeCompletion(userReflection, challenge.validation_criteria);
```

---

### 5️⃣ **Motor de Memoria Evolutiva** (`memoryEngine.ts`)

Construye contexto histórico para Claude usando entradas, patrones, traumas y memorias críticas.

**Funciones principales:**
- `buildClaudeContext(...)` - Construye el payload completo de contexto
- `buildSystemPromptContext(context)` - Construye el texto de contexto para el system prompt
- `detectNewPatterns(text, previousEntries)` - Detecta nuevos patrones en una entrada
- `detectTraumaNodes(text)` - Detecta nodos de trauma en una entrada
- `extractInsights(claudeResponse)` - Extrae insights clave de la respuesta de Claude
- `trimContextIfNeeded(context)` - Recorta el contexto si excede el límite de tokens

**Uso:**
```typescript
import { buildClaudeContext, buildSystemPromptContext } from "@/engine";

const context = buildClaudeContext(
  userId,
  daysInProgram,
  currentMonth,
  recentEntries,
  activePatterns,
  traumaNodes,
  criticalMemories,
  currentChallenge
);

const contextText = buildSystemPromptContext(context);
```

---

## 🔧 Integración con el Código Existente

### Ejemplo: Integrar con `analyzeDesahogo.ts`

```typescript
import { 
  determineCurrentMonth, 
  getSystemPrompt,
  buildClaudeContext,
  buildSystemPromptContext,
  detectNewPatterns,
  detectTraumaNodes
} from "@/engine";

export async function analyzeDesahogo(text: string, userId: string) {
  // 1. Determinar mes actual
  const monthStatus = determineCurrentMonth(user.program_start_date);
  
  // 2. Obtener system prompt
  const systemPrompt = getSystemPrompt(
    monthStatus.current_month,
    monthStatus.days_until_next_phase
  );
  
  // 3. Construir contexto histórico
  const context = buildClaudeContext(
    userId,
    monthStatus.days_in_program,
    monthStatus.current_month,
    recentEntries,
    activePatterns,
    traumaNodes,
    criticalMemories
  );
  
  const contextText = buildSystemPromptContext(context);
  
  // 4. Enviar a Claude
  const response = await callClaude(systemPrompt + contextText, text);
  
  // 5. Detectar patrones y traumas
  const newPatterns = detectNewPatterns(text, recentEntries);
  const newTraumas = detectTraumaNodes(text);
  
  return { response, newPatterns, newTraumas };
}
```

---

## 📊 Flujo de Datos

```
Usuario escribe desahogo
    ↓
Motor de Mes → Determina fase (1, 2, 3)
    ↓
Motor de Memoria → Construye contexto histórico
    ↓
Claude recibe system prompt + contexto
    ↓
Claude responde
    ↓
Motor de Resistencia → Calcula índice
    ↓
Motor de Retos → Genera reto si es necesario
    ↓
Motor de Arquetipos → Actualiza scores
```

---

## 🚀 Próximos Pasos

1. **Integrar con Supabase**: Conectar los motores con las tablas de la base de datos
2. **Crear servicios**: Crear `src/services/engineService.ts` para centralizar el uso de los motores
3. **Actualizar UI**: Mostrar métricas de resistencia, arquetipos y retos en el dashboard
4. **Testing**: Crear tests unitarios para cada motor

---

## 📝 Notas Técnicas

- Todos los motores son **funciones puras** (sin efectos secundarios)
- No dependen de Supabase directamente (eso se maneja en los servicios)
- Están completamente tipados con TypeScript
- Siguen la nomenclatura de `models.ts` (guerrero, rey, amante, mago)
