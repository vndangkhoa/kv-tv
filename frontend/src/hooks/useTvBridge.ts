import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { checkUpdatesRemote, getPrimaryDownloadPath, resolveAbsoluteUrl } from '../api/client';
import type {
  AppItem,
  DownloadProgressState,
  InstalledAppDetail,
  InstalledDetailsPayload,
  NativeKVTVBridge,
  SelfUpdateInfo,
  UpdatesCheckResponse,
} from '../types';

declare global {
  interface Window {
    KVTVBridge?: NativeKVTVBridge;
    KVTV?: NativeKVTVBridge;
    onKVTVResume?: () => void;
    onKVTVDownloadProgress?: (
      appId: string,
      percent: number,
      downloadedBytes: number,
      totalBytes: number,
      phase: string
    ) => void;
    onKVTVDownloadComplete?: (appId: string, status?: string) => void;
    onKVTVDownloadError?: (appId: string, message?: string) => void;
    onKVTVBackPress?: () => boolean;
  }
}

function getNativeBridge(): NativeKVTVBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.KVTVBridge || window.KVTV;
}

export interface UseTvBridgeOptions {
  apps: AppItem[];
  onNotify?: (msg: string, kind?: 'info' | 'success' | 'warning' | 'error') => void;
}

export function useTvBridge({ apps, onNotify }: UseTvBridgeOptions) {
  const bridge = getNativeBridge();
  const isNative = Boolean(bridge);

  const isTvMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (bridge) return true;
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('mode') === 'tv') return true;
    const ua = navigator.userAgent || '';
    return /KVTVStore|Android TV|AFT|BRAVIA|MIBOX|SHIELD/i.test(ua);
  }, [bridge]);

  const [storeAppInfo, setStoreAppInfo] = useState<{
    versionName: string;
    versionCode: number;
    canRequestPackageInstalls: boolean;
  } | null>(null);

  const [installedById, setInstalledById] = useState<Record<string, InstalledAppDetail>>({});
  const [canInstallUnknown, setCanInstallUnknown] = useState<boolean>(true);
  const [selfUpdate, setSelfUpdate] = useState<SelfUpdateInfo | null>(null);
  const [updatesReport, setUpdatesReport] = useState<UpdatesCheckResponse | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState<boolean>(false);
  const [progressById, setProgressById] = useState<Record<string, DownloadProgressState>>({});

  const appsRef = useRef<AppItem[]>(apps);
  appsRef.current = apps;
  const onNotifyRef = useRef(onNotify);
  onNotifyRef.current = onNotify;

  const scanAndCheckUpdates = useCallback(async () => {
    const currentApps = appsRef.current;
    if (currentApps.length === 0) return null;

    setCheckingUpdates(true);
    try {
      const native = getNativeBridge();
      if (native) {
        let storeCode = 0;
        let storeName = '';
        try {
          const parsedVer = JSON.parse(native.getStoreAppVersion());
          storeCode = Number(parsedVer.versionCode || 0);
          storeName = String(parsedVer.versionName || '');
          const canReq = parsedVer.canRequestPackageInstalls !== false;
          setCanInstallUnknown(canReq);
          setStoreAppInfo({
            versionName: storeName || '1.1.0',
            versionCode: storeCode || 2,
            canRequestPackageInstalls: canReq,
          });
        } catch {
          // Ignore parse errors
        }

        const catalogPayload = JSON.stringify(
          currentApps.map((a) => ({
            id: a.id,
            packageName: a.packageName,
            versionCode: a.versionCode,
            version: a.version,
            releaseOnly: Boolean(a.releaseOnly),
            signingCertSha256: a.signingCertSha256 || '',
            downloadUrl: getPrimaryDownloadPath(a),
            backupApkUrl: a.backupApkUrl || '',
            sha256: a.sha256 || '',
            fileSizeFormatted: a.fileSizeFormatted || a.size || '',
            changelog_vi: a.changelog_vi || '',
            changelog_en: a.changelog_en || '',
          }))
        );

        let scannedDetails: InstalledDetailsPayload | null = null;
        if (typeof native.getInstalledAppDetails === 'function') {
          try {
            scannedDetails = JSON.parse(
              native.getInstalledAppDetails(catalogPayload)
            ) as InstalledDetailsPayload;
            setCanInstallUnknown(scannedDetails.canRequestPackageInstalls !== false);
            if (scannedDetails.byId) {
              setInstalledById(scannedDetails.byId);
            }
          } catch {
            scannedDetails = null;
          }
        } else {
          // Legacy v1.0.0 KVTVBridge fallback
          try {
            const legacyMap = JSON.parse(native.scanCatalogStatuses(catalogPayload)) as Record<
              string,
              'INSTALLED' | 'UPDATE' | 'NOT_INSTALLED'
            >;
            const nextById: Record<string, InstalledAppDetail> = {};
            for (const app of currentApps) {
              const st = legacyMap[app.packageName] || 'NOT_INSTALLED';
              nextById[app.id] = {
                id: app.id,
                packageName: app.packageName,
                installed: st !== 'NOT_INSTALLED',
                installedVersionCode: 0,
                installedVersionName: st === 'INSTALLED' ? app.version : '?',
                storeVersionCode: app.versionCode,
                storeVersionName: app.version,
                isDebuggable: false,
                signatureMismatch: false,
                updateAvailable: st === 'UPDATE',
                status: st,
              };
            }
            setInstalledById(nextById);
          } catch {
            // Ignore fallback error
          }
        }

        const installedPayload = currentApps
          .map((a) => {
            const detail = scannedDetails?.byId?.[a.id];
            if (!detail || !detail.installed) return null;
            return {
              packageName: detail.installedPackage || detail.packageName || a.packageName,
              versionCode: detail.installedVersionCode || 0,
              versionName: detail.installedVersionName || '',
              isDebuggable: Boolean(detail.isDebuggable),
              signingCertSha256: detail.installedCertSha256 || '',
            };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x));

        const report = await checkUpdatesRemote({
          storeVersionCode: storeCode || undefined,
          storeVersionName: storeName || undefined,
          apps: installedPayload,
        });

        setSelfUpdate(report.selfUpdate);
        setUpdatesReport(report);
        return report;
      }

      // Browser mode: fetch latest release matrix from backend
      const report = await checkUpdatesRemote({});
      setSelfUpdate(report.selfUpdate);
      setUpdatesReport(report);
      return report;
    } catch {
      return null;
    } finally {
      setCheckingUpdates(false);
    }
  }, []);

  useEffect(() => {
    if (apps.length > 0) {
      scanAndCheckUpdates();
    }
  }, [apps, scanAndCheckUpdates]);

  useEffect(() => {
    window.onKVTVResume = () => {
      scanAndCheckUpdates();
    };
    window.onKVTVDownloadProgress = (appId, percent, downloadedBytes, totalBytes, phase) => {
      if (!appId) return;
      setProgressById((prev) => ({
        ...prev,
        [appId]: {
          appId,
          percent: Number(percent || 0),
          downloadedBytes: Number(downloadedBytes || 0),
          totalBytes: Number(totalBytes || 0),
          phase: (phase || 'downloading') as DownloadProgressState['phase'],
        },
      }));
    };
    window.onKVTVDownloadComplete = (appId) => {
      if (!appId) return;
      setProgressById((prev) => ({
        ...prev,
        [appId]: {
          ...(prev[appId] || { downloadedBytes: 0, totalBytes: 0 }),
          appId,
          percent: 100,
          phase: 'installing',
        },
      }));
      setTimeout(() => {
        setProgressById((prev) => {
          const next = { ...prev };
          delete next[appId];
          return next;
        });
        scanAndCheckUpdates();
      }, 2500);
    };
    window.onKVTVDownloadError = (appId, message) => {
      if (!appId) return;
      setProgressById((prev) => {
        const next = { ...prev };
        delete next[appId];
        return next;
      });
      if (message && onNotifyRef.current) {
        onNotifyRef.current(message, 'error');
      }
    };
    return () => {
      delete window.onKVTVResume;
      delete window.onKVTVDownloadProgress;
      delete window.onKVTVDownloadComplete;
      delete window.onKVTVDownloadError;
    };
  }, [scanAndCheckUpdates]);

  const installOrUpdateApp = useCallback((app: Pick<AppItem, 'id' | 'name' | 'packageName' | 'apkDownloadUrl' | 'backupApkUrl' | 'sha256' | 'signingCertSha256'>) => {
    const primaryUrl = resolveAbsoluteUrl(getPrimaryDownloadPath(app));
    const backupUrl = app.backupApkUrl || '';
    const native = getNativeBridge();

    if (native) {
      if (typeof native.installAppWithProgress === 'function') {
        setProgressById((prev) => ({
          ...prev,
          [app.id]: {
            appId: app.id,
            percent: 0,
            downloadedBytes: 0,
            totalBytes: 0,
            phase: 'downloading',
          },
        }));
        native.installAppWithProgress(
          app.id,
          primaryUrl,
          backupUrl,
          app.name,
          app.sha256 || '',
          app.signingCertSha256 || '',
          app.packageName || ''
        );
        return;
      }
      if (typeof native.installAppWithFallback === 'function') {
        native.installAppWithFallback(primaryUrl, backupUrl, app.name);
        return;
      }
      native.installApp(primaryUrl, app.name);
      return;
    }

    // Standard browser APK download trigger
    window.location.assign(getPrimaryDownloadPath(app));
  }, []);

  const installSelfUpdate = useCallback(
    (storeApp?: AppItem) => {
      const targetUrl = resolveAbsoluteUrl(selfUpdate?.downloadUrl || '/kv-store.apk');
      const targetBackup = selfUpdate?.backupUrl || storeApp?.backupApkUrl || '';
      const targetSha = selfUpdate?.sha256 || storeApp?.sha256 || '';
      const targetCert = selfUpdate?.signingCertSha256 || storeApp?.signingCertSha256 || '';
      installOrUpdateApp({
        id: 'kv-store',
        name: 'KV-Store TV',
        packageName: 'net.vndns.tv.store',
        apkDownloadUrl: targetUrl,
        backupApkUrl: targetBackup,
        sha256: targetSha,
        signingCertSha256: targetCert,
      });
    },
    [selfUpdate, installOrUpdateApp]
  );

  const launchApp = useCallback((packageName: string): boolean => {
    const native = getNativeBridge();
    if (!native) return false;
    return native.launchApp(packageName);
  }, []);

  const uninstallApp = useCallback((packageName: string) => {
    const native = getNativeBridge();
    native?.uninstallApp(packageName);
  }, []);

  const openUnknownSourcesSettings = useCallback(() => {
    const native = getNativeBridge();
    native?.openUnknownSourcesSettings?.();
  }, []);

  return {
    isNative,
    isTvMode,
    storeAppInfo,
    installedById,
    canInstallUnknown,
    selfUpdate,
    updatesReport,
    checkingUpdates,
    progressById,
    scanAndCheckUpdates,
    installOrUpdateApp,
    installSelfUpdate,
    launchApp,
    uninstallApp,
    openUnknownSourcesSettings,
  };
}
