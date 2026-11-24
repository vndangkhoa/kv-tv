import { Center } from '@astryxdesign/core/Center';
import {
  Cloud,
  Film,
  MonitorPlay,
  PlayCircle,
  PlaySquare,
  ShieldCheck,
  Tv,
} from 'lucide-react';

interface AppIconGlyphProps {
  id: string;
  iconType?: string;
  size?: 'md' | 'lg';
}

function resolveGlyphClass(id: string, iconType?: string): string {
  if (id === 'kv-store' || iconType === 'store') return 'kvtv-glyph-store';
  if (id === 'jellyfin-kv' || iconType === 'jellyfin') return 'kvtv-glyph-jellyfin';
  if (id === 'kodi-kv' || iconType === 'kodi') return 'kvtv-glyph-kodi';
  if (id === 'cloudstream-kv' || iconType === 'cloudstream') return 'kvtv-glyph-cloudstream';
  if (id === 'kv-netflix' || iconType === 'netflix') return 'kvtv-glyph-netflix';
  if (id === 'smarttube-tv') return 'kvtv-glyph-smarttube';
  if (id === 'kv-tube' || iconType === 'tube') return 'kvtv-glyph-kvtube';
  return 'kvtv-glyph-store';
}

export function AppIconGlyph({ id, iconType, size = 'md' }: AppIconGlyphProps) {
  const tileClass = [
    'kvtv-icon-tile',
    size === 'lg' ? 'kvtv-icon-tile-lg' : '',
    resolveGlyphClass(id, iconType),
  ]
    .filter(Boolean)
    .join(' ');
  const iconPx = size === 'lg' ? 28 : 22;

  const renderIcon = () => {
    if (id === 'kv-store' || iconType === 'store') return <ShieldCheck size={iconPx} />;
    if (id === 'jellyfin-kv' || iconType === 'jellyfin') return <MonitorPlay size={iconPx} />;
    if (id === 'kodi-kv' || iconType === 'kodi') return <Tv size={iconPx} />;
    if (id === 'cloudstream-kv' || iconType === 'cloudstream') return <Cloud size={iconPx} />;
    if (id === 'kv-netflix' || iconType === 'netflix') return <Film size={iconPx} />;
    if (id === 'smarttube-tv') return <PlaySquare size={iconPx} />;
    if (id === 'kv-tube' || iconType === 'tube') return <PlayCircle size={iconPx} />;
    return <Tv size={iconPx} />;
  };

  return <Center className={tileClass}>{renderIcon()}</Center>;
}
