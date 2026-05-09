import type { ThemePreset } from '../types';

export interface ThemePresetMeta {
  id: ThemePreset;
  name: { zh: string; en: string };
  /** UI 上显示的色片（accent 主色） */
  accentSwatch: string;
  /** 简短描述，可空 */
  description?: { zh: string; en: string };
}

export const THEME_PRESETS: ThemePresetMeta[] = [
  {
    id: 'default',
    name: { zh: '默认',     en: 'Default' },
    accentSwatch: '#3b82f6',
  },
  {
    id: 'miku',
    name: { zh: 'Miku 青',  en: 'Miku' },
    accentSwatch: '#39C5BB',
    description: {
      zh: '以 #39C5BB 为主色的青绿调',
      en: 'Teal palette built around #39C5BB',
    },
  },
];

export function isKnownPreset(p: string): boolean {
  return THEME_PRESETS.some((x) => x.id === p);
}
