import { type ChannelAnalyticsSyncJob } from 'wasp/server/jobs';
import { syncChannelAnalytics } from '../reelforge/sync/index.js';

/**
 * Recurring job: refreshes analytics for every connected channel that has
 * credentials. Channels without tokens (e.g. manually tracked ones) are
 * skipped silently; real sync errors are stored on the channel and logged.
 */
export const syncAllChannelsAnalytics: ChannelAnalyticsSyncJob<never, void> = async (_args, context) => {
  const channels = await context.entities.Channel.findMany({
    where: {
      OR: [{ accessToken: { not: null } }, { refreshToken: { not: null } }],
    },
  });

  for (const channel of channels) {
    try {
      await syncChannelAnalytics(channel, context.entities);
      await context.entities.Channel.update({
        where: { id: channel.id },
        data: { lastSyncedAt: new Date(), lastSyncError: null },
      });
    } catch (error: any) {
      const message = error?.message ?? 'Unknown sync error';
      await context.entities.Channel.update({
        where: { id: channel.id },
        data: { lastSyncError: message },
      });
      await context.entities.Logs.create({
        data: { message: `Channel sync failed for ${channel.platform}/${channel.name}: ${message}`, level: 'error' },
      });
    }
  }
};
