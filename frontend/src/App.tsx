import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell } from '@astryxdesign/core/AppShell';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { IconButton } from '@astryxdesign/core/IconButton';
import { HStack, Layout, VStack } from '@astryxdesign/core/Layout';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { useToast } from '@astryxdesign/core/Toast';
import { Token } from '@astryxdesign/core/Token';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { Theme } from '@astryxdesign/core/theme';
import {
  ArrowUpCircle,
  BookOpen,
  Grid3x3,
  Hash,
  Layers,
  Moon,
  QrCode,
  Sparkles,
  Store,
  Sun,
} from 'lucide-react';
import { fetchCatalog, resolveAbsoluteUrl } from './api/client';
import { AppIconGlyph } from './components/AppIconGlyph';
import {
  AppDetailDialog,
  DialerDialog,
  GuideDialog,
  QrCompanionDialog,
} from './components/Dialogs';
import { useSpatialNav } from './hooks/useSpatialNav';
import { useTvBridge } from './hooks/useTvBridge';
import { tr } from './i18n';
import { kvTvTheme } from './theme';
import type {
  AdItem,
  AppItem,
  Lang,
  NavTab,
  UpdateAppEntry,
} from './types';
import { PresetsView } from './views/PresetsView';
import { PromoQrView } from './views/PromoQrView';
import { ShortCodesView } from './views/ShortCodesView';
import { StoreView } from './views/StoreView';
import { UpdatesView } from './views/UpdatesView';

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'vi';
  const saved = window.localStorage.getItem('kvtv_lang');
  if (saved === 'en' || saved === 'vi') return saved;
  return 'vi';
}

function detectInitialColorMode(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('kvtv_mode');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark';
}

export default function App() {
  const showToast = useToast();
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const [colorMode, setColorMode] = useState<'dark' | 'light'>(detectInitialColorMode);
  const [activeTab, setActiveTab] = useState<NavTab>('store');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [apps, setApps] = useState<AppItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'All',
    'Media Center',
    'Streaming',
    'Originals & Cinema',
    'Video & Music',
  ]);
  const [storeVersion, setStoreVersion] = useState<string>('1.1.0');
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [detailApp, setDetailApp] = useState<AppItem | null>(null);
  const [dialerOpen, setDialerOpen] = useState<boolean>(false);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [qrTarget, setQrTarget] = useState<{ url: string; title: string } | null>(null);
  const [updateQueue, setUpdateQueue] = useState<string[]>([]);

  const notify = useCallback(
    (msg: string, kind: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      showToast({
        type: kind === 'error' ? 'error' : 'info',
        body: msg,
        isAutoHide: true,
        autoHideDuration: 3600,
      });
    },
    [showToast]
  );

  const {
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
  } = useTvBridge({ apps, onNotify: notify });

  useSpatialNav(isTvMode);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem('kvtv_lang', lang);
  }, [lang]);

  useEffect(() => {
    window.localStorage.setItem('kvtv_mode', colorMode);
  }, [colorMode]);

  useEffect(() => {
    if (isTvMode) {
      document.documentElement.setAttribute('data-tv-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-tv-mode');
    }
  }, [isTvMode]);

  const loadStoreCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setLoadError(null);
    try {
      const data = await fetchCatalog(true, isTvMode);
      setApps(data.apps || []);
      setAds(data.ads || []);
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
      if (data.storeInfo?.version) {
        setStoreVersion(data.storeInfo.version);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load store catalog');
    } finally {
      setLoadingCatalog(false);
    }
  }, [isTvMode]);

  useEffect(() => {
    loadStoreCatalog();
  }, [loadStoreCatalog]);

  // Wire hardware Android TV BACK button via window.onKVTVBackPress
  const backStateRef = useRef({
    detailApp,
    qrTarget,
    dialerOpen,
    guideOpen,
    activeTab,
  });
  backStateRef.current = {
    detailApp,
    qrTarget,
    dialerOpen,
    guideOpen,
    activeTab,
  };

  useEffect(() => {
    window.onKVTVBackPress = () => {
      const st = backStateRef.current;
      if (st.qrTarget) {
        setQrTarget(null);
        return true;
      }
      if (st.dialerOpen) {
        setDialerOpen(false);
        return true;
      }
      if (st.guideOpen) {
        setGuideOpen(false);
        return true;
      }
      if (st.detailApp) {
        setDetailApp(null);
        return true;
      }
      if (st.activeTab !== 'store') {
        setActiveTab('store');
        return true;
      }
      return false;
    };
    return () => {
      delete window.onKVTVBackPress;
    };
  }, []);

  // Process sequential "Update All" queue on Android TV after each package status refreshes
  useEffect(() => {
    if (!isNative || updateQueue.length === 0) return;
    const anyActive = Object.keys(progressById).length > 0;
    if (anyActive) return;

    const remaining = updateQueue.filter((id) => installedById[id]?.updateAvailable);
    if (remaining.length !== updateQueue.length) {
      setUpdateQueue(remaining);
      return;
    }

    const nextApp = apps.find((a) => a.id === remaining[0]);
    if (nextApp) {
      installOrUpdateApp(nextApp);
    }
  }, [apps, installedById, installOrUpdateApp, isNative, progressById, updateQueue]);

  const handleCopy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        notify(tr(lang, 'copiedToast'), 'success');
      } catch {
        notify(value, 'info');
      }
    },
    [lang, notify]
  );

  const handleCheckUpdates = useCallback(async () => {
    notify(tr(lang, 'checkingToast'), 'info');
    const report = await scanAndCheckUpdates();
    if (report) {
      notify(tr(lang, 'checkedToast'), 'success');
    }
  }, [lang, notify, scanAndCheckUpdates]);

  const handleUpdateAll = useCallback(
    (entries: UpdateAppEntry[]) => {
      const ids = entries.map((e) => e.id).filter(Boolean);
      if (ids.length === 0) return;
      setUpdateQueue(ids);
      const first = apps.find((a) => a.id === ids[0]);
      if (first) installOrUpdateApp(first);
    },
    [apps, installOrUpdateApp]
  );

  const totalUpdates = updatesReport?.totalUpdates || 0;
  const activeDetailRecord = detailApp ? installedById[detailApp.id] : undefined;
  const activeDetailProgress = detailApp ? progressById[detailApp.id] : undefined;

  return (
    <Theme theme={kvTvTheme} mode={colorMode}>
      <AppShell
        variant="wash"
        height="auto"
        topNav={
          <TopNav
            heading={
              <TopNavHeading
                logo={<AppIconGlyph id="kv-store" />}
                heading={tr(lang, 'brandHeading')}
                subheading={`${tr(lang, 'brandSubheading')} · v${storeAppInfo?.versionName || storeVersion}`}
                onClick={() => setActiveTab('store')}
              />
            }
            startContent={
              <>
                <TopNavItem
                  label={tr(lang, 'navStore')}
                  icon={<Store size={16} />}
                  isSelected={activeTab === 'store'}
                  onClick={() => setActiveTab('store')}
                />
                <TopNavItem
                  label={tr(lang, 'navUpdates')}
                  icon={<ArrowUpCircle size={16} />}
                  isSelected={activeTab === 'updates'}
                  onClick={() => setActiveTab('updates')}
                >
                  <HStack gap={1} align="center">
                    <Text size="sm">{tr(lang, 'navUpdates')}</Text>
                    {totalUpdates > 0 && (
                      <Badge label={String(totalUpdates)} variant="warning" />
                    )}
                  </HStack>
                </TopNavItem>
                <TopNavItem
                  label={tr(lang, 'navPresets')}
                  icon={<Layers size={16} />}
                  isSelected={activeTab === 'presets'}
                  onClick={() => setActiveTab('presets')}
                />
                <TopNavItem
                  label={tr(lang, 'navCodes')}
                  icon={<Hash size={16} />}
                  isSelected={activeTab === 'codes'}
                  onClick={() => setActiveTab('codes')}
                />
                <TopNavItem
                  label={tr(lang, 'navPromo')}
                  icon={<Sparkles size={16} />}
                  isSelected={activeTab === 'promo'}
                  onClick={() => setActiveTab('promo')}
                />
              </>
            }
            endContent={
              <HStack gap={1} align="center">
                <IconButton
                  label={tr(lang, 'btnDialer')}
                  variant="secondary"
                  size="sm"
                  tooltip={tr(lang, 'btnDialer')}
                  icon={<Grid3x3 size={15} />}
                  onClick={() => setDialerOpen(true)}
                />
                <IconButton
                  label={tr(lang, 'btnQr')}
                  variant="ghost"
                  size="sm"
                  tooltip={tr(lang, 'btnQr')}
                  className="kvtv-hide-on-mobile"
                  icon={<QrCode size={15} />}
                  onClick={() =>
                    setQrTarget({
                      url: resolveAbsoluteUrl('/kv-store.apk'),
                      title: `KV-Store TV v${storeVersion} (2179554)`,
                    })
                  }
                />
                <IconButton
                  label={tr(lang, 'btnGuide')}
                  variant="ghost"
                  size="sm"
                  tooltip={tr(lang, 'btnGuide')}
                  className="kvtv-hide-on-mobile"
                  icon={<BookOpen size={15} />}
                  onClick={() => setGuideOpen(true)}
                />
                <Button
                  label={lang === 'vi' ? 'VI' : 'EN'}
                  variant="secondary"
                  size="sm"
                  onClick={() => setLang((p) => (p === 'vi' ? 'en' : 'vi'))}
                />
                <IconButton
                  label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  variant="ghost"
                  size="sm"
                  icon={colorMode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  onClick={() => setColorMode((p) => (p === 'dark' ? 'light' : 'dark'))}
                />
              </HStack>
            }
          />
        }
      >
        <Layout
          padding={isTvMode ? 3 : 4}
          contentWidth={1280}
          content={
            <VStack gap={5} align="stretch">
              {loadingCatalog ? (
                <Card padding={6}>
                  <VStack gap={3} align="center">
                    <Spinner size="lg" />
                    <Text size="sm" color="secondary">
                      {lang === 'vi' ? 'Đang tải danh mục KV-Store...' : 'Loading KV-Store catalog...'}
                    </Text>
                  </VStack>
                </Card>
              ) : loadError ? (
                <Banner
                  status="error"
                  title={lang === 'vi' ? 'Lỗi kết nối máy chủ' : 'Catalog Load Failed'}
                  description={loadError}
                  endContent={
                    <Button
                      label={lang === 'vi' ? 'Thử lại' : 'Retry'}
                      variant="primary"
                      size="sm"
                      onClick={loadStoreCatalog}
                    />
                  }
                />
              ) : activeTab === 'store' ? (
                <StoreView
                  lang={lang}
                  apps={apps}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  isNative={isNative}
                  isTvMode={isTvMode}
                  installedById={installedById}
                  progressById={progressById}
                  selfUpdate={selfUpdate}
                  updatesReport={updatesReport}
                  onInstallApp={installOrUpdateApp}
                  onLaunchApp={(a) => launchApp(a.packageName)}
                  onOpenDetails={setDetailApp}
                  onOpenQr={(a) =>
                    setQrTarget({
                      url: resolveAbsoluteUrl(a.apkDownloadUrl),
                      title: `${a.name} v${a.version}`,
                    })
                  }
                  onGoUpdates={() => setActiveTab('updates')}
                />
              ) : activeTab === 'updates' ? (
                <UpdatesView
                  lang={lang}
                  apps={apps}
                  isNative={isNative}
                  canInstallUnknown={canInstallUnknown}
                  checkingUpdates={checkingUpdates}
                  selfUpdate={selfUpdate}
                  updatesReport={updatesReport}
                  installedById={installedById}
                  progressById={progressById}
                  onCheckUpdates={handleCheckUpdates}
                  onInstallApp={installOrUpdateApp}
                  onSelfUpdate={installSelfUpdate}
                  onOpenUnknownSources={openUnknownSourcesSettings}
                  onOpenDetails={setDetailApp}
                  onUpdateAll={handleUpdateAll}
                />
              ) : activeTab === 'presets' ? (
                <PresetsView
                  lang={lang}
                  apps={apps}
                  isNative={isNative}
                  onInstallApp={installOrUpdateApp}
                  onOpenDetails={setDetailApp}
                />
              ) : activeTab === 'codes' ? (
                <ShortCodesView
                  lang={lang}
                  apps={apps}
                  onCopy={handleCopy}
                  onShowQr={(url, title) => setQrTarget({ url, title })}
                  onInstallApp={installOrUpdateApp}
                  onOpenDialer={() => setDialerOpen(true)}
                />
              ) : (
                <PromoQrView
                  lang={lang}
                  ads={ads}
                  onShowQr={(url, title) => setQrTarget({ url, title })}
                />
              )}

              <HStack gap={2} wrap="wrap" align="center" justify="between">
                <Text size="xsm" color="secondary">
                  KV-Store TV v{storeAppInfo?.versionName || storeVersion} · Powered by Astryx Design System
                </Text>
                <HStack gap={2}>
                  <Token label="AFTV 2179554" size="sm" />
                  <Token label="/88000" size="sm" />
                </HStack>
              </HStack>
            </VStack>
          }
        />
      </AppShell>

      <AppDetailDialog
        lang={lang}
        app={detailApp}
        isNative={isNative}
        detail={activeDetailRecord}
        progress={activeDetailProgress}
        onClose={() => setDetailApp(null)}
        onInstallApp={installOrUpdateApp}
        onLaunchApp={(a) => launchApp(a.packageName)}
        onUninstallApp={uninstallApp}
        onCopy={handleCopy}
        onShowQr={(url, title) => setQrTarget({ url, title })}
      />

      <DialerDialog
        lang={lang}
        isOpen={dialerOpen}
        apps={apps}
        onClose={() => setDialerOpen(false)}
        onSelectApp={(a) => setDetailApp(a)}
      />

      <QrCompanionDialog
        lang={lang}
        target={qrTarget}
        onClose={() => setQrTarget(null)}
        onCopy={handleCopy}
      />

      <GuideDialog
        lang={lang}
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </Theme>
  );
}
