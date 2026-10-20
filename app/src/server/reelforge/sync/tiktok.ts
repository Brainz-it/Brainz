import { type Channel } from 'wasp/entities';
import { type SyncEntities } from './index.js';

/**
 * TikTok sync placeholder. The TikTok Display API exposes profile and video
 * data for the authorized creator (open.tiktokapis.com) once the app is
 * approved by TikTok. Wire it up here following the same pattern as
 * youtube.ts / instagram.ts:
 *  1. Exchange channel.refreshToken for an access token
 *     (POST https://open.tiktokapis.com/v2/oauth/token/).
 *  2. GET /v2/user/info/ for follower_count, display_name, avatar.
 *  3. GET /v2/video/list/ + /v2/video/query/ for per-video view counts.
 * Set TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET in .env.server.
 */
export async function syncTikTokChannel(_channel: Channel, _entities: SyncEntities): Promise<void> {
  throw new Error(
    "L'intégration TikTok n'est pas encore configurée : elle nécessite une app approuvée sur le TikTok Display API (voir REELFORGE_COCKPIT.md)."
  );
}
