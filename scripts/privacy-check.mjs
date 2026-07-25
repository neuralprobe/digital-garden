import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const forbidden = [
  "/mnt/d/Obsidian",
  "D:\\\\Obsidian",
  "source_vault",
  "source_id",
  "NEVER_EXPORT_THIS_SENTINEL",
  '"visibility":"private"',
  '"visibility": "private"'
];

async function files(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else result.push(path);
  }
  return result;
}

const violations = [];
const dist = fileURLToPath(new URL("../dist", import.meta.url));
for (const path of await files(dist)) {
  const buffer = await readFile(path);
  if (buffer.includes(0)) continue;
  const text = buffer.toString("utf8");
  for (const marker of forbidden) {
    if (text.includes(marker)) violations.push({ path, marker });
  }
}

if (violations.length) {
  console.error("Privacy scan failed:");
  for (const violation of violations) {
    console.error(`- ${violation.path}: ${violation.marker}`);
  }
  process.exit(1);
}

console.log("Privacy scan passed.");
