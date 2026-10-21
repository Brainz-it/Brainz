#!/usr/bin/env bash
# Installe Fruit Pop sur ta machine et le prépare pour Claude Code :
#   1. copie le projet dans un nouveau dossier (par défaut ~/fruit-pop)
#   2. crée le dépôt git et, si possible, le dépôt GitHub privé « fruit-pop »
#   3. installe les dépendances et lance le test automatique
#   4. ouvre Claude Code dans le projet
#
# Usage : bash setup.sh [dossier-de-destination]
# Options (variables d'environnement) :
#   SKIP_GITHUB=1   ne pas créer le dépôt GitHub
#   SKIP_TEST=1     ne pas installer Chromium ni lancer le test
#   SKIP_CLAUDE=1   ne pas ouvrir Claude Code à la fin
#   REPO_NAME=nom   nom du dépôt GitHub (défaut : fruit-pop)

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/project"
DEST="${1:-$HOME/fruit-pop}"
REPO_NAME="${REPO_NAME:-fruit-pop}"

bold()  { printf '\n\033[1;35m▸ %s\033[0m\n' "$*"; }
ok()    { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn()  { printf '  \033[33m!\033[0m %s\n' "$*"; }
fail()  { printf '\n\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
have()  { command -v "$1" >/dev/null 2>&1; }
interactive() { [ -t 0 ] && [ -t 1 ]; }

printf '\033[1;35m🍓 Fruit Pop — installation\033[0m\n'

[ -f "$SRC/index.html" ] || fail "Projet introuvable dans $SRC (lance le script depuis le dépôt cloné)."

# ---------------------------------------------------------------- outils
bold "Vérification des outils"
install_with_brew() {
  if have brew; then
    warn "$1 absent : installation avec Homebrew…"
    brew install "$2"
  else
    fail "$1 est requis. Installe-le (https://brew.sh puis « brew install $2 ») et relance."
  fi
}
have git  || install_with_brew git git
have node || install_with_brew Node.js node
have npm  || fail "npm est requis (il est fourni avec Node.js)."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || fail "Node.js 18 ou plus est requis (version actuelle : $(node -v))."
ok "git $(git --version | awk '{print $3}'), Node.js $(node -v)"

if [ "${SKIP_GITHUB:-0}" != 1 ] && ! have gh; then
  if have brew; then
    warn "CLI GitHub (gh) absent : installation avec Homebrew…"
    brew install gh
  else
    warn "CLI GitHub (gh) absent : le dépôt GitHub ne sera pas créé automatiquement."
  fi
fi

# ---------------------------------------------------------------- copie
bold "Création du projet dans $DEST"
if [ -e "$DEST" ] && [ -n "$(ls -A "$DEST" 2>/dev/null)" ]; then
  fail "$DEST existe déjà et n'est pas vide. Choisis un autre dossier : bash setup.sh ~/autre-dossier"
fi
mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"
cd "$DEST"
ok "Fichiers copiés"

# ---------------------------------------------------------------- git
bold "Dépôt git local"
git init -q -b main 2>/dev/null || { git init -q && git checkout -q -b main; }
git add -A
if git config user.email >/dev/null; then
  git commit -q -m "Fruit Pop : version initiale"
else
  git -c user.name="Fruit Pop" -c user.email="fruit-pop@localhost" commit -q -m "Fruit Pop : version initiale"
  warn "Ton identité git n'est pas configurée : commit signé « Fruit Pop »."
fi
ok "Premier commit créé"

# ---------------------------------------------------------------- GitHub
if [ "${SKIP_GITHUB:-0}" != 1 ] && have gh; then
  bold "Dépôt GitHub privé « $REPO_NAME »"
  if ! gh auth status >/dev/null 2>&1; then
    if interactive; then
      warn "Connexion à GitHub nécessaire."
      gh auth login
    else
      warn "Non connecté à GitHub (gh auth login) : étape ignorée."
    fi
  fi
  if gh auth status >/dev/null 2>&1; then
    OWNER="$(gh api user --jq .login)"
    if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
      warn "Le dépôt $OWNER/$REPO_NAME existe déjà : je le relie et tente de pousser."
      git remote add origin "https://github.com/$OWNER/$REPO_NAME.git"
      if git push -u origin main; then ok "Code poussé sur $OWNER/$REPO_NAME"
      else warn "Push refusé (le dépôt n'est sans doute pas vide). Le projet local reste utilisable."; fi
    else
      gh repo create "$REPO_NAME" --private --source=. --remote=origin --push \
        --description "Bubble shooter kawaii pour YouTube Playables"
      ok "https://github.com/$OWNER/$REPO_NAME"
    fi
  fi
fi

# ---------------------------------------------------------------- test
if [ "${SKIP_TEST:-0}" != 1 ]; then
  bold "Installation des dépendances et test automatique"
  npm install --no-fund --no-audit
  npx playwright install chromium
  if npm test; then ok "Le jeu fonctionne (captures dans tools/out/)"
  else warn "Le test a échoué : demande à Claude Code de regarder « npm test »."; fi
fi

# ---------------------------------------------------------------- Claude Code
if [ "${SKIP_CLAUDE:-0}" != 1 ]; then
  bold "Claude Code"
  if ! have claude; then
    if interactive; then
      read -r -p "  Claude Code n'est pas installé. L'installer maintenant ? [O/n] " ans
      if [[ ! "$ans" =~ ^[nN] ]]; then
        curl -fsSL https://claude.ai/install.sh | bash
        export PATH="$HOME/.local/bin:$PATH"
      fi
    else
      warn "Claude Code absent : installe-le avec « curl -fsSL https://claude.ai/install.sh | bash »."
    fi
  fi
fi

printf '\n\033[1;32m🎉 Fruit Pop est prêt dans %s\033[0m\n' "$DEST"
echo "   Jouer :  cd \"$DEST\" && npm start   puis http://localhost:8080"
echo "   ZIP Playables :  npm run zip"

if [ "${SKIP_CLAUDE:-0}" != 1 ] && have claude && interactive; then
  echo
  echo "Ouverture de Claude Code…"
  exec claude "Lis CLAUDE.md et README.md, puis résume-moi en quelques lignes l'état du projet Fruit Pop et ce qu'on peut faire ensuite."
else
  echo "   Claude Code :  cd \"$DEST\" && claude"
fi
