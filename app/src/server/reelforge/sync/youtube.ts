import { type Channel } from 'wasp/entities';
import {
  type SyncEntities,
  formatDateYYYYMMDD,
  lookbackRange,
  upsertDailyStat,
  upsertGeoStat,
} from './index.js';

const YT_ANALYTICS_URL = 'https://youtubeanalytics.googleapis.com/v2/reports';
const YT_DATA_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Syncs a YouTube channel using the YouTube Data API v3 (channel info, uploaded
 * videos) and the YouTube Analytics API v2 (watch time, average view duration,
 * geography). Requires:
 *  - env YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET (the OAuth app)
 *  - channel.refreshToken (an OAuth refresh token for the channel owner, with
 *    scopes youtube.readonly + yt-analytics.readonly)
 */
export async function syncYouTubeChannel(channel: Channel, entities: SyncEntities): Promise<void> {
  const accessToken = await getAccessToken(channel);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const { startDate, endDate } = lookbackRange();
  const start = formatDateYYYYMMDD(startDate);
  const end = formatDateYYYYMMDD(endDate);

  // 1. Channel info: title, thumbnail, subscriber count, uploads playlist.
  const channelRes = await getJson(
    `${YT_DATA_URL}/channels?part=snippet,statistics,contentDetails&mine=true`,
    headers
  );
  const ytChannel = channelRes.items?.[0];
  if (!ytChannel) {
    throw new Error('YouTube API returned no channel for this token');
  }
  await entities.Channel.update({
    where: { id: channel.id },
    data: {
      externalId: ytChannel.id,
      name: ytChannel.snippet?.title ?? channel.name,
      thumbnailUrl: ytChannel.snippet?.thumbnails?.default?.url ?? channel.thumbnailUrl,
      subscriberCount: parseInt(ytChannel.statistics?.subscriberCount ?? '0', 10),
    },
  });

  // 2. Daily metrics (views, watch time, average view duration, engagement).
  const daily = await getJson(
    `${YT_ANALYTICS_URL}?ids=channel==MINE&startDate=${start}&endDate=${end}` +
      `&metrics=views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained` +
      `&dimensions=day&sort=day`,
    headers
  );
  for (const row of daily.rows ?? []) {
    const [day, views, watchTime, avgDuration, likes, comments, shares, subsGained] = row;
    await upsertDailyStat(entities, channel.id, new Date(`${day}T00:00:00.000Z`), {
      views: Number(views),
      watchTimeMinutes: Number(watchTime),
      avgViewDurationSec: Number(avgDuration),
      likes: Number(likes),
      comments: Number(comments),
      shares: Number(shares),
      subscribersGained: Number(subsGained),
    });
  }

  // 3. Geography: countries, then top cities. Stored against the range end date
  //    (one aggregated row per range; city = '' means country-level).
  const geoDate = new Date(`${end}T00:00:00.000Z`);
  const countries = await getJson(
    `${YT_ANALYTICS_URL}?ids=channel==MINE&startDate=${start}&endDate=${end}` +
      `&metrics=views,estimatedMinutesWatched&dimensions=country&sort=-views&maxResults=25`,
    headers
  );
  for (const [country, views, watchTime] of countries.rows ?? []) {
    await upsertGeoStat(entities, channel.id, geoDate, String(country), '', Number(views), Number(watchTime));
  }
  try {
    const cities = await getJson(
      `${YT_ANALYTICS_URL}?ids=channel==MINE&startDate=${start}&endDate=${end}` +
        `&metrics=views,estimatedMinutesWatched&dimensions=city,country&sort=-views&maxResults=25`,
      headers
    );
    for (const [city, country, views, watchTime] of cities.rows ?? []) {
      await upsertGeoStat(
        entities,
        channel.id,
        geoDate,
        String(country),
        String(city),
        Number(views),
        Number(watchTime)
      );
    }
  } catch {
    // The city dimension is not available on all channels; country data is enough.
  }

  // 4. Recently uploaded videos (title, publish date, duration, view counts).
  const uploadsPlaylistId = ytChannel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) return;
  const playlist = await getJson(
    `${YT_DATA_URL}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`,
    headers
  );
  const videoIds: string[] = (playlist.items ?? [])
    .map((item: any) => item.contentDetails?.videoId)
    .filter(Boolean);
  if (videoIds.length === 0) return;

  const videosRes = await getJson(
    `${YT_DATA_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}`,
    headers
  );
  for (const video of videosRes.items ?? []) {
    await entities.Video.upsert({
      where: { channelId_externalId: { channelId: channel.id, externalId: video.id } },
      create: {
        channelId: channel.id,
        userId: channel.userId,
        externalId: video.id,
        title: video.snippet?.title ?? 'Untitled',
        status: 'PUBLISHED',
        publishedAt: video.snippet?.publishedAt ? new Date(video.snippet.publishedAt) : null,
        durationSec: parseISO8601Duration(video.contentDetails?.duration),
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url ?? null,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        views: parseInt(video.statistics?.viewCount ?? '0', 10),
        likes: parseInt(video.statistics?.likeCount ?? '0', 10),
        comments: parseInt(video.statistics?.commentCount ?? '0', 10),
      },
      update: {
        title: video.snippet?.title ?? 'Untitled',
        views: parseInt(video.statistics?.viewCount ?? '0', 10),
        likes: parseInt(video.statistics?.likeCount ?? '0', 10),
        comments: parseInt(video.statistics?.commentCount ?? '0', 10),
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url ?? null,
      },
    });
  }
}

async function getAccessToken(channel: Channel): Promise<string> {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET env vars are not set');
  }
  if (!channel.refreshToken) {
    throw new Error('No OAuth refresh token stored for this YouTube channel');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: channel.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to refresh YouTube access token (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('YouTube token endpoint returned no access token');
  }
  return data.access_token;
}

async function getJson(url: string, headers: Record<string, string>): Promise<any> {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`YouTube API error (HTTP ${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

// Parses ISO 8601 durations like PT1H2M30S into seconds.
function parseISO8601Duration(duration?: string): number | null {
  if (!duration) return null;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const [, h, m, s] = match;
  return (parseInt(h ?? '0', 10) * 3600 + parseInt(m ?? '0', 10) * 60 + parseInt(s ?? '0', 10)) || null;
}
