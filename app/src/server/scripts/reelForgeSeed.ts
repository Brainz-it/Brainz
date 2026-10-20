import type { PrismaClient } from '@prisma/client';

// Seeds demo channels, 45 days of analytics, geo breakdowns and a content
// calendar so the Reel Forge cockpit has data to show before any real
// platform credentials are connected. Run with `wasp db seed devSeedReelForge`.
export async function devSeedReelForge(prismaClient: PrismaClient) {
  const user = await prismaClient.user.upsert({
    where: { username: 'reelforge' },
    update: {},
    create: {
      username: 'reelforge',
      email: 'reelforge@example.com',
      isAdmin: true,
    },
  });

  const youtube = await prismaClient.channel.create({
    data: {
      platform: 'YOUTUBE',
      name: 'Brainz Reels',
      handle: '@brainzreels',
      subscriberCount: 12840,
      userId: user.id,
    },
  });
  const instagram = await prismaClient.channel.create({
    data: {
      platform: 'INSTAGRAM',
      name: 'brainz.reels',
      handle: '@brainz.reels',
      subscriberCount: 8630,
      userId: user.id,
    },
  });

  // Deterministic pseudo-random so reseeding gives comparable curves.
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 45; i >= 1; i--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);
    const weekendBoost = [0, 6].includes(date.getUTCDay()) ? 1.4 : 1;
    const growth = 1 + (45 - i) / 60;

    const ytViews = Math.round((900 + rand() * 700) * weekendBoost * growth);
    const ytAvgSec = 38 + rand() * 20;
    await prismaClient.channelDailyStats.create({
      data: {
        channelId: youtube.id,
        date,
        views: ytViews,
        watchTimeMinutes: Math.round((ytViews * ytAvgSec) / 60),
        avgViewDurationSec: Math.round(ytAvgSec),
        likes: Math.round(ytViews * 0.06),
        comments: Math.round(ytViews * 0.008),
        shares: Math.round(ytViews * 0.012),
        subscribersGained: Math.round(5 + rand() * 25),
        followersTotal: 12840 - i * 14,
      },
    });

    const igViews = Math.round((600 + rand() * 500) * weekendBoost * growth);
    const igAvgSec = 22 + rand() * 12;
    await prismaClient.channelDailyStats.create({
      data: {
        channelId: instagram.id,
        date,
        views: igViews,
        watchTimeMinutes: Math.round((igViews * igAvgSec) / 60),
        avgViewDurationSec: Math.round(igAvgSec),
        likes: Math.round(igViews * 0.09),
        comments: Math.round(igViews * 0.01),
        shares: Math.round(igViews * 0.02),
        subscribersGained: Math.round(3 + rand() * 18),
        followersTotal: 8630 - i * 9,
      },
    });
  }

  const geoDate = new Date(today);
  geoDate.setUTCDate(geoDate.getUTCDate() - 1);
  const countries: [string, number][] = [
    ['FR', 0.34],
    ['MA', 0.18],
    ['BE', 0.09],
    ['CA', 0.08],
    ['CH', 0.06],
    ['DZ', 0.06],
    ['TN', 0.05],
    ['US', 0.04],
  ];
  const cities: [string, string, number][] = [
    ['Paris', 'FR', 0.11],
    ['Casablanca', 'MA', 0.08],
    ['Lyon', 'FR', 0.05],
    ['Bruxelles', 'BE', 0.05],
    ['Montréal', 'CA', 0.05],
    ['Marseille', 'FR', 0.04],
    ['Rabat', 'MA', 0.04],
    ['Genève', 'CH', 0.03],
  ];
  for (const channel of [youtube, instagram]) {
    const totalViews = channel.id === youtube.id ? 52000 : 31000;
    for (const [country, share] of countries) {
      await prismaClient.channelGeoStats.create({
        data: {
          channelId: channel.id,
          date: geoDate,
          country,
          city: '',
          views: Math.round(totalViews * share),
          watchTimeMinutes: Math.round(totalViews * share * 0.6),
        },
      });
    }
    for (const [city, country, share] of cities) {
      await prismaClient.channelGeoStats.create({
        data: {
          channelId: channel.id,
          date: geoDate,
          country,
          city,
          views: Math.round(totalViews * share),
          watchTimeMinutes: Math.round(totalViews * share * 0.6),
        },
      });
    }
  }

  const publishedTitles = [
    '5 astuces montage CapCut',
    'Comment j’ai eu 10k vues en 48h',
    'Le hook parfait en 3 secondes',
    'Mes réglages caméra pour les reels',
    'Pourquoi tes vidéos ne percent pas',
    'Transition invisible : tuto complet',
  ];
  for (let i = 0; i < publishedTitles.length; i++) {
    const channel = i % 2 === 0 ? youtube : instagram;
    const publishedAt = new Date(today);
    publishedAt.setUTCDate(publishedAt.getUTCDate() - (i * 6 + 2));
    const views = Math.round(3000 + rand() * 20000);
    await prismaClient.video.create({
      data: {
        channelId: channel.id,
        userId: user.id,
        title: publishedTitles[i],
        status: 'PUBLISHED',
        publishedAt,
        durationSec: Math.round(30 + rand() * 60),
        views,
        likes: Math.round(views * 0.07),
        comments: Math.round(views * 0.009),
        watchTimeMinutes: Math.round((views * 32) / 60),
        avgViewDurationSec: 32,
      },
    });
  }

  const scheduledTitles = [
    'Reel : coulisses de la Reel Forge',
    'Tuto : sous-titres automatiques',
    'Top 3 des hooks qui marchent',
    'Q&A communauté #1',
  ];
  for (let i = 0; i < scheduledTitles.length; i++) {
    const channel = i % 2 === 0 ? youtube : instagram;
    const scheduledAt = new Date(today);
    scheduledAt.setUTCDate(scheduledAt.getUTCDate() + (i * 3 + 2));
    scheduledAt.setUTCHours(18, 0, 0, 0);
    await prismaClient.video.create({
      data: {
        channelId: channel.id,
        userId: user.id,
        title: scheduledTitles[i],
        status: 'SCHEDULED',
        scheduledAt,
        durationSec: Math.round(30 + rand() * 45),
      },
    });
  }

  console.log('Reel Forge demo data seeded: 2 channels, 45 days of stats, geo data and a content calendar.');
}
