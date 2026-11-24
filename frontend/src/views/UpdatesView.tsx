import { useMemo } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Code } from '@astryxdesign/core/Code';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Table } from '@astryxdesign/core/Table';
import type { TableColumn } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import {
  ArrowDownToLine,
  ArrowUpCircle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { AppIconGlyph } from '../components/AppIconGlyph';
import { DownloadProgressRow } from '../components/DownloadProgressRow';
import { pickLocalized, tr } from '../i18n';
import type {
  AppItem,
  DownloadProgressState,
  InstalledAppDetail,
  Lang,
  SelfUpdateInfo,
  UpdateAppEntry,
  UpdatesCheckResponse,
} from '../types';

interface UpdatesViewProps {
  lang: Lang;
  apps: AppItem[];
  isNative: boolean;
  canInstallUnknown: boolean;
  checkingUpdates: boolean;
  selfUpdate: SelfUpdateInfo | null;
  updatesReport: UpdatesCheckResponse | null;
  installedById: Record<string, InstalledAppDetail>;
  progressById: Record<string, DownloadProgressState>;
  onCheckUpdates: () => void;
  onInstallApp: (app: AppItem) => void;
  onSelfUpdate: (storeApp?: AppItem) => void;
  onOpenUnknownSources: () => void;
  onOpenDetails: (app: AppItem) => void;
  onUpdateAll: (entries: UpdateAppEntry[]) => void;
}

export function UpdatesView({
  lang,
  apps,
  isNative,
  canInstallUnknown,
  checkingUpdates,
  selfUpdate,
  updatesReport,
  installedById,
  progressById,
  onCheckUpdates,
  onInstallApp,
  onSelfUpdate,
  onOpenUnknownSources,
  onOpenDetails,
  onUpdateAll,
}: UpdatesViewProps) {
  const appMap = useMemo(() => {
    const map = new Map<string, AppItem>();
    for (const a of apps) map.set(a.id, a);
    return map;
  }, [apps]);

  const storeApp = appMap.get('kv-store');
  const selfProgress = progressById['kv-store'];
  const updatesAvailable = updatesReport?.updatesAvailable || [];
  const upToDate = updatesReport?.upToDate || [];

  const releaseColumns: TableColumn<AppItem & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'name',
        header: lang === 'vi' ? 'Ứng dụng' : 'Application',
        renderCell: (item) => (
          <HStack gap={3} align="center">
            <AppIconGlyph id={item.id} iconType={item.iconType} />
            <VStack gap={0}>
              <Text weight="semibold">{item.name}</Text>
              <Text size="xsm" color="secondary" className="kvtv-mono">
                {item.packageName}
              </Text>
            </VStack>
          </HStack>
        ),
      },
      {
        key: 'version',
        header: tr(lang, 'versionLatest'),
        renderCell: (item) => (
          <VStack gap={1}>
            <HStack gap={1} align="center">
              <Badge label={`v${item.version}`} variant="info" />
              <Text size="xsm" color="secondary">
                #{item.versionCode}
              </Text>
            </HStack>
            <Text size="xsm" color="secondary">
              {item.fileSizeFormatted || item.size}
            </Text>
          </VStack>
        ),
      },
      {
        key: 'changelog',
        header: tr(lang, 'whatsNewTitle'),
        renderCell: (item) => {
          const changelog = pickLocalized(
            item as unknown as Record<string, unknown>,
            'changelog',
            lang
          );
          const summary =
            changelog ||
            pickLocalized(item as unknown as Record<string, unknown>, 'presetSummary', lang);
          return (
            <Text size="xsm" color="secondary" maxLines={2}>
              {summary}
            </Text>
          );
        },
      },
      {
        key: 'sha256',
        header: 'SHA-256 & Code',
        renderCell: (item) => (
          <VStack gap={1}>
            <Code>{item.sha256 ? `${item.sha256.slice(0, 14)}…` : '-'}</Code>
            <Token label={item.aftvCode ? `AFTV ${item.aftvCode}` : `/${item.shortCode}`} size="sm" />
          </VStack>
        ),
      },
      {
        key: 'actions',
        header: lang === 'vi' ? 'Tải xuống' : 'Action',
        align: 'end',
        renderCell: (item) => (
          <HStack gap={2} justify="end">
            <Button
              label={tr(lang, 'btnDownloadApk')}
              variant="primary"
              size="sm"
              icon={<ArrowDownToLine size={14} />}
              onClick={() => onInstallApp(item)}
            />
            <Button
              label={tr(lang, 'btnDetails')}
              variant="secondary"
              size="sm"
              onClick={() => onOpenDetails(item)}
            />
          </HStack>
        ),
      },
    ],
    [lang, onInstallApp, onOpenDetails]
  );

  return (
    <VStack gap={5} align="stretch">
      <HStack gap={4} wrap="wrap" align="center" justify="between">
        <VStack gap={1}>
          <Heading level={2}>{tr(lang, 'updatesTitle')}</Heading>
          <Text size="sm" color="secondary">
            {isNative ? tr(lang, 'updatesSubtitleTv') : tr(lang, 'updatesSubtitleWeb')}
          </Text>
        </VStack>

        <HStack gap={2} wrap="wrap">
          {isNative && updatesAvailable.length > 0 && (
            <Button
              label={`${tr(lang, 'btnUpdateAll')} (${updatesAvailable.length})`}
              variant="primary"
              size="md"
              icon={<ArrowUpCircle size={16} />}
              onClick={() => onUpdateAll(updatesAvailable)}
            />
          )}
          <Button
            label={tr(lang, 'btnCheckUpdates')}
            variant="secondary"
            size="md"
            icon={<RefreshCw size={16} />}
            isLoading={checkingUpdates}
            onClick={onCheckUpdates}
          />
        </HStack>
      </HStack>

      {isNative && !canInstallUnknown && (
        <Banner
          status="warning"
          title={tr(lang, 'updatesPermissionMissing')}
          endContent={
            <Button
              label={tr(lang, 'updatesOpenPermission')}
              variant="primary"
              size="sm"
              onClick={onOpenUnknownSources}
            />
          }
        />
      )}

      {!isNative && (
        <Banner
          status="info"
          title={tr(lang, 'updatesWebBannerTitle')}
          description={tr(lang, 'updatesWebBannerDesc')}
          endContent={
            storeApp ? (
              <Button
                label={`${tr(lang, 'btnDownloadApk')} (v${storeApp.version})`}
                variant="primary"
                size="sm"
                icon={<ArrowDownToLine size={15} />}
                onClick={() => onInstallApp(storeApp)}
              />
            ) : null
          }
        />
      )}

      {storeApp && (
        <Card padding={4} className="kvtv-hero-card">
          <VStack gap={3} align="stretch">
            <HStack gap={4} wrap="wrap" align="center" justify="between">
              <HStack gap={3} align="center">
                <AppIconGlyph id="kv-store" iconType="store" />
                <VStack gap={1}>
                  <HStack gap={2} align="center" wrap="wrap">
                    <Heading level={3}>{tr(lang, 'updatesSelfCardTitle')}</Heading>
                    {selfUpdate?.updateAvailable ? (
                      <Badge label={tr(lang, 'statusUpdate')} variant="warning" />
                    ) : (
                      <Badge label={`v${storeApp.version}`} variant="success" />
                    )}
                  </HStack>
                  <Text size="sm" color="secondary">
                    {selfUpdate?.updateAvailable
                      ? `${tr(lang, 'versionCurrent')}: v${selfUpdate.currentVersionName || '1.0.0'} -> ${tr(lang, 'versionLatest')}: v${selfUpdate.latestVersionName}`
                      : isNative
                        ? tr(lang, 'updatesSelfUpToDate')
                        : `${tr(lang, 'versionLatest')}: v${storeApp.version} (${storeApp.fileSizeFormatted || storeApp.size})`}
                  </Text>
                </VStack>
              </HStack>

              {selfProgress ? (
                <DownloadProgressRow lang={lang} progress={selfProgress} />
              ) : (
                <HStack gap={2}>
                  <Button
                    label={
                      selfUpdate?.updateAvailable || !isNative
                        ? tr(lang, isNative ? 'btnUpdate' : 'btnDownloadApk')
                        : tr(lang, 'btnCheckUpdates')
                    }
                    variant={selfUpdate?.updateAvailable ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() =>
                      selfUpdate?.updateAvailable || !isNative
                        ? onSelfUpdate(storeApp)
                        : onCheckUpdates()
                    }
                  />
                  <Button
                    label={tr(lang, 'btnDetails')}
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenDetails(storeApp)}
                  />
                </HStack>
              )}
            </HStack>

            {pickLocalized(storeApp as unknown as Record<string, unknown>, 'changelog', lang) && (
              <>
                <Divider />
                <Text size="xsm" color="secondary" wordBreak="break-word">
                  {pickLocalized(storeApp as unknown as Record<string, unknown>, 'changelog', lang)}
                </Text>
              </>
            )}
          </VStack>
        </Card>
      )}

      {isNative ? (
        <VStack gap={4} align="stretch">
          <VStack gap={3} align="stretch">
            <HStack gap={2} align="center">
              <Heading level={3}>{tr(lang, 'updatesSectionAvailable')}</Heading>
              <Badge
                label={String(updatesAvailable.length)}
                variant={updatesAvailable.length > 0 ? 'warning' : 'neutral'}
              />
            </HStack>

            {updatesAvailable.length === 0 ? (
              <Card padding={4}>
                <HStack gap={3} align="center">
                  <CheckCircle2 size={20} />
                  <VStack gap={0}>
                    <Text weight="semibold">{tr(lang, 'updatesEmptyTitle')}</Text>
                    <Text size="xsm" color="secondary">
                      {tr(lang, 'updatesEmptyDesc')}
                    </Text>
                  </VStack>
                </HStack>
              </Card>
            ) : (
              <VStack gap={3} align="stretch">
                {updatesAvailable.map((entry) => {
                  const fullApp = appMap.get(entry.id);
                  const prog = progressById[entry.id];
                  const detail = installedById[entry.id];
                  const changelog = lang === 'vi' ? entry.changelog_vi : entry.changelog_en;
                  return (
                    <Card key={entry.id} padding={4}>
                      <VStack gap={3} align="stretch">
                        <HStack gap={4} wrap="wrap" align="center" justify="between">
                          <HStack gap={3} align="center">
                            <AppIconGlyph id={entry.id} iconType={fullApp?.iconType} />
                            <VStack gap={1}>
                              <HStack gap={2} align="center" wrap="wrap">
                                <Heading level={4}>{entry.name}</Heading>
                                <Badge label={`v${entry.installedVersion || '?'} -> v${entry.latestVersion}`} variant="warning" />
                                {entry.signatureMismatch && (
                                  <Badge
                                    label={tr(lang, 'statusSignatureSwap')}
                                    variant="red"
                                  />
                                )}
                              </HStack>
                              <Text size="xsm" color="secondary">
                                {entry.packageName} · {entry.size}
                              </Text>
                            </VStack>
                          </HStack>

                          <HStack gap={2}>
                            {fullApp && (
                              <>
                                <Button
                                  label={tr(lang, 'btnUpdate')}
                                  variant="primary"
                                  size="sm"
                                  icon={<ArrowUpCircle size={15} />}
                                  onClick={() => onInstallApp(fullApp)}
                                />
                                <Button
                                  label={tr(lang, 'btnDetails')}
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => onOpenDetails(fullApp)}
                                />
                              </>
                            )}
                          </HStack>
                        </HStack>

                        {prog && <DownloadProgressRow lang={lang} progress={prog} />}

                        {changelog && (
                          <Text size="xsm" color="secondary">
                            {changelog}
                          </Text>
                        )}
                        {detail?.signatureMismatch && (
                          <HStack gap={2} align="center">
                            <ShieldAlert size={14} />
                            <Text size="xsm" color="accent">
                              {lang === 'vi'
                                ? 'KV-Store sẽ tự mở hộp thoại gỡ bản cũ khác chữ ký trước khi cài bản mới.'
                                : 'KV-Store will prompt to uninstall the incompatible signature before installing the official build.'}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </Card>
                  );
                })}
              </VStack>
            )}
          </VStack>

          {upToDate.length > 0 && (
            <VStack gap={3} align="stretch">
              <HStack gap={2} align="center">
                <Heading level={3}>{tr(lang, 'updatesSectionUpToDate')}</Heading>
                <Badge label={String(upToDate.length)} variant="success" />
              </HStack>
              <Card padding={3}>
                <VStack gap={2} align="stretch">
                  {upToDate.map((u) => {
                    const fullApp = appMap.get(u.id);
                    return (
                      <HStack key={u.id} gap={3} align="center" justify="between">
                        <HStack gap={2} align="center">
                          <StatusDot variant="success" label={u.name} />
                          <Token label={`v${u.latestVersion}`} size="sm" />
                        </HStack>
                        {fullApp && (
                          <Button
                            label={tr(lang, 'btnDetails')}
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenDetails(fullApp)}
                          />
                        )}
                      </HStack>
                    );
                  })}
                </VStack>
              </Card>
            </VStack>
          )}
        </VStack>
      ) : (
        <VStack gap={3} align="stretch">
          <HStack gap={2} align="center">
            <Heading level={3}>{tr(lang, 'updatesSectionCatalog')}</Heading>
            <Badge label={String(apps.length)} variant="neutral" />
          </HStack>
          <Card padding={2}>
            <Table
              data={apps as Array<AppItem & Record<string, unknown>>}
              columns={releaseColumns}
              density="balanced"
              dividers="rows"
              hasHover
            />
          </Card>
        </VStack>
      )}
    </VStack>
  );
}
