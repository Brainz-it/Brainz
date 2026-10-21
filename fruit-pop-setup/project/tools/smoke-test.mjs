// Test de fumée : ouvre le jeu dans Chromium (headless), parcourt les écrans
// principaux et échoue s'il y a la moindre erreur JavaScript.
// Usage : npm test   (captures d'écran dans tools/out/)
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tools', 'out');
fs.mkdirSync(out, { recursive: true });
const url = pathToFileURL(path.join(root, 'index.html')).href;

const browser = await chromium.launch();
const errors = [];
const shot = (pg, name) => pg.screenshot({ path: path.join(out, name + '.png') });

const viewports = [
  { name: 'phone', width: 390, height: 760 },
  { name: 'desktop', width: 900, height: 700 },
];

for (const vp of viewports) {
  const pg = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
  pg.on('pageerror', e => errors.push(`[${vp.name}] ${e}`));
  pg.on('console', m => { if (m.type() === 'error') errors.push(`[${vp.name}] console: ${m.text()}`); });
  await pg.goto(url);
  await pg.waitForTimeout(600);
  await shot(pg, `${vp.name}-map`);

  // Partie normale : quelques tirs simulés.
  await pg.evaluate(() => { save.seen = { w1: 1 }; startLevel(0); });
  for (let i = 0; i < 6; i++) {
    await pg.evaluate(k => { aimAngle = -Math.PI / 2 + (k - 3) * 0.25; shoot(); }, i);
    await pg.waitForTimeout(450);
  }
  await shot(pg, `${vp.name}-game`);

  // Niveau de boss.
  await pg.evaluate(() => { save.seen.b1pre = 1; startLevel(7); });
  await pg.waitForTimeout(500);
  await shot(pg, `${vp.name}-boss`);

  // Progression simulée : boss 1 battu -> Pépin marche puis évolue.
  await pg.evaluate(() => {
    save.unlocked = 9; for (let i = 0; i < 8; i++) save.stars[i] = 2;
    save.pos = 6; save.stageSeen = 0; toMenu();
  });
  await pg.waitForTimeout(3000);
  const evolveShown = await pg.evaluate(() => !document.getElementById('ovEvolve').hidden);
  if (!evolveShown) errors.push(`[${vp.name}] l'écran d'évolution ne s'est pas affiché`);
  await shot(pg, `${vp.name}-evolve`);
  await pg.close();
}

await browser.close();
if (errors.length) {
  console.error('ÉCHEC :\n' + errors.join('\n'));
  process.exit(1);
}
console.log('OK — aucune erreur. Captures dans tools/out/');
