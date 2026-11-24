import { useMemo } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Code } from '@astryxdesign/core/Code';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Table } from '@astryxdesign/core/Table';
import type { TableColumn } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { ArrowDownToLine, Copy, Grid3x3, QrCode } from 'lucide-react';
import { AppIconGlyph } from '../components/AppIconGlyph';
import { resolveAbsoluteUrl } from '../api/client';
import { tr } from '../i18n';
import type { AppItem, Lang } from '../types';

interface ShortCodesViewProps {
  lang: Lang;
  apps: AppItem[];
  onCopy: (value: string) => void;
  onShowQr: (url: string, title: string) => void;
  onInstallApp: (app: AppItem) => void;
  onOpenDialer: () => void;
}

export function ShortCodesView({
  lang,
  apps,
  onCopy,
  onShowQr,
  onInstallApp,
  onOpenDialer,
}: ShortCodesViewProps) {
  const columns: TableColumn<AppItem & Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'app',
        header: lang === 'vi' ? 'Ứng dụng' : 'App',
        renderCell: (item) => (
          <HStack gap={3} align="center">
            <AppIconGlyph id={item.id} iconType={item.iconType} />
            <VStack gap={0}>
              <Text weight="semibold">{item.name}</Text>
              <Text size="xsm" color="secondary">
                v{item.version} · {item.fileSizeFormatted || item.size}
              </Text>
            </VStack>
          </HStack>
        ),
      },
      {
        key: 'aftv',
        header: 'AFTVnews Code',
        renderCell: (item) =>
          item.aftvCode ? (
            <Badge label={item.aftvCode} variant="red" />
          ) : (
            <Badge label={item.shortCode} variant="neutral" />
          ),
      },
      {
        key: 'shortUrl',
        header: lang === 'vi' ? 'Liên kết rút gọn' : 'Short URLs',
        renderCell: (item) => (
          <VStack gap={1}>
            <Code>{item.shortPath}</Code>
            {item.ultraShortPath && (
              <Token label={item.ultraShortPath} size="sm" />
            )}
          </VStack>
        ),
      },
      {
        key: 'actions',
        header: lang === 'vi' ? 'Thao tác' : 'Actions',
        align: 'end',
        renderCell: (item) => {
          const shortHref = resolveAbsoluteUrl(`/${item.shortCode}`);
          return (
            <HStack gap={2} justify="end" wrap="wrap">
              <Button
                label={tr(lang, 'btnCopyUrl')}
                variant="ghost"
                size="sm"
                icon={<Copy size={14} />}
                onClick={() => onCopy(shortHref)}
              />
              <Button
                label={tr(lang, 'btnShowQr')}
                variant="secondary"
                size="sm"
                icon={<QrCode size={14} />}
                onClick={() => onShowQr(shortHref, `${item.name} (${item.aftvCode || item.shortCode})`)}
              />
              <Button
                label={tr(lang, 'btnDownloadApk')}
                variant="primary"
                size="sm"
                icon={<ArrowDownToLine size={14} />}
                onClick={() => onInstallApp(item)}
              />
            </HStack>
          );
        },
      },
    ],
    [lang, onCopy, onInstallApp, onShowQr]
  );

  return (
    <VStack gap={5} align="stretch">
      <HStack gap={4} wrap="wrap" align="center" justify="between">
        <VStack gap={1}>
          <Heading level={2}>{tr(lang, 'codesTitle')}</Heading>
          <Text size="sm" color="secondary">
            {tr(lang, 'codesSubtitle')}
          </Text>
        </VStack>
        <Button
          label={tr(lang, 'btnDialer')}
          variant="primary"
          size="md"
          icon={<Grid3x3 size={16} />}
          onClick={onOpenDialer}
        />
      </HStack>

      <Card padding={2}>
        <Table
          data={apps as Array<AppItem & Record<string, unknown>>}
          columns={columns}
          density="balanced"
          dividers="rows"
          hasHover
        />
      </Card>
    </VStack>
  );
}
