# Site de mariage paramétrable

Reproduction fidèle du site raniaetzidanewedding.com (intro rideau vidéo, prénoms animés, défilement page par page, compte à rebours, modales RSVP / itinéraire / liste de mariage / coordonnées bancaires), dont **tout le contenu** est piloté par `content/site.json`. Ce dépôt ne contient que le site : on modifie `content/site.json` et les photos directement dans Git, et GitHub Pages redéploie automatiquement à chaque push.

```
.
├── index.html            # page unique (structure identique à l'original)
├── assets/style.css      # feuille de style de l'original (couleurs/polices surchargées par site.json)
├── assets/site.js        # injection du contenu + intro, défilement, modales
├── assets/art/           # illustrations vectorielles (lanternes, rideaux, tenues, ornements)
├── assets/images/        # bougies, riad, lanterne, icônes, image du rideau fermé
├── assets/media/         # vidéo d'ouverture du rideau
├── content/site.json     # ⚙️ tous les textes, dates, couleurs, liens, comptes bancaires
├── content/photos/       # 📷 photo du couple, visuels des boutiques
└── .github/workflows/    # déploiement GitHub Pages
```

## Pages du site

Rideau « Touchez pour continuer » → prénoms centrés → invitation · Date, ville, compte à rebours, bouton RSVP (modale avec formulaire) · About the Venue (croquis + Directions vers Waze / Google Maps) · Attire details (caftan, robe, costume) · Schedule · Wedding list (boutiques + coordonnées bancaires avec bouton copier) · pied de page (lanterne, monogramme, date).

Chaque section a un champ `enabled` dans `site.json` ; l'intro se désactive avec `intro.enabled: false`. L'URL `?preview=1` saute l'intro.

## Mise en ligne (une seule fois)

1. Dans le dépôt GitHub : **Settings → Pages → Source : GitHub Actions**.
2. Le workflow `.github/workflows/deploy-wedding.yml` publie la racine du dépôt à chaque push sur la branche du site (`main` ou la branche listée dans le workflow). Adaptez la liste `branches` si vous renommez la branche.
3. Le site est disponible sur `https://<owner>.github.io/<repo>/`. Pour un nom de domaine personnalisé, ajoutez un fichier `CNAME` à la racine contenant le domaine et configurez-le dans Settings → Pages.

Tout hébergeur statique (Netlify, Vercel, OVH…) fonctionne aussi : servez simplement la racine du dépôt.

## Modifier le contenu

Éditez `content/site.json` (textes, dates, couleurs, liens), déposez vos images dans `content/photos/` (par exemple la photo du couple, référencée par `hero.photo`), commitez, poussez. Le site est mis à jour en une à deux minutes. L'édition peut se faire directement sur GitHub (icône crayon sur le fichier).

## Paramètres principaux (`content/site.json`)

| Clé | Rôle |
|---|---|
| `couple.bride`, `couple.groom`, `couple.conjunction`, `couple.monogram` | Prénoms, mot entre les prénoms, monogramme du pied de page |
| `hero.eyebrow`, `hero.photo` | Phrase d'intro et photo du couple (affichée en arche) |
| `event.date` | Date ISO du compte à rebours (ex. `2026-09-26T17:30:00+01:00`) |
| `event.dateLabel`, `event.city`, `event.shortDate` | Date affichée, ville, date courte du pied de page |
| `theme.color*`, `theme.font*` | Palette (rouge, gris, crèmes) et polices Google Fonts |
| `intro.enabled`, `intro.prompt` | Rideau d'ouverture et texte du bouton |
| `rsvp.sendVia` | `googlesheet` (enregistrement dans Google Sheets, voir ci-dessous), `formspree`, `whatsapp` (message pré-rempli) ou `mailto` ; libellés et messages d'erreur dans `rsvp.labels` |
| `venue.latitude`, `venue.longitude` | Coordonnées du lieu pour les liens Waze et Google Maps (ou `wazeUrl` / `googleMapsUrl` explicites) |
| `attire.items[]` | Illustrations des tenues avec position (`left`, `width` en %) |
| `schedule.items[]` | Heure et titre de chaque étape |
| `weddingList.buttons[]`, `shops[]`, `banks` | Boutons Morocco / Abroad, boutiques (nom, lien, image), RIB et IBAN |

## Variantes de design

Onze versions du même contenu, sélectionnées par `?v=N` dans l'URL (V0 = original). Chaque thème est un dossier `assets/themes/vN/` avec `theme.css` (palette, polices, mise en page), `theme.js` (animation d'entrée, remplacement des illustrations, structure) et `art/` (illustrations SVG). La page `versions.html` les liste toutes. Pour fixer une variante par défaut, mettez `theme.variant` à N dans `site.json`.

### V9 · Faire-part

Structure inspirée des faire-part de mariage en ligne (carte d'ouverture, enveloppe et photo, cartes bordeaux, mini-calendrier, galerie, dress code, programme illustré, livre d'or, cagnotte, musique). Ses textes propres sont dans le bloc `invitation` de `site.json` (familles, cérémonie, réception, dress code, livre d'or, cagnotte, musique). La galerie vient de `content/gallery.json`. Le livre d'or lit et écrit dans l'onglet « Livre d'or » de la feuille Google (voir ci-dessous) ; mettez « non » dans la colonne « Affiché » pour masquer un vœu.

### V10 · Villa

Faire-part éditorial en français : enveloppe brodée à ruban blanc, photo plein écran avec carte lieu/date, menu plein écran et barre de navigation, compte à rebours, sections numérotées (lieu avec cérémonie / réception / accès, programme illustré, dress code, liste de mariage avec IBAN, RSVP par invité avec régime alimentaire, FAQ), musique. Ses textes sont dans le bloc `villa` de `site.json`. Le sceau de l'enveloppe se choisit avec `?seal=bow` (ruban blanc), `?seal=wax` (cire bordeaux) ou `?seal=gold` (cire dorée et ruban), ou par défaut avec `villa.seal`. Les vidéos d'ouverture (`assets/themes/v10/media/envelope-*.mp4`) sont générées à partir de l'animation CSS ; sans vidéo, l'animation CSS joue directement. Les sceaux, coins brodés et dentelle sont des images générées par IA fournies par les mariés. Les réponses RSVP arrivent dans la feuille Google (nom de famille et invités, présences, régimes, enfants, message).

## Enregistrer les réponses RSVP et le livre d'or dans Google Sheets

1. Créez une feuille Google Sheets vide, puis Extensions → Apps Script.
2. Collez le contenu de `google-sheet/Code.gs`, enregistrez.
3. Déployer → Nouveau déploiement → Application Web, exécuter en tant que « Moi », accès « Tout le monde ». Autorisez l'accès.
4. Copiez l'URL `…/exec` dans `content/site.json` → `rsvp.googleSheetEndpoint`, avec `rsvp.sendVia` à `googlesheet`.

Chaque réponse ajoute une ligne : date, nom, présence, accompagné(e), nom du +1, message.

## Tester en local

```bash
python3 -m http.server 8080
# puis http://localhost:8080
```
