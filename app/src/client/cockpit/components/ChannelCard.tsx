import { type ChannelSummary } from '../../../shared/reelforge';
import { PlatformIcon, formatNumber, formatWatchTime, platformColor, platformLabel } from '../platform';

export default function ChannelCard({ channel, isDark }: { channel: ChannelSummary; isDark: boolean }) {
  const color = platformColor(channel.platform, isDark);
  return (
    <div className='rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark'>
      <div className='flex items-center gap-3'>
        <div
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white'
          style={{ backgroundColor: color }}
        >
          <PlatformIcon platform={channel.platform} className='h-5 w-5' />
        </div>
        <div className='min-w-0'>
          <h4 className='truncate font-semibold text-black dark:text-white'>{channel.name}</h4>
          <p className='truncate text-sm text-body dark:text-bodydark'>
            {platformLabel(channel.platform)}
            {channel.handle ? ` · ${channel.handle}` : ''}
          </p>
        </div>
      </div>
      <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
        <div>
          <dt className='text-body dark:text-bodydark'>Abonnés</dt>
          <dd className='font-semibold text-black dark:text-white'>{formatNumber(channel.followersTotal)}</dd>
        </div>
        <div>
          <dt className='text-body dark:text-bodydark'>Vues (période)</dt>
          <dd className='font-semibold text-black dark:text-white'>{formatNumber(channel.views)}</dd>
        </div>
        <div>
          <dt className='text-body dark:text-bodydark'>Watch time</dt>
          <dd className='font-semibold text-black dark:text-white'>{formatWatchTime(channel.watchTimeMinutes)}</dd>
        </div>
        <div>
          <dt className='text-body dark:text-bodydark'>Vidéos</dt>
          <dd className='font-semibold text-black dark:text-white'>{channel.videoCount}</dd>
        </div>
      </dl>
      <p className='mt-3 text-xs text-body dark:text-bodydark'>
        {channel.lastSyncError ? (
          <span className='text-meta-1'>⚠ {channel.lastSyncError}</span>
        ) : channel.lastSyncedAt ? (
          `Synchronisé le ${new Date(channel.lastSyncedAt).toLocaleString('fr-FR')}`
        ) : (
          'Jamais synchronisé — données manuelles ou de démo'
        )}
      </p>
    </div>
  );
}
