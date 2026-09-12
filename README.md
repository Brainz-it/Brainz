# Site de mariage paramétrable

Reproduction fidèle du site raniaetzidanewedding.com (intro rideau vidéo, prénoms animés, défilement page par page, compte à rebours, modales RSVP / itinéraire / liste de mariage / coordonnées bancaires), dont **tout le contenu** est piloté par `content/site.json`. Ce dépôt ne contient que le site. La page `/admin/` sert de « petit backend côté Git » : elle lit et écrit `site.json` et les photos directement dans le dépôt GitHub, chaque enregistrement est un commit, et GitHub Pages redéploie automatiquement.

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
├── admin/                # backend Git : édition du contenu et des photos
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
| `hero.eyebrow`, `hero.photo` | Phrase d'intro et photo du couple (affichée en arche) |
| `event.date` | Date ISO du compte à rebours (ex. `2026-09-26T17:30:00+01:00`) |
| `event.dateLabel`, `event.city`, `event.shortDate` | Date affichée, ville, date courte du pied de page |
| `theme.color*`, `theme.font*` | Palette (rouge, gris, crèmes) et polices Google Fonts |
| `intro.enabled`, `intro.prompt` | Rideau d'ouverture et texte du bouton |
| `rsvp.sendVia` | `mailto` (client mail), `whatsapp` (message pré-rempli) ou `formspree` (POST) ; libellés et messages d'erreur dans `rsvp.labels` |
| `venue.latitude`, `venue.longitude` | Coordonnées du lieu pour les liens Waze et Google Maps (ou `wazeUrl` / `googleMapsUrl` explicites) |
| `attire.items[]` | Illustrations des tenues avec position (`left`, `width` en %) |
| `schedule.items[]` | Heure et titre de chaque étape |
| `weddingList.buttons[]`, `shops[]`, `banks` | Boutons Morocco / Abroad, boutiques (nom, lien, image), RIB et IBAN |

## Tester en local

```bash
python3 -m http.server 8080
# puis http://localhost:8080  et  http://localhost:8080/admin/
```
