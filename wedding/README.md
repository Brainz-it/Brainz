# Site de mariage paramétrable

Site statique (HTML/CSS/JS, sans build) dont **tout le contenu** est piloté par deux fichiers JSON et un dossier de photos. Une page d'administration (`/admin`) sert de « petit backend côté Git » : elle lit et écrit ces fichiers directement dans le dépôt GitHub, chaque enregistrement est un commit, et GitHub Pages redéploie le site automatiquement.

```
wedding/
├── index.html            # page unique du site
├── assets/style.css      # styles (couleurs/polices surchargées par site.json)
├── assets/site.js        # rendu des sections à partir du JSON
├── content/site.json     # ⚙️ tous les textes, dates, couleurs, sections
├── content/gallery.json  # 🖼️ ordre et légendes des photos de la galerie
├── content/photos/       # 📷 les photos (hero, histoire, lieux, galerie)
└── admin/                # backend Git : édition du contenu et des photos
```

## Sections du site

Accueil (photo plein écran, prénoms, date) · Compte à rebours · Invitation · Notre histoire · Programme (frise) · Lieux (cartes + itinéraire) · Galerie (lightbox) · Dress code (palette) · Infos pratiques · RSVP · Pied de page.

Chaque section a un champ `enabled` dans `site.json` : passez-le à `false` pour la masquer. Le menu se construit tout seul à partir des sections visibles.

## Modifier le contenu

### Option A — Page d'administration (recommandé)

1. Ouvrez `https://<votre-site>/admin/`.
2. Renseignez le propriétaire et le nom du dépôt, la branche (`main`), et un **token GitHub fine-grained** limité à ce dépôt avec la permission *Contents : Read and write* (GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens).
3. Onglet **Contenu** : formulaire généré depuis `site.json` (textes, date, couleurs, programme, lieux, RSVP…). Les listes (programme, lieux, infos) peuvent être réordonnées, ajoutées, supprimées.
4. Onglet **Photos** : envoi de photos (redimensionnées en JPEG 1600 px max côté navigateur), ajout à la galerie, réordonnancement, légendes, suppression du dépôt.
5. **Enregistrer (commit)** : écrit `site.json` et `gallery.json` dans le dépôt. Le site est mis à jour en une à deux minutes.

Le token ne quitte jamais le navigateur (il est envoyé uniquement à `api.github.com`) ; il peut être mémorisé sur l'appareil ou seulement pour la session.

### Option B — Directement dans Git

Éditez `content/site.json` / `content/gallery.json`, déposez vos images dans `content/photos/`, commitez, poussez. C'est tout.

## Paramètres principaux (`content/site.json`)

| Clé | Rôle |
|---|---|
| `couple.bride`, `couple.groom`, `couple.tagline` | Prénoms et accroche du hero |
| `event.date` | Date ISO utilisée par le compte à rebours (ex. `2026-10-17T18:00:00+01:00`) |
| `event.dateLabel`, `event.city`, `event.heroImage` | Date affichée, ville, photo de couverture |
| `theme.color*`, `theme.font*` | Couleurs et polices Google Fonts |
| `program.items[]` | Frise horaire : `time`, `title`, `description`, `icon` |
| `venues.items[]` | Lieux : `name`, `place`, `address`, `time`, `mapsUrl`, `image` |
| `dressCode.colors[]` | Pastilles de couleurs de la palette |
| `practicalInfo.items[]` | Cartes d'infos pratiques |
| `rsvp.mode` | `mailto` (ouvre le client mail), `whatsapp` (message pré-rempli vers `whatsappNumber`) ou `formspree` (POST vers `formspreeEndpoint`) |
| `navigation[]` | Entrées du menu (`label`, `anchor`) |

## Déploiement

Le workflow `.github/workflows/deploy-wedding.yml` publie le dossier `wedding/` sur GitHub Pages à chaque push sur `main` touchant ce dossier. Activez une fois **Settings → Pages → Source : GitHub Actions**. Pour un nom de domaine personnalisé, ajoutez un fichier `wedding/CNAME` contenant le domaine.

Tout hébergeur statique (Netlify, Vercel, OVH…) fonctionne aussi : servez simplement le dossier `wedding/`.

## Tester en local

```bash
cd wedding && python3 -m http.server 8080
# puis http://localhost:8080  et  http://localhost:8080/admin/
```
