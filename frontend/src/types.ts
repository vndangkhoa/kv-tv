export type Lang = 'vi' | 'en';

export type NavTab = 'store' | 'updates' | 'presets' | 'codes' | 'promo';

export type InstallStatus = 'NOT_INSTALLED' | 'UPDATE' | 'INSTALLED';

export interface AppItem {
  id: string;
  name: string;
  edition?: string;
  edition_vi?: string;
  edition_en?: string;
  packageName: string;
  version: string;
  versionCode: number;
  releaseOnly?: boolean;
  size: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  shortCode: string;
  shortPath: string;
  ultraShortPath?: string;
  aftvCode?: string | null;
  category: string;
  featured?: boolean;
  preConfigured?: boolean;
  presetSummary?: string;
  presetSummary_vi?: string;
  presetSummary_en?: string;
  description?: string;
  description_vi?: string;
  description_en?: string;
  notes_vi?: string;
  notes_en?: string;
  changelog_vi?: string;
  changelog_en?: string;
  presetFeatures?: string[];
  presetFeatures_vi?: string[];
  presetFeatures_en?: string[];
  color?: string;
  iconType?: string;
  downloads?: number;
  rating?: string;
  minAndroid?: string;
  arch?: string;
  sha256: string;
  signingCertSha256?: string;
  apkFileName: string;
  apkUrl?: string;
  backupApkUrl?: string;
  apkDownloadUrl: string;
  primaryApkUrl?: string;
  fallbackDownloadUrl?: string;
  presetUrl?: string | null;
  hasPrimaryVpsFile?: boolean;
  updatedAt?: string;
}

export interface AdItem {
  id: string;
  badge?: string;
  title?: string;
  title_vi?: string;
  title_en?: string;
  subtitle?: string;
  subtitle_vi?: string;
  subtitle_en?: string;
  ctaText?: string;
  ctaText_vi?: string;
  ctaText_en?: string;
  targetUrl?: string;
  active?: boolean;
  color?: string;
}

export interface CatalogResponse {
  storeInfo: {
    name: string;
    domain: string;
    downloaderCodePrefix?: string;
    version?: string;
  };
  suggestedLang?: Lang;
  clientCountry?: string;
  apps: AppItem[];
  ads: AdItem[];
  categories: string[];
}

export interface InstalledAppDetail {
  id: string;
  packageName: string;
  installed: boolean;
  installedPackage?: string;
  installedVersionCode: number;
  installedVersionName: string;
  storeVersionCode: number;
  storeVersionName: string;
  isDebuggable: boolean;
  installedCertSha256?: string;
  expectedCertSha256?: string;
  signatureMismatch: boolean;
  updateAvailable: boolean;
  status: InstallStatus;
}

export interface InstalledDetailsPayload {
  canRequestPackageInstalls: boolean;
  apps: Record<string, InstalledAppDetail>;
  byId: Record<string, InstalledAppDetail>;
}

export interface SelfUpdateInfo {
  id: string;
  packageName: string;
  currentVersionCode: number | null;
  currentVersionName: string | null;
  latestVersionCode: number;
  latestVersionName: string;
  updateAvailable: boolean;
  downloadUrl: string;
  backupUrl?: string | null;
  sha256?: string | null;
  signingCertSha256?: string;
  size?: string;
  fileSizeFormatted?: string;
  changelog_vi?: string;
  changelog_en?: string;
  canRequestPackageInstalls?: boolean;
}

export interface UpdateAppEntry {
  id: string;
  name: string;
  packageName: string;
  installedPackage?: string;
  installedVersion?: string;
  installedVersionCode?: number;
  isDebuggable?: boolean;
  installedCertSha256?: string;
  latestVersion: string;
  latestVersionCode: number;
  releaseOnly?: boolean;
  expectedCertSha256?: string;
  signatureMismatch?: boolean;
  debuggableUpgrade?: boolean;
  versionUpgrade?: boolean;
  updateAvailable?: boolean;
  reason?: string;
  size: string;
  sha256: string;
  shortCode: string;
  aftvCode?: string | null;
  apkDownloadUrl: string;
  backupApkUrl?: string | null;
  changelog_vi?: string;
  changelog_en?: string;
  notes_vi?: string;
  notes_en?: string;
  updatedAt?: string | null;
}

export interface UpdatesCheckResponse {
  ok: boolean;
  checkedAt: string;
  storeVersion: string;
  storeVersionCode: number;
  selfUpdate: SelfUpdateInfo;
  updatesAvailable: UpdateAppEntry[];
  upToDate: UpdateAppEntry[];
  notInstalled: UpdateAppEntry[];
  totalUpdates: number;
}

export interface DownloadProgressState {
  appId: string;
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  phase: 'downloading' | 'fallback' | 'verifying' | 'permission_required' | 'uninstalling_old' | 'installing' | 'done' | 'error';
  message?: string;
}

export interface NativeKVTVBridge {
  checkApp(packageName: string, storeVersionCode: number): string;
  scanCatalogStatuses(catalogJsonStr: string): string;
  getInstalledAppDetails?(catalogJsonStr: string): string;
  checkSelfUpdate?(catalogJsonStr: string): string;
  openUnknownSourcesSettings?(): boolean;
  cleanTempApks(): number;
  preConfigureApp(packageName: string): boolean;
  installApp(downloadUrl: string, appName: string): void;
  installAppWithFallback?(downloadUrl: string, backupUrl: string, appName: string): void;
  installAppWithProgress?(
    appId: string,
    downloadUrl: string,
    backupUrl: string,
    appName: string,
    expectedSha256: string,
    expectedCertSha256: string,
    targetPackageName: string
  ): void;
  uninstallApp(packageName: string): void;
  launchApp(packageName: string): boolean;
  getStoreAppVersion(): string;
  isTV(): boolean;
  showToast(message: string): void;
}
