# 🎬 Reel Forge Cockpit — Dashboard analytics multi-plateformes

Un seul cockpit pour suivre toutes vos chaînes : **YouTube**, **Instagram** et bientôt **TikTok**.

- **`/cockpit`** — Vue d'ensemble : vues, watch time, durée moyenne de visionnage, abonnés gagnés, courbes par jour et par plateforme, top pays / top villes, top vidéos, prochaines publications. Période au choix : 7 / 28 / 90 jours.
- **`/cockpit/calendar`** — Calendrier de contenu : vidéos publiées et programmées, toutes plateformes confondues. Cliquez sur un jour pour programmer une vidéo.
- **`/cockpit/channels`** — Gestion des chaînes : connexion des comptes, synchronisation manuelle, état de la dernière synchro.

Les statistiques sont rafraîchies automatiquement **toutes les 6 heures** par un job serveur (`channelAnalyticsSyncJob`), et à la demande via le bouton « Synchroniser ».

## Démarrage rapide (avec données de démo)

```bash
cd app
wasp start db          # terminal 1 : lance Postgres
wasp db migrate-dev    # terminal 2 : crée les tables
wasp db seed devSeedReelForge   # données de démo : 2 chaînes, 45 jours de stats, calendrier
wasp start             # lance l'app, puis ouvrez http://localhost:3000/cockpit
```

Le seed crée un utilisateur `reelforge` avec des chaînes YouTube et Instagram fictives, pour voir le cockpit rempli avant de brancher vos vrais comptes.

## Connecter votre chaîne YouTube

La synchro YouTube récupère : infos de chaîne, abonnés, **vues, watch time, durée moyenne, likes, commentaires, partages, abonnés gagnés par jour**, **répartition pays + villes**, et vos 50 dernières vidéos.

1. Sur [console.cloud.google.com](https://console.cloud.google.com), créez un projet et activez **YouTube Data API v3** et **YouTube Analytics API**.
2. Créez des identifiants OAuth 2.0 (« Application Web ») → copiez-les dans `app/.env.server` :
   ```
   YOUTUBE_CLIENT_ID=...
   YOUTUBE_CLIENT_SECRET=...
   ```
3. Générez un **refresh token** pour le compte propriétaire de la chaîne avec les scopes `https://www.googleapis.com/auth/youtube.readonly` et `https://www.googleapis.com/auth/yt-analytics.readonly` (le plus simple : [OAuth 2.0 Playground](https://developers.google.com/oauthplayground) avec vos propres identifiants, option « Use your own OAuth credentials »).
4. Dans **Cockpit → Chaînes → Ajouter une chaîne** : plateforme *YouTube*, un nom, et collez le refresh token dans le champ « Refresh token OAuth ». Cliquez **Synchroniser**.

## Connecter votre compte Instagram

Prérequis : un compte Instagram **professionnel** lié à une Page Facebook (c'est l'API officielle Meta ; c'est ce qui sera réutilisé plus tard pour la publication automatique).

1. Sur [developers.facebook.com](https://developers.facebook.com), créez une app et ajoutez le produit **Instagram Graph API**.
2. Donnez-lui les permissions `instagram_basic` et `instagram_manage_insights` (+ `pages_show_list`, `pages_read_engagement`).
3. Récupérez votre **IG User ID** et un **jeton d'accès longue durée** (60 jours) via le Graph API Explorer puis l'échange de jeton (`GET /oauth/access_token?grant_type=fb_exchange_token&...`).
4. Dans **Cockpit → Chaînes → Ajouter une chaîne** : plateforme *Instagram*, l'ID dans « ID externe », le jeton dans « Access token ». Cliquez **Synchroniser**.

Récupéré : abonnés, **vues et reach par jour**, **démographie des abonnés par pays**, vos 50 derniers reels avec vues, likes, commentaires et **temps de visionnage** (quand Meta l'expose).

> ⚠️ Limites Meta : pas de watch time quotidien au niveau du compte, démographie disponible à partir de 100 abonnés, jeton à renouveler tous les 60 jours.

## TikTok (à venir)

Le branchement est prévu dans `app/src/server/reelforge/sync/tiktok.ts` (le squelette documente les étapes). Il faut une app approuvée sur le [TikTok Display API](https://developers.tiktok.com) — comptez un délai de validation par TikTok. En attendant, vous pouvez créer une chaîne TikTok « manuelle » pour l'utiliser dans le calendrier.

## Architecture

```
app/src/
├── shared/reelforge.ts                 # types + palette par plateforme (partagés client/serveur)
├── server/reelforge/
│   ├── queries.ts                      # getChannels, getCockpitStats, getContentCalendar
│   ├── actions.ts                      # createChannel, scheduleVideo, syncChannel, …
│   └── sync/                           # youtube.ts, instagram.ts, tiktok.ts (1 module / plateforme)
├── server/workers/syncChannelAnalytics.ts   # job toutes les 6 h
├── server/scripts/reelForgeSeed.ts     # données de démo
└── client/cockpit/                     # CockpitPage, CalendarPage, ChannelsPage + composants
```

Modèle de données (Prisma via `main.wasp`) : `Channel` (1 par compte connecté) → `ChannelDailyStats` (1 ligne / jour), `ChannelGeoStats` (pays et villes, `city = ''` = ligne pays), `Video` (publiées **et** programmées — le calendrier et les stats partagent la même table).

Pour ajouter une plateforme : créer `sync/<plateforme>.ts` sur le modèle de `youtube.ts`, l'enregistrer dans `sync/index.ts`, ajouter la plateforme dans `shared/reelforge.ts` (avec une couleur validée).
