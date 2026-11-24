import type {
  AppItem,
  CatalogResponse,
  UpdatesCheckResponse,
} from '../types';

export async function fetchCatalog(track = false, isTvMode = false): Promise<CatalogResponse> {
  const params = new URLSearchParams();
  if (!track) params.set('track', '0');
  params.set('device', isTvMode ? 'tv' : 'web');
  const res = await fetch(`/api/catalog?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} loading catalog`);
  }
  return res.json();
}

export async function checkUpdatesRemote(payload: {
  storeVersionCode?: number;
  storeVersionName?: string;
  apps?: Array<{
    packageName: string;
    versionCode: number;
    versionName?: string;
    isDebuggable?: boolean;
    signingCertSha256?: string;
  }>;
}): Promise<UpdatesCheckResponse> {
  const res = await fetch('/api/updates/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} checking updates`);
  }
  return res.json();
}

export async function fetchQrSvg(url: string): Promise<string> {
  const res = await fetch(`/api/qr?url=${encodeURIComponent(url)}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} generating QR`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('image/svg+xml')) {
    return res.text();
  }
  const data = await res.json();
  return data.svg || '';
}

export function trackAdClick(adId: string): void {
  fetch(`/api/ads/${encodeURIComponent(adId)}/click`, {
    method: 'POST',
    keepalive: true,
  }).catch(() => {});
}

export function getPrimaryDownloadPath(app: Pick<AppItem, 'id' | 'apkDownloadUrl'>): string {
  return app.apkDownloadUrl || (app.id === 'kv-store' ? '/kv-store.apk' : `/api/download/${app.id}?type=apk`);
}

export function resolveAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tv.vndns.net';
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}
