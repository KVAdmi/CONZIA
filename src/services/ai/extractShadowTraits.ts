import type { ConziaShadowTrait } from "../../types/models";

type AiShadowTraitsResponse =
  | { ok: true; shadow_traits: ConziaShadowTrait[] }
  | { ok: false; error: string };

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

type TraitRule = {
  trait: string;
  needles: string[];
};

const TRAIT_RULES: TraitRule[] = [
  { trait: "necesidad de control", needles: ["control", "controlador", "controladora", "controlar"] },
  { trait: "perfeccionismo", needles: ["perfeccion", "perfecto", "perfecta", "impecable"] },
  { trait: "egoísmo", needles: ["egoista", "egoísta", "solo piensa en el", "solo piensa en ella"] },
  { trait: "arrogancia", needles: ["arrogante", "prepotente", "superior", "se cree"] },
  { trait: "inflexibilidad", needles: ["inflexible", "terco", "necio", "siempre tiene la razon", "siempre tiene la razón"] },
  { trait: "manipulación", needles: ["manipula", "manipulador", "chantaje", "chantaj"] },
  { trait: "miedo al rechazo", needles: ["rechazo", "me van a rechazar", "no me quieran", "me dejen"] },
  { trait: "miedo al abandono", needles: ["abandono", "me abandonen", "me deje", "me dejen"] },
  { trait: "vergüenza", needles: ["verguenza", "vergüenza", "pena", "humill"] },
  { trait: "ira reprimida", needles: ["me lo trago", "me aguanto", "me callo", "me calle", "exploto"] },
];

function extractTraitsFromText(text: string): string[] {
  const t = normalize(text);
  const found = new Set<string>();
  for (const rule of TRAIT_RULES) {
    if (rule.needles.some((n) => t.includes(normalize(n)))) found.add(rule.trait);
  }
  return [...found];
}

function uniqTraits(traits: ConziaShadowTrait[]): ConziaShadowTrait[] {
  const out: ConziaShadowTrait[] = [];
  const seen = new Set<string>();
  for (const t of traits) {
    const key = normalize(`${t.trait}__${t.origin_probable}`);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function buildFallback(params: {
  rechazo: string;
  envidia: string;
  juicio: string;
}): ConziaShadowTrait[] {
  const traits: ConziaShadowTrait[] = [];

  for (const trait of extractTraitsFromText(params.rechazo)) {
    traits.push({ trait, origin_probable: "Proyección (rechazo)", status: "detected" });
  }
  for (const trait of extractTraitsFromText(params.envidia)) {
    traits.push({ trait, origin_probable: "Sombra dorada (envidia)", status: "detected" });
  }
  for (const trait of extractTraitsFromText(params.juicio)) {
    traits.push({ trait, origin_probable: "Persona (máscara social)", status: "detected" });
  }

  if (!traits.length) {
    traits.push({ trait: "resistencia a nombrar", origin_probable: "Texto libre (sin rasgos explícitos)", status: "detected" });
  }

  return uniqTraits(traits).slice(0, 8);
}

async function requestFromProxy(params: {
  rechazo: string;
  envidia: string;
  juicio: string;
}): Promise<ConziaShadowTrait[]> {
  const resp = await fetch("/api/ai/shadow-traits", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });

  const json = (await resp.json().catch(() => null)) as AiShadowTraitsResponse | null;
  if (!resp.ok || !json) throw new Error(`Proxy IA: HTTP ${resp.status}`);
  if (!json.ok) throw new Error(json.error);
  return json.shadow_traits;
}

export async function extractShadowTraits(params: {
  rechazo: string;
  envidia: string;
  juicio: string;
}): Promise<ConziaShadowTrait[]> {
  try {
    return await requestFromProxy(params);
  } catch {
    return buildFallback(params);
  }
}

