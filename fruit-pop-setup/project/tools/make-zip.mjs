// Crée dist/fruit-pop.zip : le build à téléverser sur le portail YouTube Playables
// (index.html à la racine du ZIP + dossier src/).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
fs.mkdirSync(dist, { recursive: true });
const zip = path.join(dist, 'fruit-pop.zip');
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-r', '-X', zip, 'index.html', 'src'], { cwd: root, stdio: 'inherit' });
const kb = (fs.statSync(zip).size / 1024).toFixed(1);
console.log(`dist/fruit-pop.zip — ${kb} Ko`);
