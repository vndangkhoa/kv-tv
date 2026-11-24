import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { ArrowDownToLine, CheckCircle2, ExternalLink } from 'lucide-react';
import { AppIconGlyph } from '../components/AppIconGlyph';
import { pickLocalized, pickLocalizedList, tr } from '../i18n';
import type { AppItem, Lang } from '../types';

interface PresetsViewProps {
  lang: Lang;
  apps: AppItem[];
  isNative: boolean;
  onInstallApp: (app: AppItem) => void;
  onOpenDetails: (app: AppItem) => void;
}

export function PresetsView({
  lang,
  apps,
  isNative,
  onInstallApp,
  onOpenDetails,
}: PresetsViewProps) {
  const preconfigured = apps.filter((a) => a.preConfigured);

  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1}>
        <Heading level={2}>{tr(lang, 'presetTitle')}</Heading>
        <Text size="sm" color="secondary">
          {tr(lang, 'presetSubtitle')}
        </Text>
      </VStack>

      <Grid columns={{ minWidth: 340, repeat: 'fit' }} gap={4}>
        {preconfigured.map((app) => {
          const features = pickLocalizedList(
            app as unknown as Record<string, unknown>,
            'presetFeatures',
            lang
          );
          const desc = pickLocalized(
            app as unknown as Record<string, unknown>,
            'description',
            lang
          );
          const notes = pickLocalized(
            app as unknown as Record<string, unknown>,
            'notes',
            lang
          );

          return (
            <Card key={app.id} padding={4}>
              <VStack gap={3} align="stretch" height="100%" justify="between">
                <VStack gap={3} align="stretch">
                  <HStack gap={3} align="center" justify="between">
                    <HStack gap={3} align="center">
                      <AppIconGlyph id={app.id} iconType={app.iconType} />
                      <VStack gap={0}>
                        <Heading level={4}>{app.name}</Heading>
                        <Text size="xsm" color="secondary">
                          v{app.version} · {app.fileSizeFormatted || app.size}
                        </Text>
                      </VStack>
                    </HStack>
                    <Badge label={app.aftvCode || app.shortCode} variant="info" />
                  </HStack>

                  <Text size="sm" color="secondary">
                    {desc}
                  </Text>

                  <List>
                    {features.map((feat, idx) => (
                      <ListItem
                        key={idx}
                        label={feat}
                        startContent={<CheckCircle2 size={15} />}
                      />
                    ))}
                  </List>

                  {notes && (
                    <Text size="xsm" color="accent">
                      {notes}
                    </Text>
                  )}
                </VStack>

                <HStack gap={2} wrap="wrap">
                  <Button
                    label={tr(lang, isNative ? 'btnInstall' : 'btnDownloadApk')}
                    variant="primary"
                    size="sm"
                    icon={<ArrowDownToLine size={14} />}
                    onClick={() => onInstallApp(app)}
                  />
                  <Button
                    label={tr(lang, 'btnDetails')}
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenDetails(app)}
                  />
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
              </VStack>
            </Card>
          );
        })}
      </Grid>

      <HStack gap={2} wrap="wrap">
        <Token label="yt.khoavo.vndns.net" size="sm" />
        <Token label="n.khoavo.vndns.net" size="sm" />
        <Token label="u.khoavo.vndns.net" size="sm" />
        <Token label="tv.vndns.net" size="sm" />
      </HStack>
    </VStack>
  );
}
