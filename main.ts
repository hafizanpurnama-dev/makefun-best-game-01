// main.ts — Best Game 01: copies game/ and screenshots/ beside this program to /output
// and writes /output/dossier.json (the summary the scorer reads) via the vendored make.fun
// library.  Node 22 standard library only; no flags, no build, no install.
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container use the MAKEFUN_OUTPUT_DIR env var for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// ── resolve paths ──────────────────────────────────────────────────────────
const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// ── copy game/ → /output/game/ ─────────────────────────────────────────────
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// ── copy screenshots/ → /output/screenshots/ ───────────────────────────────
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// ── build and write dossier.json ───────────────────────────────────────────
// The scorer's caps (reference/gate.json):
//   text_max_bytes  — shapes the dossier's text byte budget
//   screenshots.max / max_bytes  — refuse oversized or too many screenshots
//   game_max_*  — refuse entries past the grader's /output cap
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);