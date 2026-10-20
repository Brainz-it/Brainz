import { type Channel } from 'wasp/entities';
import type { PrismaClient } from '@prisma/client';
import { syncYouTubeChannel } from './youtube.js';
import { syncInstagramChannel } from './instagram.js';
import { syncTikTokChannel } from './tiktok.js';

export type SyncEntities = {
  Channel: PrismaClient['channel'];
  ChannelDailyStats: PrismaClient['channelDailyStats'];
  ChannelGeoStats: PrismaClient['channelGeoStats'];
  Video: PrismaClient['video'];
};

// How far back each sync refreshes daily stats.
export const SYNC_LOOKBACK_DAYS = 30;

export async function syncChannelAnalytics(channel: Channel, entities: SyncEntities): Promise<void> {
  switch (channel.platform) {
    case 'YOUTUBE':
      return syncYouTubeChannel(channel, entities);
    case 'INSTAGRAM':
      return syncInstagramChannel(channel, entities);
    case 'TIKTOK':
      return syncTikTokChannel(channel, entities);
    default:
      throw new Error(`Unsupported platform: ${channel.platform}`);
  }
}

export function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function lookbackRange(days: number = SYNC_LOOKBACK_DAYS): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  endDate.setUTCHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - days);
  return { startDate, endDate };
}

export async function upsertDailyStat(
  entities: SyncEntities,
  channelId: string,
  date: Date,
  data: Partial<{
    views: number;
    watchTimeMinutes: number;
    avgViewDurationSec: number;
    likes: number;
    comments: number;
    shares: number;
    subscribersGained: number;
    followersTotal: number;
  }>
): Promise<void> {
  await entities.ChannelDailyStats.upsert({
    where: { channelId_date: { channelId, date } },
    create: { channelId, date, ...data },
    update: data,
  });
}

export async function upsertGeoStat(
  entities: SyncEntities,
  channelId: string,
  date: Date,
  country: string,
  city: string,
  views: number,
  watchTimeMinutes: number
): Promise<void> {
  await entities.ChannelGeoStats.upsert({
    where: { channelId_date_country_city: { channelId, date, country, city } },
    create: { channelId, date, country, city, views, watchTimeMinutes },
    update: { views, watchTimeMinutes },
  });
}
