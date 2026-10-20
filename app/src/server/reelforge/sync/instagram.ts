import { type Channel } from 'wasp/entities';
import { type SyncEntities, formatDateYYYYMMDD, lookbackRange, upsertDailyStat, upsertGeoStat } from './index.js';

const GRAPH_URL = 'https://graph.facebook.com/v21.0';

/**
 * Syncs an Instagram professional account via the Instagram Graph API.
 * Requires:
 *  - channel.externalId: the IG user id (e.g. 1784140xxxxxxxxxx)
 *  - channel.accessToken: a long-lived access token with instagram_basic +
 *    instagram_manage_insights (via a linked Facebook Page)
 * Notes: Instagram does not expose per-day watch time at account level, so
 * watchTimeMinutes is approximated from reel insights where available.
 */
export async function syncInstagramChannel(channel: Channel, entities: SyncEntities): Promise<void> {
  if (!channel.accessToken) {
    throw new Error('No access token stored for this Instagram account');
  }
  if (!channel.externalId) {
    throw new Error('No Instagram user id (externalId) stored for this account');
  }
  const igUserId = channel.externalId;
  const token = channel.accessToken;
  const { startDate, endDate } = lookbackRange();
  const since = Math.floor(startDate.getTime() / 1000);
  const until = Math.floor(endDate.getTime() / 1000);

  // 1. Account info.
  const account = await getJson(
    `${GRAPH_URL}/${igUserId}?fields=username,name,followers_count,profile_picture_url&access_token=${token}`
  );
  await entities.Channel.update({
    where: { id: channel.id },
    data: {
      name: account.name || account.username || channel.name,
      handle: account.username ? `@${account.username}` : channel.handle,
      thumbnailUrl: account.profile_picture_url ?? channel.thumbnailUrl,
      subscriberCount: account.followers_count ?? channel.subscriberCount,
    },
  });

  // 2. Daily account insights: views (plays across media) and reach.
  const insights = await getJson(
    `${GRAPH_URL}/${igUserId}/insights?metric=views,reach&period=day&since=${since}&until=${until}&access_token=${token}`
  );
  const viewsByDay = new Map<string, { views: number; reach: number }>();
  for (const metric of insights.data ?? []) {
    for (const value of metric.values ?? []) {
      const day = String(value.end_time).slice(0, 10);
      const entry = viewsByDay.get(day) ?? { views: 0, reach: 0 };
      if (metric.name === 'views') entry.views = Number(value.value) || 0;
      if (metric.name === 'reach') entry.reach = Number(value.value) || 0;
      viewsByDay.set(day, entry);
    }
  }
  for (const [day, entry] of viewsByDay) {
    await upsertDailyStat(entities, channel.id, new Date(`${day}T00:00:00.000Z`), {
      views: entry.views,
      followersTotal: account.followers_count ?? 0,
    });
  }

  // 3. Follower demographics by country (lifetime metric, stored on today's date).
  try {
    const demo = await getJson(
      `${GRAPH_URL}/${igUserId}/insights?metric=follower_demographics&period=lifetime` +
        `&metric_type=total_value&breakdown=country&access_token=${token}`
    );
    const geoDate = new Date(`${formatDateYYYYMMDD(endDate)}T00:00:00.000Z`);
    const results = demo.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
    for (const result of results) {
      const country = result.dimension_values?.[0];
      if (!country) continue;
      await upsertGeoStat(entities, channel.id, geoDate, String(country), '', Number(result.value) || 0, 0);
    }
  } catch {
    // follower_demographics requires >= 100 followers; skip silently below that.
  }

  // 4. Recent media (reels & videos) with engagement counts.
  const media = await getJson(
    `${GRAPH_URL}/${igUserId}/media?fields=id,caption,media_type,media_product_type,permalink,` +
      `thumbnail_url,timestamp,like_count,comments_count&limit=50&access_token=${token}`
  );
  for (const item of media.data ?? []) {
    if (item.media_type !== 'VIDEO' && item.media_product_type !== 'REELS') continue;
    const title = (item.caption ?? 'Reel sans titre').split('\n')[0].slice(0, 120);
    let views = 0;
    let watchTimeMinutes = 0;
    let avgViewDurationSec = 0;
    try {
      const mediaInsights = await getJson(
        `${GRAPH_URL}/${item.id}/insights?metric=views,ig_reels_video_view_total_time,ig_reels_avg_watch_time&access_token=${token}`
      );
      for (const metric of mediaInsights.data ?? []) {
        const value = Number(metric.values?.[0]?.value) || 0;
        if (metric.name === 'views') views = value;
        if (metric.name === 'ig_reels_video_view_total_time') watchTimeMinutes = value / 1000 / 60;
        if (metric.name === 'ig_reels_avg_watch_time') avgViewDurationSec = value / 1000;
      }
    } catch {
      // Some media types do not support these metrics; keep the engagement counts.
    }
    await entities.Video.upsert({
      where: { channelId_externalId: { channelId: channel.id, externalId: String(item.id) } },
      create: {
        channelId: channel.id,
        userId: channel.userId,
        externalId: String(item.id),
        title,
        status: 'PUBLISHED',
        publishedAt: item.timestamp ? new Date(item.timestamp) : null,
        thumbnailUrl: item.thumbnail_url ?? null,
        url: item.permalink ?? null,
        views,
        likes: item.like_count ?? 0,
        comments: item.comments_count ?? 0,
        watchTimeMinutes,
        avgViewDurationSec,
      },
      update: {
        title,
        views,
        likes: item.like_count ?? 0,
        comments: item.comments_count ?? 0,
        watchTimeMinutes,
        avgViewDurationSec,
      },
    });
  }
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Instagram Graph API error (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}
