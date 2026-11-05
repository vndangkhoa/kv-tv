'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { hashPassword } = require('./totp');

const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

/**
 * Helper to format Date as YYYY-MM-DD in UTC/local consistent format.
 * @param {Date} dateObj
 * @returns {string}
 */
function formatDateKey(dateObj = new Date()) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Build the default seed state for the KV-TV Store.
 * @returns {object}
 */
function createInitialStoreData() {
  const now = new Date();

  const apps = [
    {
      id: 'jellyfin-kv',
      name: 'Jellyfin TV',
      edition: 'KV-Optimized Edition',
      packageName: 'org.jellyfin.androidtv.kv',
      version: '0.18.4-kv2',
      size: '42.8 MB',
      shortCode: '88101',
      category: 'Media Center',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Pre-linked to KV Media Server + Direct Play 4K HDR10/Dolby Vision ExoPlayer profile',
      description:
        'Custom Android TV build of Jellyfin with pre-configured KV Media Server discovery, Direct Play 4K HEVC 10-bit profiles, and styled Vietnamese/English subtitles.',
      presetFeatures: [
        'Auto-discovery & pre-filled server URL',
        'Hardware-accelerated ExoPlayer + libVLC fallback',
        'Zero-transcode 4K HEVC 10-bit Direct Play',
        'Vietnamese & English default subtitle styling',
      ],
      color: '#00A4DC',
      iconType: 'jellyfin',
      downloads: 1420,
      rating: '4.9',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: crypto.createHash('sha256').update('jellyfin-kv-0.18.4-kv2').digest('hex'),
      apkFileName: null,
      presetFileName: null,
      updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: 'kodi-kv',
      name: 'Kodi 21 Omega',
      edition: 'KV-Build All-in-One',
      packageName: 'org.xbmc.kodi',
      version: '21.2-kv-build',
      size: '94.5 MB',
      shortCode: '88102',
      category: 'Media Center',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Pre-loaded Arctic Zephyr 2 Leanback Skin + VN Subtitle Addons + RAM Cache Tuned',
      description:
        'Ready-to-run Kodi 21.2 Omega build featuring the lightweight Arctic Zephyr 2 10-foot TV skin, tuned memory cache for 1GB/2GB TV boxes, and pre-installed Vietnamese subtitle addons.',
      presetFeatures: [
        'Arctic Zephyr 2 10-foot TV remote skin pre-activated',
        'advancedsettings.xml tuned for 1GB/2GB RAM TV Boxes',
        'Pre-installed Vietnamese subtitle providers (Subscene/OpenSubtitles)',
        'TorrServer & Elementum streaming buffer optimization',
      ],
      color: '#17B2E7',
      iconType: 'kodi',
      downloads: 2890,
      rating: '4.9',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: crypto.createHash('sha256').update('kodi-kv-21.2-kv-build').digest('hex'),
      apkFileName: null,
      presetFileName: null,
      updatedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: 'cloudstream-kv',
      name: 'CloudStream 3',
      edition: 'KV-PreSetup (Full Repos)',
      packageName: 'com.lagradost.cloudstream3',
      version: '4.4.1-kv',
      size: '24.2 MB',
      shortCode: '88103',
      category: 'Streaming',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Our already-setup build: Vietnamese & Global repositories pre-installed & auto-updated',
      description:
        'Zero manual repository typing required. Ships with MegaRepo and Vietnamese HD movie/anime extensions pre-activated, Cloudflare DoH enabled, and automatic 4K Vietsub stream selection.',
      presetFeatures: [
        'Pre-configured MegaRepo + Vietnamese HD Movie/Anime extensions',
        'Auto-selects 1080p/4K highest-bitrate stream with Vietsub',
        'DNS-over-HTTPS (Cloudflare 1.1.1.1) pre-enabled to bypass ISP blocks',
        'One-click Pre-Set Backup (.backup) restore included',
      ],
      color: '#6366F1',
      iconType: 'cloudstream',
      downloads: 4150,
      rating: '5.0',
      minAndroid: 'Android TV 6.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: crypto.createHash('sha256').update('cloudstream-kv-4.4.1-kv').digest('hex'),
      apkFileName: null,
      presetFileName: null,
      updatedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: 'kv-netflix',
      name: 'KV-Netflix',
      edition: 'TV Remote & 4K HDR Mod',
      packageName: 'vn.kvtv.netflix',
      version: '8.114.0-kv',
      size: '38.6 MB',
      shortCode: '88104',
      category: 'Originals & Cinema',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Works on both certified & uncertified Android TV boxes with full D-Pad navigation',
      description:
        'Engineered for Android TV boxes that fail Netflix certification checks. Provides native D-Pad remote focus navigation without an air-mouse, adaptive Widevine L1/L3 fallback, and 5.1 audio.',
      presetFeatures: [
        'Native D-Pad directional navigation (no air-mouse needed)',
        'Widevine L1/L3 adaptive fallback for uncertified TV boxes',
        'Pre-tuned Dolby Digital Plus 5.1 & HDR10 playback flags',
        'Ultra-fast cold start on Amlogic & Rockchip chips',
      ],
      color: '#E50914',
      iconType: 'netflix',
      downloads: 3680,
      rating: '4.8',
      minAndroid: 'Android TV 7.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: crypto.createHash('sha256').update('kv-netflix-8.114.0-kv').digest('hex'),
      apkFileName: null,
      presetFileName: null,
      updatedAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
    },
    {
      id: 'kv-tube',
      name: 'KV-Tube',
      edition: 'Ad-Free 4K60 + SponsorBlock',
      packageName: 'vn.kvtv.tube',
      version: '24.85-kv',
      size: '19.4 MB',
      shortCode: '88105',
      category: 'Video & Music',
      featured: true,
      preConfigured: true,
      presetSummary:
        'Zero ads, SponsorBlock auto-skip, 4K 60fps HDR VP9/AV1, and Voice Search ready',
      description:
        'Next-gen SmartTube/KV-Tube client for Android TV. Blocks 100% of video and banner ads, automatically skips sponsor reads via SponsorBlock, and unlocks 4K 60fps HDR on any TV box.',
      presetFeatures: [
        '100% Ad-free playback (no pre-roll, mid-roll, or banner ads)',
        'SponsorBlock pre-configured (skips intros, self-promo & sponsor segments)',
        'AV1 & VP9 hardware codec selector for smooth 4K 60fps',
        'Works without Google Play Services on any Android TV box',
      ],
      color: '#FF0033',
      iconType: 'tube',
      downloads: 5920,
      rating: '5.0',
      minAndroid: 'Android TV 6.0+',
      arch: 'Universal (arm64-v8a + armeabi-v7a)',
      sha256: crypto.createHash('sha256').update('kv-tube-24.85-kv').digest('hex'),
      apkFileName: null,
      presetFileName: null,
      updatedAt: new Date(now.getTime() - 12 * 3600000).toISOString(),
    },
  ];

  const ads = [
    {
      id: 'ad-vip-box',
      title: 'KV-TV VIP Box Setup — Turn any Android TV into a 4K Cinema Hub',
      subtitle:
        'Pre-tuned Jellyfin, Kodi 21 Omega, CloudStream Vietsub & Ad-Free 4K60 KV-Tube ready in 60 seconds.',
      badge: 'FEATURED',
      ctaText: 'Explore Pre-Set Apps',
      ctaUrl: '#catalog',
      gradient: 'linear-gradient(135deg, #00A4DC 0%, #6366F1 100%)',
      active: true,
      impressions: 4820,
      clicks: 612,
      createdAt: new Date(now.getTime() - 6 * 86400000).toISOString(),
    },
    {
      id: 'ad-vps-cdn',
      title: 'ThueVPSGiaRe High-Speed VN Edge CDN — 1Gbps Direct APK Downloads',
      subtitle:
        'Hosted on low-latency Vietnam NVMe VPS with instant AFTVnews Downloader short-codes (88101–88105).',
      badge: 'SPONSOR',
      ctaText: 'Test Speed',
      ctaUrl: '/tv',
      gradient: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
      active: true,
      impressions: 3190,
      clicks: 284,
      createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: 'ad-cloudstream-44',
      title: 'CloudStream KV-PreSetup v4.4 Released — All VN Movie Extensions Ready',
      subtitle:
        'Includes pre-loaded MegaRepo, 4K Vietsub auto-selector, and Cloudflare 1.1.1.1 DoH bypass.',
      badge: 'NEW RELEASE',
      ctaText: 'Code: 88103',
      ctaUrl: '/go/88103',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
      active: true,
      impressions: 5410,
      clicks: 890,
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
  ];

  // Generate last 7 days of analytics
  const daily = [];
  const baseStats = [
    { tvViews: 310, webViews: 195, downloads: 184 },
    { tvViews: 345, webViews: 220, downloads: 215 },
    { tvViews: 390, webViews: 260, downloads: 248 },
    { tvViews: 412, webViews: 240, downloads: 269 },
    { tvViews: 468, webViews: 305, downloads: 312 },
    { tvViews: 520, webViews: 342, downloads: 364 },
    { tvViews: 485, webViews: 318, downloads: 339 },
  ];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const stat = baseStats[6 - i];
    daily.push({
      date: formatDateKey(d),
      tvViews: stat.tvViews,
      webViews: stat.webViews,
      downloads: stat.downloads,
    });
  }

  const logs = [
    {
      id: 'evt-seed-1',
      timestamp: new Date(now.getTime() - 18 * 60000).toISOString(),
      event: 'download',
      appId: 'kv-tube',
      appName: 'KV-Tube (apk)',
      deviceType: 'tv',
      ip: '113.161.72.14',
      userAgent: 'Mozilla/5.0 (Linux; Android 11; MIBOX4 Build/RTM3.210722.001) TV Bro/2.0.1',
    },
    {
      id: 'evt-seed-2',
      timestamp: new Date(now.getTime() - 14 * 60000).toISOString(),
      event: 'download',
      appId: 'cloudstream-kv',
      appName: 'CloudStream 3 (apk)',
      deviceType: 'tv',
      ip: '27.72.98.210',
      userAgent: 'AFTVnews Downloader/1.4.4 (Android TV; BRAVIA 4K VH2)',
    },
    {
      id: 'evt-seed-3',
      timestamp: new Date(now.getTime() - 9 * 60000).toISOString(),
      event: 'download',
      appId: 'kv-netflix',
      appName: 'KV-Netflix (apk)',
      deviceType: 'tv',
      ip: '14.232.160.55',
      userAgent: 'Mozilla/5.0 (Linux; Android 12; Chromecast HD) AppleWebKit/537.36',
    },
    {
      id: 'evt-seed-4',
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      event: 'view',
      appId: null,
      appName: 'Catalog View',
      deviceType: 'tv',
      ip: '171.244.18.92',
      userAgent: 'Mozilla/5.0 (Linux; Android 10; Shield Android TV) AppleWebKit/537.36',
    },
    {
      id: 'evt-seed-5',
      timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
      event: 'download',
      appId: 'jellyfin-kv',
      appName: 'Jellyfin TV (preset)',
      deviceType: 'desktop',
      ip: '118.69.54.101',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0.0.0 Safari/537.36',
    },
  ];

  // Default credentials: vndangkhoa / thieugia
  const admin = {
    username: 'vndangkhoa',
    passwordHash: hashPassword('thieugia'),
    totpSecret: 'KVKVTVSTORETWOFASECRETBASE32AABB',
    totpEnabled: true,
    updatedAt: now.toISOString(),
  };

  return {
    storeInfo: {
      name: 'KV-TV App Store',
      domain: 'https://tv.vndns.net',
      downloaderCodePrefix: '88',
      version: '1.0.0',
    },
    categories: ['All', 'Media Center', 'Streaming', 'Originals & Cinema', 'Video & Music'],
    apps,
    ads,
    admin,
    analytics: {
      daily,
      logs,
    },
  };
}

/**
 * Ensure `data/` and `uploads/` directories exist, and seed `data/store.json` if missing or forced.
 * @param {boolean} [force=false]
 * @returns {object} Loaded or newly seeded store object
 */
function ensureSeeded(force = false) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  if (!force && fs.existsSync(STORE_PATH)) {
    try {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.apps) && parsed.admin) {
        return parsed;
      }
    } catch {
      // Fall through to re-seed if file is corrupted
    }
  }

  const initialData = createInitialStoreData();
  fs.writeFileSync(STORE_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  return initialData;
}

module.exports = {
  DATA_DIR,
  UPLOADS_DIR,
  STORE_PATH,
  formatDateKey,
  createInitialStoreData,
  ensureSeeded,
};
