// Completeness check for the Bahasa Malaysia translation.
//   node scripts/check-i18n.mjs          -> report strings with no Malay text, and Malay entries nothing uses
//   node scripts/check-i18n.mjs --strict -> exit 1 if anything is missing (for CI)
// It finds every translatable string the code uses - t("..."), tk("...") and the
// templates in i18n/server-messages.ts - and compares them with i18n/ms.ts.
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const ts = require("typescript");
const SRC = path.join(root, "src");
const strict = process.argv.includes("--strict");

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

const used = new Map(); // key -> first file:line
const add = (key, file, line) => { if (!used.has(key)) used.set(key, `${path.relative(SRC, file)}:${line}`); };

for (const file of walk(SRC)) {
  if (file.includes("i18n/ms/") || file.includes("pages/platform")) continue;
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const line = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
  const strArg = (n) => (n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null);
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sf);
      if (callee === "t" || callee === "tk" || callee === "tEnum") { const k = strArg(node.arguments[0]); if (k) add(k, file, line(node)); }
      if (callee === "on" && file.endsWith("server-messages.ts")) { const k = strArg(node.arguments[1]); if (k) add(k, file, line(node)); }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

// load the dictionary (an object literal in ms.ts)
const dict = new Map();
const serverKeys = new Set(); // ms/server.ts entries are matched dynamically (backend messages, enums), so "unused" doesn't apply to them
const walkMs = (n) => {
  if (ts.isPropertyAssignment(n) && (ts.isStringLiteral(n.name) || ts.isNoSubstitutionTemplateLiteral(n.name)) && (ts.isStringLiteral(n.initializer) || ts.isNoSubstitutionTemplateLiteral(n.initializer))) { dict.set(n.name.text, n.initializer.text); if (currentFile === "server.ts") serverKeys.add(n.name.text); }
  ts.forEachChild(n, walkMs);
};
let currentFile = "";
for (const f of fs.readdirSync(path.join(SRC, "i18n/ms"))) {
  if (f === "index.ts") continue;
  currentFile = f;
  walkMs(ts.createSourceFile(f, fs.readFileSync(path.join(SRC, "i18n/ms", f), "utf8"), ts.ScriptTarget.Latest, true));
}

const untranslatable = (k) => !/[A-Za-z]{2,}/.test(k);
const missing = [...used].filter(([k]) => !dict.has(k) && !untranslatable(k));
// enum-style keys (DRAFT, PENDING_APPROVAL...) are looked up dynamically by tEnum(), so they never appear literally
const unused = [...dict.keys()].filter((k) => !used.has(k) && !serverKeys.has(k) && !/^[A-Z][A-Z0-9_]*$/.test(k));
// placeholder parity: {x} in English must survive in Malay
const broken = [...dict].filter(([k, v]) => { const a = (k.match(/\{\w+\}/g) ?? []).sort().join(); const b = (v.match(/\{\w+\}/g) ?? []).sort().join(); return a !== b; });

console.log(`strings in use: ${used.size}   translated: ${dict.size}`);
if (missing.length) { console.log(`\nMISSING Malay (${missing.length}):`); for (const [k, where] of missing) console.log(`  ${JSON.stringify(k)}   ${where}`); }
if (broken.length) { console.log(`\nPLACEHOLDER MISMATCH (${broken.length}):`); for (const [k, v] of broken) console.log(`  ${JSON.stringify(k)}\n    -> ${JSON.stringify(v)}`); }
if (unused.length) console.log(`\nunused Malay entries (${unused.length}) - safe to delete:\n  ${unused.slice(0, 40).map((k) => JSON.stringify(k)).join("\n  ")}${unused.length > 40 ? "\n  ..." : ""}`);
if (!missing.length && !broken.length) console.log("\nOK - every string has a Malay translation.");
if (strict && (missing.length || broken.length)) process.exit(1);
