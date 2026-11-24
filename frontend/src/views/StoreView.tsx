import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Heading, Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import {
  ArrowDownToLine,
  ArrowUpCircle,
  ExternalLink,
  Info,
  Play,
  QrCode,
  Search,
  Sparkles,
} from 'lucide-react';
import { AppIconGlyph } from '../components/AppIconGlyph';
import { DownloadProgressRow } from '../components/DownloadProgressRow';
import { CATEGORY_LABELS, pickLocalized, tr } from '../i18n';
import type {
  AppItem,
  DownloadProgressState,
  InstalledAppDetail,
  Lang,
  SelfUpdateInfo,
  UpdatesCheckResponse,
} from '../types';

interface StoreViewProps {
  lang: Lang;
  apps: AppItem[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isNative: boolean;
  isTvMode: boolean;
  installedById: Record<string, InstalledAppDetail>;
  progressById: Record<string, DownloadProgressState>;
  selfUpdate: SelfUpdateInfo | null;
  updatesReport: UpdatesCheckResponse | null;
  onInstallApp: (app: AppItem) => void;
  onLaunchApp: (app: AppItem) => void;
  onOpenDetails: (app: AppItem) => void;
  onOpenQr: (app: AppItem) => void;
  onGoUpdates: () => void;
}

export function StoreView({
  lang,
  apps,
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  isNative,
  installedById,
  progressById,
  selfUpdate,
  updatesReport,
  onInstallApp,
  onLaunchApp,
  onOpenDetails,
  onOpenQr,
  onGoUpdates,
}: StoreViewProps) {
  const storeApp = apps.find((a) => a.id === 'kv-store');
  const storeProgress = storeApp ? progressById[storeApp.id] : undefined;
  const totalUpdates = updatesReport?.totalUpdates || 0;

  const filteredApps = apps.filter((app) => {
    const catMatch = selectedCategory === 'All' || app.category === selectedCategory;
    if (!catMatch) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return [
      app.name,
      app.packageName,
      app.shortCode,
      app.aftvCode || '',
      app.category,
      pickLocalized(app as unknown as Record<string, unknown>, 'edition', lang),
      pickLocalized(app as unknown as Record<string, unknown>, 'presetSummary', lang),
    ]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  return (
    <VStack gap={5} align="stretch">
      {(selfUpdate?.updateAvailable || totalUpdates > 0) && (
        <Banner
          status="warning"
          title={
            selfUpdate?.updateAvailable
              ? `${tr(lang, 'updateBannerSelfTitle')} (v${selfUpdate.latestVersionName})`
              : `${tr(lang, 'updateBannerAppsTitle')} (${totalUpdates})`
          }
          description={
            selfUpdate?.updateAvailable
              ? lang === 'vi'
                ? 'Nhấn để nâng cấp KV-Store TV lên phiên bản mới nhất với giao diện Astryx và Trung tâm Cập nhật.'
                : 'Upgrade KV-Store TV in place to get the latest Astryx UI and built-in Updates Center.'
              : lang === 'vi'
                ? 'Đã phát hiện bản mới hoặc bản chính thức mới cho ứng dụng đã cài trên TV.'
                : 'Newer versions or official signed builds are ready for apps installed on this TV.'
          }
          endContent={
            <Button
              label={tr(lang, 'updateBannerBtn')}
              variant="primary"
              size="sm"
              icon={<ArrowUpCircle size={15} />}
              onClick={onGoUpdates}
            />
          }
        />
      )}

      {storeApp && (
        <Card padding={5} className="kvtv-hero-card">
          <HStack gap={5} wrap="wrap" align="center" justify="between">
            <HStack gap={4} align="center" wrap="nowrap">
              <AppIconGlyph id={storeApp.id} iconType={storeApp.iconType} size="lg" />
              <VStack gap={1}>
                <HStack gap={2} align="center" wrap="wrap">
                  <Badge
                    label={`v${storeApp.version}`}
                    variant="red"
                  />
                  <Token label={`AFTV ${storeApp.aftvCode || '2179554'}`} size="sm" />
                  <Token label={`/${storeApp.shortCode}`} size="sm" />
                </HStack>
                <Heading level={2}>{tr(lang, 'heroTitle')}</Heading>
                <Text size="sm" color="secondary" maxLines={2}>
                  {tr(lang, 'heroDesc')}
                </Text>
              </VStack>
            </HStack>

            <HStack gap={2} wrap="wrap" align="center">
              {storeProgress ? (
                <DownloadProgressRow lang={lang} progress={storeProgress} />
              ) : (
                <>
                  <Button
                    label={
                      isNative
                        ? selfUpdate?.updateAvailable
                          ? `${tr(lang, 'btnUpdate')} v${storeApp.version}`
                          : tr(lang, 'btnOpen')
                        : tr(lang, 'heroActionDownload')
                    }
                    variant="primary"
                    size="md"
                    icon={
                      selfUpdate?.updateAvailable ? (
                        <ArrowUpCircle size={16} />
                      ) : (
                        <ArrowDownToLine size={16} />
                      )
                    }
                    onClick={() =>
                      selfUpdate?.updateAvailable || !isNative
                        ? onInstallApp(storeApp)
                        : onOpenDetails(storeApp)
                    }
                  />
                  <Button
                    label={tr(lang, 'heroActionDetails')}
                    variant="secondary"
                    size="md"
                    icon={<Info size={16} />}
                    onClick={() => onOpenDetails(storeApp)}
                  />
                  <Button
                    label={tr(lang, 'btnShowQr')}
                    variant="ghost"
                    size="md"
                    icon={<QrCode size={16} />}
                    onClick={() => onOpenQr(storeApp)}
                  />
                </>
              )}
            </HStack>
          </HStack>
        </Card>
      )}

      <Card padding={4} variant="muted">
        <VStack gap={3} align="stretch">
          <HStack gap={3} wrap="wrap" align="center" justify="between">
            <TextInput
              label={tr(lang, 'searchLabel')}
              isLabelHidden
              value={searchQuery}
              onChange={onSearchChange}
              placeholder={tr(lang, 'searchPlaceholder')}
              startIcon={<Search size={16} />}
              hasClear
              width="min(100%, 400px)"
            />
            <Text size="xsm" color="secondary">
              {filteredApps.length} / {apps.length}{' '}
              {lang === 'vi' ? 'ứng dụng' : 'apps'}
            </Text>
          </HStack>

          <HStack isScrollable className="kvtv-segment-strip">
            <SegmentedControl
              label={tr(lang, 'categoryLabel')}
              value={selectedCategory}
              onChange={onCategoryChange}
              size="sm"
            >
              {categories.map((cat) => (
                <SegmentedControlItem
                  key={cat}
                  value={cat}
                  label={CATEGORY_LABELS[lang]?.[cat] || cat}
                />
              ))}
            </SegmentedControl>
          </HStack>
        </VStack>
      </Card>

      {filteredApps.length === 0 ? (
        <Card padding={6}>
          <VStack gap={2} align="center">
            <Heading level={3}>{tr(lang, 'noAppsFound')}</Heading>
            <Button
              label={lang === 'vi' ? 'Đặt lại bộ lọc' : 'Reset filters'}
              variant="secondary"
              size="sm"
              onClick={() => {
                onSearchChange('');
                onCategoryChange('All');
              }}
            />
          </VStack>
        </Card>
      ) : (
        <Grid columns={{ minWidth: 310, repeat: 'fit' }} gap={4}>
          {filteredApps.map((app) => {
            const detail = installedById[app.id];
            const progress = progressById[app.id];
            const installed = Boolean(detail?.installed);
            const needsUpdate = Boolean(detail?.updateAvailable);
            const sigSwap = Boolean(detail?.signatureMismatch);

            const editionText = pickLocalized(
              app as unknown as Record<string, unknown>,
              'edition',
              lang
            );
            const summaryText = pickLocalized(
              app as unknown as Record<string, unknown>,
              'presetSummary',
              lang
            );

            return (
              <Card key={app.id} padding={4} className="kvtv-app-card">
                <VStack gap={3} align="stretch" height="100%" justify="between">
                  <VStack gap={3} align="stretch">
                    <HStack gap={3} align="start" justify="between">
                      <HStack gap={3} align="center">
                        <AppIconGlyph id={app.id} iconType={app.iconType} />
                        <VStack gap={0}>
                          <Heading level={4}>{app.name}</Heading>
                          <Text size="xsm" color="secondary" maxLines={1}>
                            {editionText}
                          </Text>
                        </VStack>
                      </HStack>

                      {isNative && (
                        needsUpdate ? (
                          <Badge label={tr(lang, 'statusUpdate')} variant="warning" />
                        ) : installed ? (
                          <StatusDot variant="success" label={tr(lang, 'statusInstalled')} />
                        ) : null
                      )}
                    </HStack>

                    <Text size="sm" color="secondary" maxLines={2}>
                      {summaryText}
                    </Text>

                    <HStack gap={2} wrap="wrap" align="center">
                      <Token label={`v${app.version}`} size="sm" />
                      <Token label={app.fileSizeFormatted || app.size} size="sm" />
                      {app.aftvCode ? (
                        <Token
                          label={`AFTV ${app.aftvCode}`}
                          size="sm"
                          icon={<Sparkles size={12} />}
                        />
                      ) : (
                        <Token label={`/${app.shortCode}`} size="sm" />
                      )}
                    </HStack>

                    {sigSwap && (
                      <Text size="xsm" color="accent">
                        {tr(lang, 'statusSignatureSwap')}
                      </Text>
                    )}
                  </VStack>

                  <VStack gap={3} align="stretch">
                    <Divider />
                    {progress ? (
                      <DownloadProgressRow lang={lang} progress={progress} />
                    ) : (
                      <HStack gap={2} wrap="wrap" align="center" justify="between">
                        <HStack gap={2} wrap="wrap">
                          {isNative ? (
                            installed && !needsUpdate ? (
                              <Button
                                label={tr(lang, 'btnOpen')}
                                variant="primary"
                                size="sm"
                                icon={<Play size={14} />}
                                onClick={() => onLaunchApp(app)}
                              />
                            ) : (
                              <Button
                                label={needsUpdate ? tr(lang, 'btnUpdate') : tr(lang, 'btnInstall')}
                                variant="primary"
                                size="sm"
                                icon={
                                  needsUpdate ? (
                                    <ArrowUpCircle size={14} />
                                  ) : (
                                    <ArrowDownToLine size={14} />
                                  )
                                }
                                onClick={() => onInstallApp(app)}
                              />
                            )
                          ) : (
                            <Button
                              label={tr(lang, 'btnDownloadApk')}
                              variant="primary"
                              size="sm"
                              icon={<ArrowDownToLine size={14} />}
                              onClick={() => onInstallApp(app)}
                            />
                          )}

                          <Button
                            label={tr(lang, 'btnDetails')}
                            variant="secondary"
                            size="sm"
                            onClick={() => onOpenDetails(app)}
                          />
                        </HStack>

                        {app.presetUrl && !isNative && (
                          <Button
                            label="Preset"
                            variant="ghost"
                            size="sm"
                            icon={<ExternalLink size={14} />}
                            href={app.presetUrl}
                            target="_blank"
                            rel="noreferrer"
                          />
                        )}
                      </HStack>
                    )}
                  </VStack>
                </VStack>
              </Card>
            );
          })}
        </Grid>
      )}
    </VStack>
  );
}
