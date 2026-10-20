import { FormEvent, useMemo, useState } from 'react';
import {
  useQuery,
  getContentCalendar,
  getChannels,
  scheduleVideo,
  deleteVideo,
} from 'wasp/client/operations';
import toast from 'react-hot-toast';
import useColorMode from '../hooks/useColorMode';
import CockpitLayout from './CockpitLayout';
import { PlatformIcon, platformColor, platformLabel } from './platform';
import { type Platform, type VideoSummary } from '../../shared/reelforge';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function monthRange(year: number, month: number): { from: Date; to: Date } {
  return {
    from: new Date(year, month, 1, 0, 0, 0),
    to: new Date(year, month + 1, 0, 23, 59, 59),
  };
}

function videoDate(video: VideoSummary): Date | null {
  const date = video.scheduledAt ?? video.publishedAt;
  return date ? new Date(date) : null;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState<string>('');
  const [colorMode] = useColorMode();
  const isDark = colorMode === 'dark';

  const { from, to } = useMemo(() => monthRange(year, month), [year, month]);
  const { data: videos, isLoading, refetch } = useQuery(getContentCalendar, { from, to });
  const { data: channels } = useQuery(getChannels);

  const videosByDay = useMemo(() => {
    const map = new Map<number, VideoSummary[]>();
    for (const video of videos ?? []) {
      const date = videoDate(video);
      if (!date || date.getMonth() !== month || date.getFullYear() !== year) continue;
      const day = date.getDate();
      map.set(day, [...(map.get(day) ?? []), video]);
    }
    return map;
  }, [videos, month, year]);

  const changeMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  // Monday-first calendar grid.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const openFormForDay = (day: number) => {
    const d = new Date(year, month, day, 18, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setFormDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`);
    setShowForm(true);
  };

  const handleSchedule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const channelId = String(data.get('channelId') ?? '');
    const title = String(data.get('title') ?? '');
    const scheduledAtRaw = String(data.get('scheduledAt') ?? '');
    const durationRaw = String(data.get('durationSec') ?? '');
    if (!channelId || !title || !scheduledAtRaw) {
      toast.error('Chaîne, titre et date sont obligatoires.');
      return;
    }
    try {
      await scheduleVideo({
        channelId,
        title,
        scheduledAt: new Date(scheduledAtRaw),
        durationSec: durationRaw ? parseInt(durationRaw, 10) : undefined,
      });
      toast.success('Vidéo programmée ✅');
      form.reset();
      setShowForm(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Échec de la programmation');
    }
  };

  const handleDelete = async (video: VideoSummary) => {
    if (!window.confirm(`Supprimer « ${video.title} » du calendrier ?`)) return;
    try {
      await deleteVideo({ id: video.id });
      toast.success('Vidéo supprimée');
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Échec de la suppression');
    }
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <CockpitLayout>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h2 className='text-title-md2 font-bold text-black dark:text-white'>Calendrier de contenu</h2>
          <p className='text-sm text-body dark:text-bodydark'>
            Vidéos programmées et publiées, toutes plateformes confondues.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => changeMonth(-1)}
            className='rounded border border-stroke px-3 py-1.5 text-sm hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4'
            aria-label='Mois précédent'
          >
            ←
          </button>
          <span className='min-w-[11rem] text-center font-semibold text-black dark:text-white'>
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className='rounded border border-stroke px-3 py-1.5 text-sm hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4'
            aria-label='Mois suivant'
          >
            →
          </button>
          <button
            onClick={() => {
              setFormDate('');
              setShowForm(true);
            }}
            className='ml-2 rounded bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-opacity-90'
          >
            + Programmer une vidéo
          </button>
        </div>
      </div>

      {showForm && (
        <div className='mb-6 rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark'>
          <h3 className='mb-4 font-semibold text-black dark:text-white'>Programmer une vidéo</h3>
          {channels && channels.length === 0 ? (
            <p className='text-sm text-body dark:text-bodydark'>
              Ajoutez d'abord une chaîne dans l'onglet « Chaînes ».
            </p>
          ) : (
            <form onSubmit={handleSchedule} className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
              <select
                name='channelId'
                required
                className='rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
              >
                <option value=''>Chaîne…</option>
                {channels?.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {platformLabel(channel.platform as Platform)} — {channel.name}
                  </option>
                ))}
              </select>
              <input
                name='title'
                required
                placeholder='Titre de la vidéo'
                className='rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
              />
              <input
                name='scheduledAt'
                type='datetime-local'
                required
                defaultValue={formDate}
                className='rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
              />
              <div className='flex gap-2'>
                <input
                  name='durationSec'
                  type='number'
                  min='1'
                  placeholder='Durée (s)'
                  className='w-full rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
                />
                <button type='submit' className='rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90'>
                  OK
                </button>
                <button
                  type='button'
                  onClick={() => setShowForm(false)}
                  className='rounded border border-stroke px-3 py-2 text-sm dark:border-strokedark'
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className='rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
        <div className='grid grid-cols-7 border-b border-stroke text-center text-sm font-medium text-body dark:border-strokedark dark:text-bodydark'>
          {WEEKDAYS.map((day) => (
            <div key={day} className='py-2'>
              {day}
            </div>
          ))}
        </div>
        <div className='grid grid-cols-7'>
          {cells.map((day, index) => (
            <div
              key={index}
              className={`min-h-[6.5rem] border-b border-r border-stroke p-1.5 dark:border-strokedark ${
                day ? 'cursor-pointer hover:bg-gray-2 dark:hover:bg-meta-4' : 'bg-whiten dark:bg-boxdark-2'
              }`}
              onClick={() => day && openFormForDay(day)}
            >
              {day && (
                <>
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday(day) ? 'bg-primary text-white' : 'text-black dark:text-white'
                    }`}
                  >
                    {day}
                  </span>
                  <div className='mt-1 space-y-1'>
                    {(videosByDay.get(day) ?? []).map((video) => (
                      <div
                        key={video.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (video.status === 'SCHEDULED') handleDelete(video);
                          else if (video.url) window.open(video.url, '_blank');
                        }}
                        title={`${video.title} — ${video.channelName}${
                          video.status === 'SCHEDULED' ? ' (cliquer pour supprimer)' : ''
                        }`}
                        className={`flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-xs text-white ${
                          video.status === 'SCHEDULED' ? 'opacity-80 ring-1 ring-inset ring-white/40' : ''
                        }`}
                        style={{ backgroundColor: platformColor(video.platform, isDark) }}
                      >
                        <PlatformIcon platform={video.platform} className='h-3 w-3 shrink-0' />
                        <span className='truncate'>{video.title}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className='mt-3 text-xs text-body dark:text-bodydark'>
        {isLoading
          ? 'Chargement…'
          : 'Astuce : cliquez sur un jour pour programmer une vidéo. Les vidéos avec un liseré clair sont programmées, les autres sont publiées.'}
      </p>
    </CockpitLayout>
  );
}
