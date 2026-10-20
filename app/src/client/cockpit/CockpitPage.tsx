import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, getCockpitStats } from 'wasp/client/operations';
import { FaChartLine, FaClock, FaHourglassHalf, FaUserPlus } from 'react-icons/fa';
import useColorMode from '../hooks/useColorMode';
import CockpitLayout from './CockpitLayout';
import KpiCard from './components/KpiCard';
import TimeseriesChart from './components/TimeseriesChart';
import GeoTable from './components/GeoTable';
import ChannelCard from './components/ChannelCard';
import VideoList from './components/VideoList';
import { formatDuration, formatNumber, formatWatchTime, percentDelta } from './platform';

const RANGES = [
  { days: 7, label: '7 j' },
  { days: 28, label: '28 j' },
  { days: 90, label: '90 j' },
];

export default function CockpitPage() {
  const [days, setDays] = useState(28);
  const [colorMode] = useColorMode();
  const isDark = colorMode === 'dark';
  const { data: stats, isLoading, error } = useQuery(getCockpitStats, { days });

  return (
    <CockpitLayout>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h2 className='text-title-md2 font-bold text-black dark:text-white'>Vue d'ensemble</h2>
          <p className='text-sm text-body dark:text-bodydark'>
            Toutes vos chaînes, un seul cockpit — {days} derniers jours.
          </p>
        </div>
        <div className='inline-flex rounded-md border border-stroke bg-white p-1 dark:border-strokedark dark:bg-boxdark'>
          {RANGES.map((range) => (
            <button
              key={range.days}
              onClick={() => setDays(range.days)}
              className={`rounded px-3 py-1 text-sm font-medium ${
                days === range.days
                  ? 'bg-primary text-white'
                  : 'text-body hover:text-black dark:text-bodydark dark:hover:text-white'
              }`}
              aria-pressed={days === range.days}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className='mb-6 rounded-sm border border-meta-1 bg-meta-1/10 p-4 text-sm text-meta-1'>
          Erreur de chargement : {error.message}
        </div>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4'>
        <KpiCard
          label='Vues'
          value={stats ? formatNumber(stats.totals.views) : '—'}
          delta={stats ? percentDelta(stats.totals.views, stats.prevTotals.views) : null}
          icon={<FaChartLine className='h-5 w-5' />}
          isLoading={isLoading}
        />
        <KpiCard
          label='Watch time'
          value={stats ? formatWatchTime(stats.totals.watchTimeMinutes) : '—'}
          delta={stats ? percentDelta(stats.totals.watchTimeMinutes, stats.prevTotals.watchTimeMinutes) : null}
          icon={<FaClock className='h-5 w-5' />}
          isLoading={isLoading}
        />
        <KpiCard
          label='Durée moyenne de visionnage'
          value={stats ? formatDuration(stats.totals.avgViewDurationSec) : '—'}
          icon={<FaHourglassHalf className='h-5 w-5' />}
          isLoading={isLoading}
        />
        <KpiCard
          label='Abonnés gagnés'
          value={stats ? `+${formatNumber(stats.totals.subscribersGained)}` : '—'}
          footer={stats ? `${formatNumber(stats.totals.followersTotal)} abonnés au total` : undefined}
          icon={<FaUserPlus className='h-5 w-5' />}
          isLoading={isLoading}
        />
      </div>

      <div className='mt-6 grid grid-cols-1 gap-4 md:gap-6 2xl:grid-cols-2'>
        <TimeseriesChart
          title='Vues par jour'
          timeseries={stats?.timeseries ?? []}
          metric='views'
          unitLabel='vues'
          isDark={isDark}
        />
        <TimeseriesChart
          title='Minutes visionnées par jour'
          timeseries={stats?.timeseries ?? []}
          metric='watchTimeMinutes'
          unitLabel='min'
          isDark={isDark}
        />
      </div>

      <div className='mt-6'>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-black dark:text-white'>Chaînes</h3>
          <Link to='/cockpit/channels' className='text-sm font-medium text-primary hover:underline'>
            Gérer les chaînes →
          </Link>
        </div>
        {stats && stats.channels.length === 0 ? (
          <div className='rounded-sm border border-dashed border-stroke bg-white p-8 text-center dark:border-strokedark dark:bg-boxdark'>
            <p className='text-body dark:text-bodydark'>
              Aucune chaîne connectée pour l'instant.{' '}
              <Link to='/cockpit/channels' className='font-medium text-primary hover:underline'>
                Ajoutez votre chaîne YouTube ou votre compte Instagram
              </Link>{' '}
              pour alimenter le cockpit.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3'>
            {stats?.channels.map((channel) => <ChannelCard key={channel.id} channel={channel} isDark={isDark} />)}
          </div>
        )}
      </div>

      <div className='mt-6 grid grid-cols-1 gap-4 md:gap-6 2xl:grid-cols-2'>
        <GeoTable title='Top pays' rows={stats?.countries ?? []} mode='country' />
        <GeoTable title='Top villes' rows={stats?.cities ?? []} mode='city' />
      </div>

      <div className='mt-6 grid grid-cols-1 gap-4 md:gap-6 2xl:grid-cols-2'>
        <VideoList
          title='Top vidéos'
          videos={stats?.topVideos ?? []}
          emptyMessage='Aucune vidéo publiée pour le moment.'
          variant='published'
          isDark={isDark}
        />
        <VideoList
          title='Prochaines publications'
          videos={stats?.upcomingVideos ?? []}
          emptyMessage='Rien de programmé — planifiez vos vidéos depuis le calendrier.'
          variant='scheduled'
          isDark={isDark}
        />
      </div>
    </CockpitLayout>
  );
}
