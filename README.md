# Site de mariage paramétrable

Ce dépôt ne contient que le site : un site statique (HTML/CSS/JS, sans build) dont **tout le contenu** est piloté par deux fichiers JSON et un dossier de photos. La page `/admin/` sert de « petit backend côté Git » : elle lit et écrit ces fichiers directement dans le dépôt GitHub, chaque enregistrement est un commit, et GitHub Pages redéploie le site automatiquement.

```
.
├── index.html            # page unique du site
├── assets/style.css      # styles (couleurs/polices surchargées par site.json)
├── assets/site.js        # rendu des sections à partir du JSON
├── content/site.json     # ⚙️ tous les textes, dates, couleurs, sections
├── content/gallery.json  # 🖼️ ordre et légendes des photos de la galerie
├── content/photos/       # 📷 les photos (couple, galerie)
├── content/illustrations/# ✏️ illustrations au trait (lanternes, riad, tenues…)
├── admin/                # backend Git : édition du contenu et des photos
└── .github/workflows/    # déploiement GitHub Pages
```

## Sections du site

Dans l'ordre de la page : en-tête (« You are invited to the wedding of », prénoms, photo en arche, bougies, guirlande de lanternes) · Date et ville · Compte à rebours encadré · Bouton RSVP · About the Venue (illustration + bouton Directions) · Attire details (illustrations femme / homme) · Schedule · Galerie (désactivée par défaut) · Wedding list (boutons) · Formulaire RSVP (si `rsvp.mode` = `form`) · Pied de page (lanterne, monogramme, date courte).

Chaque section a un champ `enabled` dans `site.json` : passez-le à `false` pour la masquer. Les illustrations au trait sont des SVG dans `content/illustrations/`, remplaçables par les vôtres.

## Mise en ligne (une seule fois)

1. Dans le dépôt GitHub : **Settings → Pages → Source : GitHub Actions**.
2. Le workflow `.github/workflows/deploy-wedding.yml` publie la racine du dépôt à chaque push sur la branche du site (`main` ou la branche listée dans le workflow). Adaptez la liste `branches` si vous renommez la branche.
3. Le site est disponible sur `https://<owner>.github.io/<repo>/`. Pour un nom de domaine personnalisé, ajoutez un fichier `CNAME` à la racine contenant le domaine et configurez-le dans Settings → Pages.

Tout hébergeur statique (Netlify, Vercel, OVH…) fonctionne aussi : servez simplement la racine du dépôt.

## Modifier le contenu

### Option A — Page d'administration (recommandé)

1. Ouvrez `https://<votre-site>/admin/`.
2. Renseignez le propriétaire et le nom du dépôt, la branche du site, laissez le dossier vide (racine), et un **token GitHub fine-grained** limité à ce dépôt avec la permission *Contents : Read and write* (GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens).
3. Onglet **Contenu** : formulaire généré depuis `site.json` (textes, date, couleurs, programme, lieux, RSVP…). Les listes (programme, lieux, infos) peuvent être réordonnées, ajoutées, supprimées.
4. Onglet **Photos** : envoi de photos (redimensionnées en JPEG 1600 px max côté navigateur), ajout à la galerie, réordonnancement, légendes, suppression du dépôt.
5. **Enregistrer (commit)** : écrit `site.json` et `gallery.json` dans le dépôt. Le site est mis à jour en une à deux minutes.

Le token ne quitte jamais le navigateur (il est envoyé uniquement à `api.github.com`) ; il peut être mémorisé sur l'appareil ou seulement pour la session.

### Option B — Directement dans Git

Éditez `content/site.json` / `content/gallery.json`, déposez vos images dans `content/photos/`, commitez, poussez. C'est tout.

## Paramètres principaux (`content/site.json`)

| Clé | Rôle |
|---|---|
| `couple.bride`, `couple.groom`, `couple.conjunction`, `couple.monogram` | Prénoms, mot entre les prénoms, monogramme du pied de page |
| `hero.kicker`, `hero.photo`, `hero.*Decoration`, `hero.divider` | Phrase d'intro, photo du couple (affichée en arche), illustrations |
| `event.date` | Date ISO utilisée par le compte à rebours (ex. `2026-09-26T17:30:00+01:00`) |
| `event.dateLabel`, `event.city`, `event.shortDate` | Date affichée, ville, date courte du pied de page |
| `theme.color*`, `theme.font*`, `theme.paperTexture`, `theme.watercolorBlotches` | Couleurs, polices Google Fonts, grain papier et taches aquarelle du fond |
| `rsvp.mode` | `form` : formulaire intégré en bas de page ; `link` : le bouton RSVP ouvre `rsvp.url` (Google Form, etc.) |
| `rsvp.form.sendVia` | `mailto`, `whatsapp` (message pré-rempli) ou `formspree` (POST) |
| `venue` | Titre, illustration, texte, bouton Directions vers `mapsUrl` |
| `attire.items[]` | Illustration et libellé pour chaque tenue |
| `schedule.items[]` | Heure et titre de chaque étape, `closingText` en fin de liste |
| `weddingList.links[]` | Boutons (libellé + lien) de la liste de mariage |
| `gallery.enabled` | Affiche une galerie (photos de `content/gallery.json`) |

## Tester en local

```bash
python3 -m http.server 8080
# puis http://localhost:8080  et  http://localhost:8080/admin/
```
