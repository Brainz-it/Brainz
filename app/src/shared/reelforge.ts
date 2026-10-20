// Shared types & constants for the Reel Forge analytics cockpit.
// Used by both the server operations and the client pages.

export const PLATFORMS = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK'] as const;
export type Platform = (typeof PLATFORMS)[number];

export const VIDEO_STATUSES = ['DRAFT', 'SCHEDULED', 'PUBLISHED'] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  YOUTUBE: 'YouTube',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
};

// Categorical palette, one fixed color per platform (never reassigned),
// validated for CVD separation & contrast on white and on the dark surface (#24303F).
export const PLATFORM_COLORS_LIGHT: Record<Platform, string> = {
  YOUTUBE: '#D92D20',
  INSTAGRAM: '#7F56D9',
  TIKTOK: '#0E9384',
};

export const PLATFORM_COLORS_DARK: Record<Platform, string> = {
  YOUTUBE: '#E04438',
  INSTAGRAM: '#875BF7',
  TIKTOK: '#0E9384',
};

export type CockpitTotals = {
  views: number;
  watchTimeMinutes: number;
  avgViewDurationSec: number;
  likes: number;
  comments: number;
  subscribersGained: number;
  followersTotal: number;
};

export type PlatformTimeseries = {
  platform: Platform;
  points: { date: string; views: number; watchTimeMinutes: number }[];
};

export type GeoRow = {
  country: string;
  city: string;
  views: number;
  watchTimeMinutes: number;
};

export type ChannelSummary = {
  id: string;
  platform: Platform;
  name: string;
  handle: string | null;
  thumbnailUrl: string | null;
  followersTotal: number;
  views: number;
  watchTimeMinutes: number;
  subscribersGained: number;
  videoCount: number;
  lastSyncedAt: Date | null;
  lastSyncError: string | null;
};

export type VideoSummary = {
  id: string;
  title: string;
  platform: Platform;
  channelId: string;
  channelName: string;
  status: VideoStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  durationSec: number | null;
  views: number;
  likes: number;
  url: string | null;
  thumbnailUrl: string | null;
};

export type CockpitStats = {
  rangeDays: number;
  totals: CockpitTotals;
  prevTotals: { views: number; watchTimeMinutes: number };
  channels: ChannelSummary[];
  timeseries: PlatformTimeseries[];
  countries: GeoRow[];
  cities: GeoRow[];
  topVideos: VideoSummary[];
  upcomingVideos: VideoSummary[];
};
