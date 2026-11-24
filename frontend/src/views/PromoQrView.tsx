import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack, VStack } from '@astryxdesign/core/Layout';
import { Heading, Text } from '@astryxdesign/core/Text';
import { ExternalLink, QrCode } from 'lucide-react';
import { trackAdClick } from '../api/client';
import { pickLocalized, tr } from '../i18n';
import type { AdItem, Lang } from '../types';

interface PromoQrViewProps {
  lang: Lang;
  ads: AdItem[];
  onShowQr: (url: string, title: string) => void;
}

export function PromoQrView({ lang, ads, onShowQr }: PromoQrViewProps) {
  return (
    <VStack gap={5} align="stretch">
      <VStack gap={1}>
        <Heading level={2}>{tr(lang, 'promoTitle')}</Heading>
        <Text size="sm" color="secondary">
          {tr(lang, 'promoSubtitle')}
        </Text>
      </VStack>

      <Grid columns={{ minWidth: 320, repeat: 'fit' }} gap={4}>
        {ads.map((ad) => {
          const title = pickLocalized(ad as unknown as Record<string, unknown>, 'title', lang);
          const subtitle = pickLocalized(ad as unknown as Record<string, unknown>, 'subtitle', lang);
          const cta = pickLocalized(ad as unknown as Record<string, unknown>, 'ctaText', lang) || 'Open';
          const url = ad.targetUrl || 'https://tv.vndns.net';

          return (
            <Card key={ad.id} padding={5}>
              <VStack gap={4} align="stretch" height="100%" justify="between">
                <VStack gap={2} align="stretch">
                  <HStack gap={2} align="center" justify="between">
                    <Badge label={ad.badge || 'PARTNER'} variant="info" />
                  </HStack>
                  <Heading level={3}>{title}</Heading>
                  <Text size="sm" color="secondary">
                    {subtitle}
                  </Text>
                </VStack>

                <HStack gap={2} wrap="wrap">
                  <Button
                    label={cta}
                    variant="primary"
                    size="sm"
                    icon={<ExternalLink size={14} />}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackAdClick(ad.id)}
                  />
                  <Button
                    label={tr(lang, 'btnShowQr')}
                    variant="secondary"
                    size="sm"
                    icon={<QrCode size={14} />}
                    onClick={() => onShowQr(url, title)}
                  />
                </HStack>
              </VStack>
            </Card>
          );
        })}
      </Grid>
    </VStack>
  );
}
