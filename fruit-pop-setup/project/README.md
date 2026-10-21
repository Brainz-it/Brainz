# 🍓 Fruit Pop — Le Verger Enchanté

Bubble shooter kawaii pour **YouTube Playables**. Pépin la cerise remonte le Verger Enchanté pour libérer ses amis du Baron Moisi : 3 mondes, 24 niveaux, 3 boss.

Tout est dessiné en code (Canvas 2D) : aucune image, aucun son à télécharger, aucune dépendance. Le build complet pèse environ 100 Ko.

## Lancer le jeu

```bash
npm start          # serveur local sur http://localhost:8080
```

On peut aussi ouvrir `index.html` directement dans un navigateur.

## Tester

```bash
npm install        # installe Playwright (une seule fois)
npm test           # ouvre le jeu dans Chromium headless, joue quelques tirs, vérifie l'absence d'erreur
```

Les captures d'écran du test sont écrites dans `tools/out/`.

## Construire le ZIP pour YouTube Playables

```bash
npm run zip        # crée dist/fruit-pop.zip (index.html + src/)
```

## Contenu du jeu

| Élément | Détail |
|---|---|
| **Mondes** | 🌳 Le Potager · ❄️ Les Cimes Givrées · 🍂 Les Racines Pourries |
| **Boss** | Limace Royale (niv. 8), Corbeau Givré (niv. 16), Baron Moisi en 3 phases (niv. 24) |
| **Obstacles** | Caisse en bois, fruit gelé (2 coups), fruit pourri (à purifier), ami en cage |
| **Super fruits** | Doré (pièces), étoile (explose sa couleur), cœur (+3 tirs), prisme (joker) |
| **Tirs spéciaux** | Bombe cerise 💣, Citron éclair ⚡, Ananas perforant 🍍, Tir arc-en-ciel 🌈 |
| **Événements** | Vent, averse, nuit, guêpe voleuse / soleil, toucan, rosée, panier surprise |
| **Carte** | Chemin animé : Pépin marche de niveau en niveau |
| **Évolution** | Pépin grandit après chaque boss : Bourgeon → Explorateur → Chevalier → Légendaire |
| **Progression** | 1 à 3 étoiles par niveau, pièces, boosters de départ |

## Structure

```
index.html            Écrans et overlays (HTML)
src/style.css         Thème kawaii pastel, HUD, carte
src/game.js           Tout le jeu (données, dessin, moteur, carte, histoire)
tools/smoke-test.mjs  Test automatique Playwright
tools/make-zip.mjs    Build ZIP pour le portail Playables
```

## Intégration YouTube Playables (à faire une fois l'accès obtenu)

Le jeu est déjà préparé pour le SDK `ytgame` ; trois points de branchement :

1. **Pause / reprise** : `window.GameApp.pause` et `window.GameApp.resume` arrêtent et relancent tout (rendu, physique, minuteurs, entrées).
   ```js
   ytgame.system.onPause(GameApp.pause);
   ytgame.system.onResume(GameApp.resume);
   ```
2. **Sauvegarde** : l'objet `Storage` dans `src/game.js` (méthodes `load` et `save`) utilise `localStorage` ; le remplacer par `ytgame.game.loadData()` / `ytgame.game.saveData()`.
3. **Chargement** : appeler `ytgame.game.firstFrameReady()` et `ytgame.game.gameReady()` au démarrage.

Avant soumission, vérifier aussi :
- **Polices** : Fredoka et Nunito viennent de Google Fonts. Si le portail interdit les requêtes externes, les embarquer dans `src/fonts/` ou se rabattre sur les polices système.
- **Son** : respecter `ytgame.system.isAudioEnabled()` et `onAudioEnabledChange`.
