import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { TESTS } from "../src/content/tests.ts";

function repoRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

function tryGitShortSha(cwd) {
  try {
    return execSync("git rev-parse --short HEAD", { cwd, stdio: ["ignore", "pipe", "ignore"] })
      .toString("utf8")
      .trim();
  } catch {
    return null;
  }
}

function mdEscape(text) {
  return String(text).replaceAll("`", "\\`");
}

async function main() {
  const root = repoRoot();
  const outDir = path.join(root, "docs", "auditoria_2026-02-11");
  const outPath = path.join(outDir, "TESTS_PREGUNTAS.md");
  await fs.mkdir(outDir, { recursive: true });

  const sha = tryGitShortSha(root);
  const generatedAt = new Date().toISOString();

  const lines = [];
  lines.push("# Tests y preguntas (auto-generado)");
  lines.push("");
  lines.push(`Generado: \`${generatedAt}\``);
  if (sha) lines.push(`Commit: \`${sha}\``);
  lines.push("Fuente: `src/content/tests.ts`");
  lines.push("");
  lines.push(`Total tests: **${TESTS.length}**`);
  lines.push("");

  for (const t of TESTS) {
    lines.push(`## ${mdEscape(t.title)}`);
    lines.push("");
    lines.push(`- id: \`${mdEscape(t.id)}\``);
    lines.push(`- theme: \`${mdEscape(t.theme)}\``);
    lines.push(`- length: \`${mdEscape(t.length)}\``);
    if (t.suggestedPatternId) lines.push(`- suggestedPatternId: \`${mdEscape(t.suggestedPatternId)}\``);
    lines.push("");
    lines.push(mdEscape(t.description));
    lines.push("");
    lines.push(`Preguntas (${t.questions.length}):`);
    lines.push("");
    for (const q of t.questions) {
      const meta = [
        q.reverse ? "reverse" : null,
        q.archetype ? `arquetipo:${q.archetype}` : null,
      ].filter(Boolean);
      const suffix = meta.length ? ` (${meta.join(", ")})` : "";
      lines.push(`- \`${mdEscape(q.id)}\`${suffix}: ${mdEscape(q.text)}`);
    }
    lines.push("");
  }

  await fs.writeFile(outPath, lines.join("\n"), "utf8");
  // eslint-disable-next-line no-console
  console.log(`OK: ${path.relative(root, outPath)}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

