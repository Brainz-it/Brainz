# 🍓 Fruit Pop — installation en une commande

Ce dossier contient le jeu **Fruit Pop** (bubble shooter kawaii pour YouTube Playables) et un script qui l'installe sur ta machine, prêt pour Claude Code.

## Lancer

```bash
gh repo clone Brainz-it/Brainz /tmp/brainz -- -b claude/fruit-pop-setup
bash /tmp/brainz/fruit-pop-setup/setup.sh
```

Le script :
1. vérifie les outils (git, Node.js 18+, CLI GitHub) et installe ceux qui manquent avec Homebrew ;
2. copie le jeu dans `~/fruit-pop` (ou le dossier passé en argument) ;
3. crée le dépôt git, puis le dépôt GitHub **privé** `fruit-pop` sur ton compte et y pousse le code ;
4. installe les dépendances, Chromium, et lance le test automatique (`npm test`) ;
5. propose d'installer Claude Code s'il manque, puis l'ouvre dans le projet.

Options : `SKIP_GITHUB=1`, `SKIP_TEST=1`, `SKIP_CLAUDE=1`, `REPO_NAME=autre-nom`. Exemple :

```bash
SKIP_TEST=1 bash /tmp/brainz/fruit-pop-setup/setup.sh ~/jeux/fruit-pop
```

Le contenu du jeu est dans `project/` ; une fois installé, `project/CLAUDE.md` guide Claude Code.
