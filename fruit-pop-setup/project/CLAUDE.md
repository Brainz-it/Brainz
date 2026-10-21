# CLAUDE.md — Fruit Pop

Bubble shooter kawaii destiné à **YouTube Playables**. Le propriétaire parle français : réponses, textes du jeu et commentaires de code en français.

## Contraintes non négociables

- **Zéro asset et zéro dépendance à l'exécution.** Tout graphisme est dessiné en Canvas 2D dans `src/game.js`, tout son est synthétisé en WebAudio. Ne pas ajouter d'images, de fichiers audio, de bibliothèques ni d'étape de build.
- **Aucun appel réseau pendant le jeu** (exigence Playables). Seule exception actuelle : les polices Google Fonts, à embarquer avant soumission.
- **Contrat de pause** : `GameApp.pause()` doit tout arrêter (boucle `requestAnimationFrame`, physique, minuteurs, entrées). Toute nouvelle animation ou tout nouveau `setTimeout` doit respecter l'état `paused`.
- **Sauvegarde** uniquement via l'objet `Storage` (il sera remplacé par `ytgame.game.saveData`). Ne jamais appeler `localStorage` ailleurs.
- **Mobile d'abord** : tester à 390 px de large. Aucun défilement horizontal.
- Thème unique kawaii pastel : couleurs dans les variables CSS de `:root` (`src/style.css`).

## Organisation de `src/game.js`

Dans l'ordre du fichier :
1. **Données** : `TYPES` (fruits), `WORLDS`, `LEVELS` (grilles en texte), `BOSSES`, `EVENTS`, `SPECIALS`, `DIALOGS`.
2. **Sauvegarde et audio** : `Storage`, `save`, `sfx`.
3. **Dessin vectoriel** : `drawFace`, `BODIES` (un dessin par fruit), `drawRot`, `drawPrism`, `drawWood`, personnages (`drawPepin` avec ses 4 stades `PEPIN_STAGES`, `drawSlug`, `drawCrow`, `drawBaron`). Les sprites sont pré-rendus par `makeSprite` / `makeMisc` dans `resize()`.
4. **Grille hexagonale** : `cellPos`, `neighbors`, `parseLayout`, `matchGroup`, `dropFloaters`.
5. **Moteur** : `popCells` (moteur d'explosion commun : étoiles, voisinage glace/pourri/cage, jauge, dégâts au boss), `bulletImpact` (tirs normaux et spéciaux), `postTurn` (descente, attaques de boss, événements), `tickEvents`, `bossAttack`.
6. **Boucle et rendu** : `tick`, `update`, `render`.
7. **Interface** : HUD, jauge, entrées, carte du verger (`mapLayout`, `drawMap`, `buildMapNodes`, `walkHero`, `maybeEvolve`, `renderHome`), dialogues.

### Format des grilles (`LEVELS[].layout`)
Rangées de 9 et 8 cases en alternance. `.` vide · `o` fruit aléatoire · `W` caisse · `i` gelé · `x` pourri · `c` cage · `G` doré · `*` étoile · `+` cœur · `p` prisme.

### Pièges connus
- La taille des fruits `R` est calculée dans `resize()` pour que 11 rangées tiennent au-dessus de la ligne de danger ; si la grille est plus étroite que le canvas, des murs visibles sont dessinés (`boardL` / `boardR`). Les rebonds utilisent ces mêmes bornes.
- Les éléments masqués utilisent l'attribut `hidden` ; la règle `[hidden]{display:none!important}` en tête de `style.css` est indispensable car `.overlay` impose `display:flex`.
- `window.claude?.hot` en fin de fichier sert à l'aperçu sur claude.ai ; c'est sans effet ailleurs.

## Vérifier un changement

```bash
npm install   # une fois
npm test      # Playwright : parcourt carte, partie, boss, évolution ; échoue sur toute erreur JS
```
Regarder les captures dans `tools/out/` pour tout changement visuel. `node --check src/game.js` pour une vérification rapide de syntaxe.

## Pistes en cours
- Intégration du SDK `ytgame` (voir README).
- Équilibrage : `drop` par niveau, `hp` / `every` des boss, seuils d'étoiles dans `starsFor()`.
- Embarquer les polices dans `src/fonts/`.
