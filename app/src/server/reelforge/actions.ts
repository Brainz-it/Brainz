import { type Channel, type Video } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import {
  type CreateChannel,
  type DeleteChannel,
  type DeleteVideo,
  type ScheduleVideo,
  type SyncChannel,
  type UpdateVideo,
} from 'wasp/server/operations';
import { PLATFORMS, type Platform, VIDEO_STATUSES, type VideoStatus } from '../../shared/reelforge.js';
import { syncChannelAnalytics } from './sync/index.js';

type CreateChannelArgs = {
  platform: Platform;
  name: string;
  handle?: string;
  externalId?: string;
  accessToken?: string;
  refreshToken?: string;
};

export const createChannel: CreateChannel<CreateChannelArgs, Channel> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  if (!PLATFORMS.includes(args.platform)) {
    throw new HttpError(400, `Unknown platform: ${args.platform}`);
  }
  if (!args.name?.trim()) {
    throw new HttpError(400, 'Channel name is required');
  }
  return context.entities.Channel.create({
    data: {
      platform: args.platform,
      name: args.name.trim(),
      handle: args.handle?.trim() || null,
      externalId: args.externalId?.trim() || null,
      accessToken: args.accessToken?.trim() || null,
      refreshToken: args.refreshToken?.trim() || null,
      user: { connect: { id: context.user.id } },
    },
  });
};

export const deleteChannel: DeleteChannel<{ id: string }, Channel> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const channel = await context.entities.Channel.findUnique({ where: { id } });
  if (!channel || channel.userId !== context.user.id) {
    throw new HttpError(404, 'Channel not found');
  }
  return context.entities.Channel.delete({ where: { id } });
};

type ScheduleVideoArgs = {
  channelId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  durationSec?: number;
};

export const scheduleVideo: ScheduleVideo<ScheduleVideoArgs, Video> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  if (!args.title?.trim()) {
    throw new HttpError(400, 'Video title is required');
  }
  const channel = await context.entities.Channel.findUnique({ where: { id: args.channelId } });
  if (!channel || channel.userId !== context.user.id) {
    throw new HttpError(404, 'Channel not found');
  }
  return context.entities.Video.create({
    data: {
      title: args.title.trim(),
      description: args.description?.trim() || null,
      status: 'SCHEDULED',
      scheduledAt: args.scheduledAt,
      durationSec: args.durationSec ?? null,
      channel: { connect: { id: channel.id } },
      user: { connect: { id: context.user.id } },
    },
  });
};

type UpdateVideoArgs = {
  id: string;
  title?: string;
  description?: string;
  status?: VideoStatus;
  scheduledAt?: Date | null;
  durationSec?: number | null;
};

export const updateVideo: UpdateVideo<UpdateVideoArgs, Video> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const video = await context.entities.Video.findUnique({ where: { id: args.id } });
  if (!video || video.userId !== context.user.id) {
    throw new HttpError(404, 'Video not found');
  }
  if (args.status && !VIDEO_STATUSES.includes(args.status)) {
    throw new HttpError(400, `Unknown status: ${args.status}`);
  }
  return context.entities.Video.update({
    where: { id: args.id },
    data: {
      title: args.title?.trim() || undefined,
      description: args.description?.trim(),
      status: args.status,
      scheduledAt: args.scheduledAt,
      durationSec: args.durationSec,
      publishedAt: args.status === 'PUBLISHED' && !video.publishedAt ? new Date() : undefined,
    },
  });
};

export const deleteVideo: DeleteVideo<{ id: string }, Video> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const video = await context.entities.Video.findUnique({ where: { id } });
  if (!video || video.userId !== context.user.id) {
    throw new HttpError(404, 'Video not found');
  }
  return context.entities.Video.delete({ where: { id } });
};

export const syncChannel: SyncChannel<{ id: string }, Channel> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const channel = await context.entities.Channel.findUnique({ where: { id } });
  if (!channel || channel.userId !== context.user.id) {
    throw new HttpError(404, 'Channel not found');
  }
  try {
    await syncChannelAnalytics(channel, context.entities);
    return context.entities.Channel.update({
      where: { id },
      data: { lastSyncedAt: new Date(), lastSyncError: null },
    });
  } catch (error: any) {
    const message = error?.message ?? 'Unknown sync error';
    await context.entities.Channel.update({
      where: { id },
      data: { lastSyncError: message },
    });
    throw new HttpError(500, `Sync failed: ${message}`);
  }
};
