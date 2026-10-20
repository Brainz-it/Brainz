import { type VideoSummary } from '../../../shared/reelforge';
import { PlatformIcon, formatDuration, formatNumber, platformColor } from '../platform';

type VideoListProps = {
  title: string;
  videos: VideoSummary[];
  emptyMessage: string;
  variant: 'published' | 'scheduled';
  isDark: boolean;
};

export default function VideoList({ title, videos, emptyMessage, variant, isDark }: VideoListProps) {
  return (
    <div className='rounded-sm border border-stroke bg-white px-5 pb-5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark'>
      <h4 className='mb-4 text-lg font-semibold text-black dark:text-white'>{title}</h4>
      {videos.length === 0 ? (
        <p className='py-8 text-center text-sm text-body dark:text-bodydark'>{emptyMessage}</p>
      ) : (
        <ul className='divide-y divide-stroke dark:divide-strokedark'>
          {videos.map((video) => (
            <li key={video.id} className='flex items-center gap-3 py-3'>
              <span
                className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white'
                style={{ backgroundColor: platformColor(video.platform, isDark) }}
                title={video.channelName}
              >
                <PlatformIcon platform={video.platform} className='h-4 w-4' />
              </span>
              <div className='min-w-0 flex-1'>
                {video.url ? (
                  <a
                    href={video.url}
                    target='_blank'
                    rel='noreferrer'
                    className='block truncate text-sm font-medium text-black hover:text-primary dark:text-white'
                  >
                    {video.title}
                  </a>
                ) : (
                  <span className='block truncate text-sm font-medium text-black dark:text-white'>{video.title}</span>
                )}
                <span className='text-xs text-body dark:text-bodydark'>
                  {video.channelName} · {formatDuration(video.durationSec)}
                </span>
              </div>
              <div className='shrink-0 text-right text-sm'>
                {variant === 'published' ? (
                  <>
                    <div className='font-semibold text-black dark:text-white'>{formatNumber(video.views)} vues</div>
                    <div className='text-xs text-body dark:text-bodydark'>{formatNumber(video.likes)} ❤</div>
                  </>
                ) : (
                  <div className='text-xs font-medium text-black dark:text-white'>
                    {video.scheduledAt
                      ? new Date(video.scheduledAt).toLocaleString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
