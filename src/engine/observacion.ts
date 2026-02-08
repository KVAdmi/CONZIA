const CONNECTORS = ["porque", "es que", "pero", "entonces", "ya que"] as const;

function countSentencesByDot(text: string): number {
  return text
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function narrativeScore(text: string): number {
  const raw = text.trim();
  if (!raw) return 0;

  const lower = raw.toLowerCase();
  let score = 0;

  if (CONNECTORS.some((c) => lower.includes(c))) score += 1;
  if (raw.length > 160) score += 1;
  if (countSentencesByDot(raw) > 2) score += 1;

  return score;
}

