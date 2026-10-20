import { FormEvent, useState } from 'react';
import { useQuery, getChannels, createChannel, deleteChannel, syncChannel } from 'wasp/client/operations';
import toast from 'react-hot-toast';
import useColorMode from '../hooks/useColorMode';
import CockpitLayout from './CockpitLayout';
import { PlatformIcon, formatNumber, platformColor, platformLabel } from './platform';
import { PLATFORMS, type Platform } from '../../shared/reelforge';

export default function ChannelsPage() {
  const { data: channels, isLoading, refetch } = useQuery(getChannels);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [colorMode] = useColorMode();
  const isDark = colorMode === 'dark';

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await createChannel({
        platform: String(data.get('platform')) as Platform,
        name: String(data.get('name') ?? ''),
        handle: String(data.get('handle') ?? '') || undefined,
        externalId: String(data.get('externalId') ?? '') || undefined,
        accessToken: String(data.get('accessToken') ?? '') || undefined,
        refreshToken: String(data.get('refreshToken') ?? '') || undefined,
      });
      toast.success('Chaîne ajoutée ✅');
      form.reset();
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Échec de l'ajout");
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await syncChannel({ id });
      toast.success('Synchronisation terminée ✅');
    } catch (err: any) {
      toast.error(err?.message ?? 'Échec de la synchronisation');
    } finally {
      setSyncingId(null);
      refetch();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer la chaîne « ${name} » et toutes ses statistiques ?`)) return;
    try {
      await deleteChannel({ id });
      toast.success('Chaîne supprimée');
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Échec de la suppression');
    }
  };

  return (
    <CockpitLayout>
      <div className='mb-6'>
        <h2 className='text-title-md2 font-bold text-black dark:text-white'>Chaînes connectées</h2>
        <p className='text-sm text-body dark:text-bodydark'>
          Connectez vos comptes pour synchroniser automatiquement les statistiques (voir REELFORGE_COCKPIT.md pour
          obtenir les jetons d'accès).
        </p>
      </div>

      <div className='mb-6 overflow-x-auto rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark'>
        <table className='w-full min-w-[640px]'>
          <thead>
            <tr className='border-b border-stroke text-left text-sm text-body dark:border-strokedark dark:text-bodydark'>
              <th className='px-5 py-3 font-medium'>Chaîne</th>
              <th className='px-5 py-3 font-medium'>Abonnés</th>
              <th className='px-5 py-3 font-medium'>Dernière synchro</th>
              <th className='px-5 py-3 text-right font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className='px-5 py-8 text-center text-sm text-body dark:text-bodydark'>
                  Chargement…
                </td>
              </tr>
            )}
            {!isLoading && (channels ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className='px-5 py-8 text-center text-sm text-body dark:text-bodydark'>
                  Aucune chaîne pour l'instant — ajoutez-en une ci-dessous.
                </td>
              </tr>
            )}
            {(channels ?? []).map((channel) => (
              <tr key={channel.id} className='border-b border-stroke last:border-b-0 dark:border-strokedark'>
                <td className='px-5 py-3'>
                  <div className='flex items-center gap-3'>
                    <span
                      className='flex h-9 w-9 items-center justify-center rounded-full text-white'
                      style={{ backgroundColor: platformColor(channel.platform as Platform, isDark) }}
                    >
                      <PlatformIcon platform={channel.platform as Platform} className='h-4 w-4' />
                    </span>
                    <div>
                      <div className='font-medium text-black dark:text-white'>{channel.name}</div>
                      <div className='text-xs text-body dark:text-bodydark'>
                        {platformLabel(channel.platform as Platform)}
                        {channel.handle ? ` · ${channel.handle}` : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className='px-5 py-3 text-sm text-black dark:text-white'>
                  {formatNumber(channel.subscriberCount)}
                </td>
                <td className='px-5 py-3 text-sm'>
                  {channel.lastSyncError ? (
                    <span className='text-meta-1' title={channel.lastSyncError}>
                      ⚠ Erreur de synchro
                    </span>
                  ) : channel.lastSyncedAt ? (
                    <span className='text-body dark:text-bodydark'>
                      {new Date(channel.lastSyncedAt).toLocaleString('fr-FR')}
                    </span>
                  ) : (
                    <span className='text-body dark:text-bodydark'>Jamais</span>
                  )}
                </td>
                <td className='px-5 py-3 text-right'>
                  <button
                    onClick={() => handleSync(channel.id)}
                    disabled={syncingId === channel.id}
                    className='mr-2 rounded border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary hover:text-white disabled:opacity-50'
                  >
                    {syncingId === channel.id ? 'Synchro…' : 'Synchroniser'}
                  </button>
                  <button
                    onClick={() => handleDelete(channel.id, channel.name)}
                    className='rounded border border-meta-1 px-3 py-1 text-sm font-medium text-meta-1 hover:bg-meta-1 hover:text-white'
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark'>
        <h3 className='mb-4 font-semibold text-black dark:text-white'>Ajouter une chaîne</h3>
        <form onSubmit={handleCreate} className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          <select
            name='platform'
            required
            className='rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platformLabel(platform)}
              </option>
            ))}
          </select>
          <input
            name='name'
            required
            placeholder='Nom de la chaîne (ex. Brainz Reels)'
            className='rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
          />
          <input
            name='handle'
            placeholder='@handle (optionnel)'
            className='rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
          />
          <input
            name='externalId'
            placeholder='ID externe (IG user id, channel id…)'
            className='rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
          />
          <input
            name='accessToken'
            type='password'
            placeholder='Access token (Instagram/TikTok)'
            autoComplete='off'
            className='rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
          />
          <input
            name='refreshToken'
            type='password'
            placeholder='Refresh token OAuth (YouTube)'
            autoComplete='off'
            className='rounded border border-stroke bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark'
          />
          <div className='md:col-span-2 xl:col-span-3'>
            <button type='submit' className='rounded bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-opacity-90'>
              Ajouter la chaîne
            </button>
            <span className='ml-3 text-xs text-body dark:text-bodydark'>
              Les jetons sont optionnels : sans eux, la chaîne reste en suivi manuel (calendrier uniquement).
            </span>
          </div>
        </form>
      </div>
    </CockpitLayout>
  );
}
