import { type Channel, type Video } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { type GetChannels, type GetCockpitStats, type GetContentCalendar } from 'wasp/server/operations';
import {
  type ChannelSummary,
  type CockpitStats,
  type GeoRow,
  type Platform,
  type PlatformTimeseries,
  type VideoSummary,
  type VideoStatus,
} from '../../shared/reelforge.js';

function startOfUTCDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function daysAgoUTC(days: number): Date {
  const d = startOfUTCDay(new Date());
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function toVideoSummary(video: Video & { channel: Channel }): VideoSummary {
  return {
    id: video.id,
    title: video.title,
    platform: video.channel.platform as Platform,
    channelId: video.channelId,
    channelName: video.channel.name,
    status: video.status as VideoStatus,
    scheduledAt: video.scheduledAt,
    publishedAt: video.publishedAt,
    durationSec: video.durationSec,
    views: video.views,
    likes: video.likes,
    url: video.url,
    thumbnailUrl: video.thumbnailUrl,
  };
}

// The OAuth tokens never leave the server: they are stripped before returning.
export type SafeChannel = Omit<Channel, 'accessToken' | 'refreshToken'>;

export const getChannels: GetChannels<void, SafeChannel[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const channels = await context.entities.Channel.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: 'asc' },
  });
  return channels.map(({ accessToken: _a, refreshToken: _r, ...channel }) => channel);
};

type GetCockpitStatsArgs = {
  days?: number;
};

export const getCockpitStats: GetCockpitStats<GetCockpitStatsArgs, CockpitStats> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const rangeDays = args?.days && args.days > 0 && args.days <= 365 ? args.days : 28;
  const since = daysAgoUTC(rangeDays);
  const prevSince = daysAgoUTC(rangeDays * 2);

  const channels = await context.entities.Channel.findMany({
    where: { userId: context.user.id },
    include: {
      _count: { select: { videos: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  const channelIds = channels.map((c) => c.id);
  const channelById = new Map(channels.map((c) => [c.id, c]));

  const dailyStats = await context.entities.ChannelDailyStats.findMany({
    where: { channelId: { in: channelIds }, date: { gte: prevSince } },
    orderBy: { date: 'asc' },
  });

  const currentStats = dailyStats.filter((s) => s.date >= since);
  const prevStats = dailyStats.filter((s) => s.date < since);

  // Totals over the selected range.
  const totals = {
    views: 0,
    watchTimeMinutes: 0,
    avgViewDurationSec: 0,
    likes: 0,
    comments: 0,
    subscribersGained: 0,
    followersTotal: channels.reduce((sum, c) => sum + c.subscriberCount, 0),
  };
  for (const stat of currentStats) {
    totals.views += stat.views;
    totals.watchTimeMinutes += stat.watchTimeMinutes;
    totals.likes += stat.likes;
    totals.comments += stat.comments;
    totals.subscribersGained += stat.subscribersGained;
  }
  totals.avgViewDurationSec = totals.views > 0 ? (totals.watchTimeMinutes * 60) / totals.views : 0;

  const prevTotals = { views: 0, watchTimeMinutes: 0 };
  for (const stat of prevStats) {
    prevTotals.views += stat.views;
    prevTotals.watchTimeMinutes += stat.watchTimeMinutes;
  }

  // Per-platform daily timeseries (one series per platform, fixed identity).
  const seriesByPlatform = new Map<Platform, Map<string, { views: number; watchTimeMinutes: number }>>();
  for (const stat of currentStats) {
    const channel = channelById.get(stat.channelId);
    if (!channel) continue;
    const platform = channel.platform as Platform;
    const dateKey = stat.date.toISOString().slice(0, 10);
    if (!seriesByPlatform.has(platform)) {
      seriesByPlatform.set(platform, new Map());
    }
    const byDate = seriesByPlatform.get(platform)!;
    const point = byDate.get(dateKey) ?? { views: 0, watchTimeMinutes: 0 };
    point.views += stat.views;
    point.watchTimeMinutes += stat.watchTimeMinutes;
    byDate.set(dateKey, point);
  }
  const timeseries: PlatformTimeseries[] = [...seriesByPlatform.entries()].map(([platform, byDate]) => ({
    platform,
    points: [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, point]) => ({ date, ...point })),
  }));

  // Per-channel summary over the range.
  const statsByChannel = new Map<string, { views: number; watchTimeMinutes: number; subscribersGained: number }>();
  for (const stat of currentStats) {
    const acc = statsByChannel.get(stat.channelId) ?? { views: 0, watchTimeMinutes: 0, subscribersGained: 0 };
    acc.views += stat.views;
    acc.watchTimeMinutes += stat.watchTimeMinutes;
    acc.subscribersGained += stat.subscribersGained;
    statsByChannel.set(stat.channelId, acc);
  }
  const channelSummaries: ChannelSummary[] = channels.map((channel) => {
    const acc = statsByChannel.get(channel.id) ?? { views: 0, watchTimeMinutes: 0, subscribersGained: 0 };
    return {
      id: channel.id,
      platform: channel.platform as Platform,
      name: channel.name,
      handle: channel.handle,
      thumbnailUrl: channel.thumbnailUrl,
      followersTotal: channel.subscriberCount,
      views: acc.views,
      watchTimeMinutes: acc.watchTimeMinutes,
      subscribersGained: acc.subscribersGained,
      videoCount: channel._count.videos,
      lastSyncedAt: channel.lastSyncedAt,
      lastSyncError: channel.lastSyncError,
    };
  });

  // Geographic breakdown: countries (city = ''), then cities.
  const geoStats = await context.entities.ChannelGeoStats.groupBy({
    by: ['country', 'city'],
    where: { channelId: { in: channelIds }, date: { gte: since } },
    _sum: { views: true, watchTimeMinutes: true },
  });
  const toGeoRow = (g: (typeof geoStats)[number]): GeoRow => ({
    country: g.country,
    city: g.city,
    views: g._sum.views ?? 0,
    watchTimeMinutes: g._sum.watchTimeMinutes ?? 0,
  });
  const byViewsDesc = (a: GeoRow, b: GeoRow) => b.views - a.views;
  const countries = geoStats
    .filter((g) => g.city === '')
    .map(toGeoRow)
    .sort(byViewsDesc)
    .slice(0, 10);
  const cities = geoStats
    .filter((g) => g.city !== '')
    .map(toGeoRow)
    .sort(byViewsDesc)
    .slice(0, 10);

  const topVideos = await context.entities.Video.findMany({
    where: { userId: context.user.id, status: 'PUBLISHED' },
    include: { channel: true },
    orderBy: { views: 'desc' },
    take: 5,
  });

  const upcomingVideos = await context.entities.Video.findMany({
    where: {
      userId: context.user.id,
      status: 'SCHEDULED',
      scheduledAt: { gte: new Date() },
    },
    include: { channel: true },
    orderBy: { scheduledAt: 'asc' },
    take: 5,
  });

  return {
    rangeDays,
    totals,
    prevTotals,
    channels: channelSummaries,
    timeseries,
    countries,
    cities,
    topVideos: topVideos.map(toVideoSummary),
    upcomingVideos: upcomingVideos.map(toVideoSummary),
  };
};

type GetContentCalendarArgs = {
  from: Date;
  to: Date;
};

export const getContentCalendar: GetContentCalendar<GetContentCalendarArgs, VideoSummary[]> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  if (!args?.from || !args?.to) {
    throw new HttpError(400, 'from and to dates are required');
  }
  const videos = await context.entities.Video.findMany({
    where: {
      userId: context.user.id,
      OR: [
        { scheduledAt: { gte: args.from, lte: args.to } },
        { publishedAt: { gte: args.from, lte: args.to } },
      ],
    },
    include: { channel: true },
    orderBy: [{ scheduledAt: 'asc' }, { publishedAt: 'asc' }],
  });
  return videos.map(toVideoSummary);
};
