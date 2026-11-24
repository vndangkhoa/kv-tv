import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

/**
 * KV-TV Obsidian Theme:
 * Extends Astryx Neutral with Cinema Obsidian 10-foot Android TV dark surfaces
 * (`#0B0D11` canvas, `#131720` surface, `#191F2C` card, `#E50914` primary accent)
 * and a clean daylight light palette for desktop & mobile browsers.
 */
export const kvTvTheme = defineTheme({
  name: 'kv-tv-obsidian',
  extends: neutralTheme,
  tokens: {
    '--color-accent': ['#dc2626', '#e50914'],
    '--color-accent-muted': ['#fee2e2', '#351015'],
    '--color-on-accent': ['#ffffff', '#ffffff'],
    '--color-text-accent': ['#b91c1c', '#ff6b6b'],
    '--color-icon-accent': ['#dc2626', '#ff5258'],
    '--color-background-body': ['#f3f4f7', '#0b0d11'],
    '--color-background-surface': ['#ffffff', '#131720'],
    '--color-background-card': ['#ffffff', '#191f2c'],
    '--color-background-muted': ['#e7eaf1', '#212938'],
    '--color-border': ['#d6dbe5', '#283142'],
    '--color-border-emphasized': ['#8b95a7', '#495670'],
    '--radius-container': '12px',
    '--radius-element': '8px',
  },
});
