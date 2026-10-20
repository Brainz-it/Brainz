import { FaYoutube, FaInstagram } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import {
  PLATFORM_COLORS_DARK,
  PLATFORM_COLORS_LIGHT,
  PLATFORM_LABELS,
  type Platform,
} from '../../shared/reelforge';

export function platformColor(platform: Platform, isDark: boolean): string {
  return isDark ? PLATFORM_COLORS_DARK[platform] : PLATFORM_COLORS_LIGHT[platform];
}

export function platformLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform];
}

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  switch (platform) {
    case 'YOUTUBE':
      return <FaYoutube className={className} aria-label='YouTube' />;
    case 'INSTAGRAM':
      return <FaInstagram className={className} aria-label='Instagram' />;
    case 'TIKTOK':
      return <SiTiktok className={className} aria-label='TikTok' />;
    default:
      return null;
  }
}

export function PlatformBadge({ platform, isDark }: { platform: Platform; isDark: boolean }) {
  return (
    <span className='inline-flex items-center gap-1.5 text-sm font-medium text-black dark:text-white'>
      <PlatformIcon platform={platform} className='h-4 w-4' />
      {platformLabel(platform)}
      <span
        className='ml-0.5 inline-block h-2 w-2 rounded-full'
        style={{ backgroundColor: platformColor(platform, isDark) }}
        aria-hidden='true'
      />
    </span>
  );
}

export function formatNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`;
  if (Math.abs(value) >= 10_000) return `${(value / 1_000).toFixed(1)} k`;
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}

export function formatWatchTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes % 60);
    return `${new Intl.NumberFormat('fr-FR').format(hours)} h ${rest.toString().padStart(2, '0')}`;
  }
  return `${Math.round(minutes)} min`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const COUNTRY_NAMES = new Intl.DisplayNames(['fr'], { type: 'region' });
export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  try {
    return COUNTRY_NAMES.of(code) ?? code;
  } catch {
    return code;
  }
}

export function percentDelta(current: number, previous: number): string | null {
  if (previous <= 0) return null;
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(0)} %`;
}
