import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

type ViteManifest = Record<
  string,
  {
    file: string;
    css?: string[];
    assets?: string[];
    imports?: string[];
    dynamicImports?: string[];
  }
>;

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const MANIFEST_PATH = path.join(DIST_DIR, '.vite', 'manifest.json');

const DEFAULT_LIMIT_BYTES = 500 * 1024;
const PIXI_LIMIT_BYTES = 1200 * 1024;

function formatBytes(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} kB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function isJavaScriptFile(filePath: string): boolean {
  return filePath.endsWith('.js');
}

function isPixiChunk(filePath: string): boolean {
  const name = path.basename(filePath);
  return name.includes('PixiViewport-') || name.includes('pixi-');
}

async function main(): Promise<void> {
  let raw: string;
  try {
    raw = await readFile(MANIFEST_PATH, 'utf8');
  } catch (err) {
    console.error(`manifest.json not found: ${MANIFEST_PATH}`);
    console.error('Run pnpm build first (vite build with manifest: true).');
    process.exit(1);
  }

  const manifest = JSON.parse(raw) as ViteManifest;

  const files = new Set<string>();

  const seenKeys = new Set<string>();
  const stack = Object.keys(manifest);

  while (stack.length > 0) {
    const key = stack.pop();
    if (!key) continue;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const entry = manifest[key];
    if (!entry) continue;

    const dependsOnKeys = [...(entry.imports ?? []), ...(entry.dynamicImports ?? [])];
    for (const depKey of dependsOnKeys) stack.push(depKey);

    if (entry.file) files.add(entry.file);
  }

  const jsFiles = [...files].filter(isJavaScriptFile);
  if (jsFiles.length === 0) {
    console.error('No JS files found in manifest.');
    process.exit(1);
  }

  const violations: Array<{ file: string; size: number; limit: number }> = [];

  for (const rel of jsFiles) {
    const abs = path.join(DIST_DIR, rel);
    const s = await stat(abs);
    const limit = isPixiChunk(rel) ? PIXI_LIMIT_BYTES : DEFAULT_LIMIT_BYTES;

    if (s.size > limit) {
      violations.push({ file: rel, size: s.size, limit });
    }
  }

  if (violations.length > 0) {
    console.error('Chunk size check failed.');
    for (const v of violations.sort((a, b) => b.size - a.size)) {
      console.error(
        `- ${v.file}: ${formatBytes(v.size)} (limit ${formatBytes(v.limit)})`
      );
    }
    process.exit(1);
  }

  console.log(
    `Chunk size check OK (default <= ${formatBytes(DEFAULT_LIMIT_BYTES)}, pixi <= ${formatBytes(PIXI_LIMIT_BYTES)})`
  );
}

await main();
