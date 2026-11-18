// Entrypoint for the best-game-01 grader: stage the playable game and the
// screenshots beside this file into the output directory, then summarise the
// entry as dossier.json with the vendored make.fun library. Runs on Node 22+
// with only the standard library; never starts a server, never touches the
// network. The grader mounts the repo read-only and execs `node main.ts`
// with MAKEFUN_OUTPUT_DIR set (or the default /output), expecting exit 0.
//
// Local smoke test outside the container:
//   mkdir -p /tmp/out && MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Directory this entrypoint lives in, and the box the judge reads.
const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Stage the game files (static site; game/index.html is the playable entry).
// Fail fast with a readable message when the game dir is incomplete instead
// of letting buildDossier mask the real cause.
const gameDir = join(here, 'game');
if (!existsSync(join(gameDir, 'index.html'))) {
  console.error('missing game/index.html — nothing to hand in');
  process.exit(1);
}
mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });

// Stage the screenshots (3-4 PNG/JPG; the first by filename is the cover).
// The judge reads them from /output/screenshots/, so the folder must exist
// even when a build ships none yet.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier enforces the scorer's own limits (reference/gate.json), so a
// locally passing run refuses the same entries the scorer would refuse.
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

const summary = [
  `game files: ${readdirSync(join(out, 'game'), { recursive: true }).length}`,
  `screenshots: ${readdirSync(join(out, 'screenshots'), { recursive: true }).length}`,
  `dossier: ${existsSync(join(out, 'dossier.json')) ? 'written' : 'MISSING'}`,
].join(' · ');
console.log(`entry staged at ${out} — ${summary}`);