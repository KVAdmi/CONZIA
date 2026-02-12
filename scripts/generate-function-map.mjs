import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

function repoRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...(await walk(full)));
    } else {
      out.push(full);
    }
  }
  return out;
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers?.some((m) => m.kind === kind));
}

function formatFnSignature(sf, node, name) {
  const params = node.parameters
    .map((p) => {
      const rest = p.dotDotDotToken ? "..." : "";
      const pname = p.name.getText(sf);
      const optional = p.questionToken ? "?" : "";
      const ptype = p.type ? `: ${p.type.getText(sf)}` : "";
      return `${rest}${pname}${optional}${ptype}`;
    })
    .join(", ");
  const rt = node.type ? `: ${node.type.getText(sf)}` : "";
  return `${name}(${params})${rt}`;
}

function collectExports(filePath, sourceText) {
  const isTsx = filePath.endsWith(".tsx");
  const sf = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.ES2022,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const exports = [];

  for (const stmt of sf.statements) {
    // export default ...
    if (ts.isExportAssignment(stmt)) {
      const isDefault = stmt.isExportEquals === false;
      if (isDefault) {
        exports.push({ kind: "default", name: stmt.expression.getText(sf) });
      }
      continue;
    }

    // export { ... } from "..."
    if (ts.isExportDeclaration(stmt)) {
      const from = stmt.moduleSpecifier ? stmt.moduleSpecifier.getText(sf).slice(1, -1) : null;
      if (!stmt.exportClause) {
        exports.push({ kind: "re-export", name: "*", from });
        continue;
      }
      if (ts.isNamedExports(stmt.exportClause)) {
        for (const el of stmt.exportClause.elements) {
          const name = el.name.getText(sf);
          const as = el.propertyName ? el.propertyName.getText(sf) : null;
          exports.push({ kind: "re-export", name, as, from });
        }
      }
      continue;
    }

    const isExported = hasModifier(stmt, ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;
    const isDefault = hasModifier(stmt, ts.SyntaxKind.DefaultKeyword);

    if (ts.isFunctionDeclaration(stmt)) {
      const name = stmt.name?.getText(sf) ?? "(anonymous)";
      exports.push({
        kind: isDefault ? "default function" : "function",
        name,
        signature: formatFnSignature(sf, stmt, name),
      });
      continue;
    }

    if (ts.isClassDeclaration(stmt)) {
      const name = stmt.name?.getText(sf) ?? "(anonymous)";
      exports.push({ kind: isDefault ? "default class" : "class", name });
      continue;
    }

    if (ts.isInterfaceDeclaration(stmt)) {
      exports.push({ kind: "interface", name: stmt.name.getText(sf) });
      continue;
    }

    if (ts.isTypeAliasDeclaration(stmt)) {
      exports.push({ kind: "type", name: stmt.name.getText(sf) });
      continue;
    }

    if (ts.isEnumDeclaration(stmt)) {
      exports.push({ kind: "enum", name: stmt.name.getText(sf) });
      continue;
    }

    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name)) continue;
        const name = decl.name.getText(sf);
        exports.push({ kind: "const", name });
      }
      continue;
    }
  }

  return exports;
}

function mdEscape(text) {
  return text.replaceAll("`", "\\`");
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

async function main() {
  const root = repoRoot();
  const srcDir = path.join(root, "src");
  const outDir = path.join(root, "docs", "auditoria_2026-02-11");
  const outPath = path.join(outDir, "MAPA_DE_FUNCIONES.md");

  await fs.mkdir(outDir, { recursive: true });

  const all = await walk(srcDir);
  const files = all
    .filter((p) => (p.endsWith(".ts") || p.endsWith(".tsx")) && !p.endsWith(".d.ts"))
    .sort((a, b) => a.localeCompare(b));

  const sha = tryGitShortSha(root);
  const generatedAt = new Date().toISOString();

  const sections = [];
  sections.push(`# Mapa de funciones / exports (auto-generado)`);
  sections.push("");
  sections.push(`Generado: \`${generatedAt}\``);
  if (sha) sections.push(`Commit: \`${sha}\``);
  sections.push(`Scope: \`src/**/*.ts(x)\``);
  sections.push("");
  sections.push("> Nota: Esto lista *exports* (incluye componentes React). No describe lógica interna.");
  sections.push("");

  let totalItems = 0;

  for (const filePath of files) {
    const rel = path.relative(root, filePath).replaceAll(path.sep, "/");
    const sourceText = await fs.readFile(filePath, "utf8");
    const exported = collectExports(filePath, sourceText);
    if (!exported.length) continue;

    sections.push(`## \`${mdEscape(rel)}\``);
    for (const item of exported) {
      totalItems += 1;
      if (item.kind === "function" || item.kind === "default function") {
        const sig = item.signature ? mdEscape(item.signature) : mdEscape(item.name);
        sections.push(`- \`${item.kind}\` \`${sig}\``);
        continue;
      }

      if (item.kind === "re-export") {
        const parts = [];
        parts.push(`\`${item.kind}\``);
        const name = item.name === "*" ? "*" : item.name;
        if (item.as) parts.push(`\`${mdEscape(item.as)} as ${mdEscape(name)}\``);
        else parts.push(`\`${mdEscape(name)}\``);
        if (item.from) parts.push(`from \`${mdEscape(item.from)}\``);
        sections.push(`- ${parts.join(" ")}`);
        continue;
      }

      sections.push(`- \`${item.kind}\` \`${mdEscape(item.name)}\``);
    }
    sections.push("");
  }

  sections.push("---");
  sections.push("");
  sections.push(`Total exports listados: **${totalItems}**`);
  sections.push("");

  await fs.writeFile(outPath, sections.join("\n"), "utf8");
  // eslint-disable-next-line no-console
  console.log(`OK: ${path.relative(root, outPath)}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

