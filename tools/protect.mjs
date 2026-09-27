import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import JavaScriptObfuscator from "javascript-obfuscator";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "src", "app.js");
const out = join(root, "docs", "app.min.js");
const banner =
  "/*! Il fait chaud © 2026 Gaspard Bébié-Valérian. Tous droits réservés. */\n";

const plain = process.argv.includes("--plain");
const code = await readFile(source, "utf8");
await mkdir(dirname(out), { recursive: true });

if (plain) {
  await writeFile(out, banner + code);
  console.log("sync", out);
  process.exit(0);
}

const result = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  target: "browser",
  sourceMap: false,
});

await writeFile(out, banner + result.getObfuscatedCode());
console.log("protect", out, `${result.getObfuscatedCode().length} octets`);
