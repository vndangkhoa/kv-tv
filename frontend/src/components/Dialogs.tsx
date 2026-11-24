import { useEffect, useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Center } from '@astryxdesign/core/Center';
import { Code } from '@astryxdesign/core/Code';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Token } from '@astryxdesign/core/Token';
import {
  ArrowDownToLine,
  CheckCircle2,
  Copy,
  Delete,
  ExternalLink,
  Play,
  QrCode,
  Trash2,
} from 'lucide-react';
import { fetchQrSvg, getPrimaryDownloadPath, resolveAbsoluteUrl } from '../api/client';
import { AppIconGlyph } from './AppIconGlyph';
import { DownloadProgressRow } from './DownloadProgressRow';
import { pickLocalized, pickLocalizedList, tr } from '../i18n';
import type {
  AppItem,
  DownloadProgressState,
  InstalledAppDetail,
  Lang,
} from '../types';

interface AppDetailDialogProps {
  lang: Lang;
  app: AppItem | null;
  isNative: boolean;
  detail?: InstalledAppDetail;
  progress?: DownloadProgressState;
  onClose: () => void;
  onInstallApp: (app: AppItem) => void;
  onLaunchApp: (app: AppItem) => void;
  onUninstallApp: (pkg: string) => void;
  onCopy: (val: string) => void;
  onShowQr: (url: string, title: string) => void;
}

export function AppDetailDialog({
  lang,
  app,
  isNative,
  detail,
  progress,
  onClose,
  onInstallApp,
  onLaunchApp,
  onUninstallApp,
  onCopy,
  onShowQr,
}: AppDetailDialogProps) {
  if (!app) return null;

  const edition = pickLocalized(app as unknown as Record<string, unknown>, 'edition', lang);
  const desc = pickLocalized(app as unknown as Record<string, unknown>, 'description', lang);
  const changelog = pickLocalized(app as unknown as Record<string, unknown>, 'changelog', lang);
  const notes = pickLocalized(app as unknown as Record<string, unknown>, 'notes', lang);
  const features = pickLocalizedList(
    app as unknown as Record<string, unknown>,
    'presetFeatures',
    lang
  );
  const downloadUrl = resolveAbsoluteUrl(getPrimaryDownloadPath(app));

  return (
    <Dialog
      isOpen={Boolean(app)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={680}
      maxHeight="88vh"
      padding={5}
      purpose="info"
    >
      <VStack gap={4} align="stretch">
        <DialogHeader
          title={app.name}
          subtitle={`${edition} · v${app.version} (${app.fileSizeFormatted || app.size})`}
          startContent={<AppIconGlyph id={app.id} iconType={app.iconType} />}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        />

        <HStack gap={2} wrap="wrap" align="center">
          <Badge label={`AFTV ${app.aftvCode || app.shortCode}`} variant="red" />
          <Token label={`/${app.shortCode}`} size="sm" />
          <Token label={app.minAndroid || 'Android TV'} size="sm" />
          <Token label={app.arch || 'Universal'} size="sm" />
          {detail?.installed && (
            <Badge
              label={
                detail.updateAvailable
                  ? `${tr(lang, 'statusUpdate')} (${detail.installedVersionName || detail.installedVersionCode} -> ${app.version})`
                  : `${tr(lang, 'statusInstalled')} (${detail.installedVersionName || app.version})`
              }
              variant={detail.updateAvailable ? 'warning' : 'success'}
            />
          )}
        </HStack>

        <Text size="sm" color="secondary">
          {desc}
        </Text>

        {notes && (
          <Banner
            status={app.id === 'smarttube-tv' ? 'warning' : 'info'}
            title={app.id === 'smarttube-tv' ? tr(lang, 'smartTubeNoteTitle') : tr(lang, 'btnGuide')}
            description={notes}
          />
        )}

        {changelog && (
          <Card padding={3} variant="muted">
            <VStack gap={1} align="stretch">
              <Text size="xsm" weight="semibold">
                {tr(lang, 'whatsNewTitle')} (v{app.version})
              </Text>
              <Text size="xsm" color="secondary" wordBreak="break-word">
                {changelog}
              </Text>
            </VStack>
          </Card>
        )}

        {features.length > 0 && (
          <List>
            {features.map((f, idx) => (
              <ListItem key={idx} label={f} startContent={<CheckCircle2 size={15} />} />
            ))}
          </List>
        )}

        <Divider />

        <VStack gap={1} align="stretch">
          <Text size="xsm" color="secondary">
            Package: <Code>{app.packageName}</Code>
          </Text>
          <Text size="xsm" color="secondary" wordBreak="break-all">
            SHA-256: <Code>{app.sha256}</Code>
          </Text>
        </VStack>

        {progress && <DownloadProgressRow lang={lang} progress={progress} />}

        <HStack gap={2} wrap="wrap" justify="between" align="center">
          <HStack gap={2} wrap="wrap">
            {isNative && detail?.installed && !detail?.updateAvailable ? (
              <Button
                label={tr(lang, 'btnOpen')}
                variant="primary"
                size="md"
                icon={<Play size={16} />}
                onClick={() => onLaunchApp(app)}
              />
            ) : (
              <Button
                label={
                  isNative
                    ? detail?.updateAvailable
                      ? tr(lang, 'btnUpdate')
                      : tr(lang, 'btnInstall')
                    : tr(lang, 'btnDownloadApk')
                }
                variant="primary"
                size="md"
                icon={<ArrowDownToLine size={16} />}
                onClick={() => onInstallApp(app)}
              />
            )}

            {app.backupApkUrl && !isNative && (
              <Button
                label={tr(lang, 'btnBackupDownload')}
                variant="secondary"
                size="md"
                icon={<ExternalLink size={15} />}
                href={app.backupApkUrl}
                target="_blank"
                rel="noreferrer"
              />
            )}

            <Button
              label={tr(lang, 'btnShowQr')}
              variant="secondary"
              size="md"
              icon={<QrCode size={15} />}
              onClick={() => onShowQr(downloadUrl, `${app.name} v${app.version}`)}
            />

            <Button
              label={tr(lang, 'btnCopyUrl')}
              variant="ghost"
              size="md"
              icon={<Copy size={15} />}
              onClick={() => onCopy(downloadUrl)}
            />
          </HStack>

          <HStack gap={2}>
            {isNative && detail?.installed && (
              <Button
                label={tr(lang, 'btnUninstall')}
                variant="destructive"
                size="md"
                icon={<Trash2 size={15} />}
                onClick={() => onUninstallApp(detail.installedPackage || app.packageName)}
              />
            )}
            <Button label={tr(lang, 'btnClose')} variant="ghost" size="md" onClick={onClose} />
          </HStack>
        </HStack>
      </VStack>
    </Dialog>
  );
}

interface DialerDialogProps {
  lang: Lang;
  isOpen: boolean;
  apps: AppItem[];
  onClose: () => void;
  onSelectApp: (app: AppItem) => void;
}

export function DialerDialog({
  lang,
  isOpen,
  apps,
  onClose,
  onSelectApp,
}: DialerDialogProps) {
  const [code, setCode] = useState('88');

  const matched = apps.find(
    (a) =>
      a.shortCode === code ||
      a.aftvCode === code ||
      a.ultraShortPath?.endsWith(`/${code}`)
  );

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '<-'];

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={460}
      padding={5}
      purpose="form"
    >
      <VStack gap={4} align="stretch">
        <DialogHeader
          title={tr(lang, 'dialerTitle')}
          subtitle={tr(lang, 'dialerSubtitle')}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        />

        <TextInput
          label="Downloader Code"
          isLabelHidden
          value={code}
          onChange={setCode}
          placeholder="88000 / 2179554"
          hasClear
          onEnter={() => {
            if (matched) {
              onSelectApp(matched);
              onClose();
            }
          }}
        />

        <Grid columns={3} gap={2}>
          {digits.map((d) => (
            <Button
              key={d}
              label={d === '<-' ? 'Del' : d}
              variant="secondary"
              size="lg"
              icon={d === '<-' ? <Delete size={15} /> : undefined}
              onClick={() => {
                if (d === 'C') setCode('');
                else if (d === '<-') setCode((p) => p.slice(0, -1));
                else setCode((p) => (p.length < 8 ? `${p}${d}` : p));
              }}
            />
          ))}
        </Grid>

        <HStack gap={2} wrap="wrap">
          {apps.map((a) => (
            <Token
              key={a.id}
              label={`${a.shortCode} · ${a.name}`}
              size="sm"
              onClick={() => {
                setCode(a.shortCode);
                onSelectApp(a);
                onClose();
              }}
            />
          ))}
        </HStack>

        <HStack justify="between" align="center">
          <Text size="xsm" color={matched ? 'accent' : 'secondary'}>
            {matched
              ? `${matched.name} v${matched.version}`
              : lang === 'vi'
                ? 'Nhập 0–6, 88000–88106 hoặc mã 7 số'
                : 'Enter 0–6, 88000–88106 or 7-digit AFTV code'}
          </Text>
          <Button
            label={tr(lang, 'btnClose')}
            variant="ghost"
            size="sm"
            onClick={onClose}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}

interface QrCompanionDialogProps {
  lang: Lang;
  target: { url: string; title: string } | null;
  onClose: () => void;
  onCopy: (val: string) => void;
}

export function QrCompanionDialog({
  lang,
  target,
  onClose,
  onCopy,
}: QrCompanionDialogProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!target) {
      setSvgMarkup('');
      return;
    }
    let alive = true;
    setLoading(true);
    fetchQrSvg(target.url)
      .then((svg) => {
        if (alive) setSvgMarkup(svg);
      })
      .catch(() => {
        if (alive) setSvgMarkup('');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [target]);

  if (!target) return null;

  return (
    <Dialog
      isOpen={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={420}
      padding={5}
      purpose="info"
    >
      <VStack gap={4} align="stretch">
        <DialogHeader
          title={tr(lang, 'qrTitle')}
          subtitle={target.title}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        />

        <Center padding={2}>
          {loading ? (
            <Spinner size="lg" />
          ) : (
            <Center className="kvtv-qr-frame">
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`}
                alt={target.title}
              />
            </Center>
          )}
        </Center>

        <Code>{target.url}</Code>

        <HStack justify="end" gap={2}>
          <Button
            label={tr(lang, 'btnCopyUrl')}
            variant="secondary"
            size="sm"
            icon={<Copy size={14} />}
            onClick={() => onCopy(target.url)}
          />
          <Button label={tr(lang, 'btnClose')} variant="primary" size="sm" onClick={onClose} />
        </HStack>
      </VStack>
    </Dialog>
  );
}

interface GuideDialogProps {
  lang: Lang;
  isOpen: boolean;
  onClose: () => void;
}

export function GuideDialog({ lang, isOpen, onClose }: GuideDialogProps) {
  const stepsVi = [
    'Mở Google Play / CH Play trên Android TV → cài ứng dụng Downloader by AFTVnews.',
    'Bật Tùy chọn nhà phát triển → cho phép Downloader cài ứng dụng không rõ nguồn gốc.',
    'Mở Downloader → nhập 2179554 (hoặc tv.vndns.net/0) để cài KV-Store TV v1.1.0.',
    'Trong KV-Store TV, mở tab Cập nhật để quét và nâng cấp 1-chạm tất cả ứng dụng trên TV.',
  ];
  const stepsEn = [
    'Install Downloader by AFTVnews from Google Play on your Android TV or Google TV.',
    'Enable Unknown Sources permission for Downloader in Android TV Settings → Security.',
    'Enter 2179554 (or tv.vndns.net/0) to install KV-Store TV v1.1.0 directly.',
    'Open the Updates tab in KV-Store TV anytime to scan installed packages and update in 1 click.',
  ];
  const items = lang === 'vi' ? stepsVi : stepsEn;

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={560}
      padding={5}
      purpose="info"
    >
      <VStack gap={4} align="stretch">
        <DialogHeader
          title={tr(lang, 'guideTitle')}
          subtitle="tv.vndns.net · Downloader 2179554"
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        />
        <List>
          {items.map((step, i) => (
            <ListItem
              key={i}
              label={`${i + 1}. ${step}`}
              startContent={<Badge label={String(i + 1)} variant="red" />}
            />
          ))}
        </List>
        <HStack justify="end">
          <Button label={tr(lang, 'btnClose')} variant="primary" size="sm" onClick={onClose} />
        </HStack>
      </VStack>
    </Dialog>
  );
}
