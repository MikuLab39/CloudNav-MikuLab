import type { SiteSettings, ThemeSettings } from '../types';

export function defaultTheme(): ThemeSettings {
  return {
    mode: 'light',
    preset: 'default',
    background: { enabled: false, blur: 8, opacity: 0.35, position: 'cover' },
    overrides: {},
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  title: 'MikuLab-Nav',
  navTitle: 'MikuLab-Nav',
  favicon: '',
  cardStyle: 'detailed',
  requirePasswordOnVisit: false,
  passwordExpiryDays: 7,
  theme: defaultTheme(),
};

/** 兜底 / 兼容老配置；调用点禁止再写局部默认值 */
export function normalizeSiteSettings(s?: Partial<SiteSettings> | null): SiteSettings {
  const base = DEFAULT_SITE_SETTINGS;
  const t = s?.theme;
  return {
    title:                  s?.title || base.title,
    navTitle:               s?.navTitle || base.navTitle,
    favicon:                s?.favicon ?? base.favicon,
    cardStyle:              s?.cardStyle || base.cardStyle,
    requirePasswordOnVisit: s?.requirePasswordOnVisit ?? base.requirePasswordOnVisit,
    passwordExpiryDays:     s?.passwordExpiryDays ?? base.passwordExpiryDays,
    theme: t
      ? {
          mode:   (t.mode as ThemeSettings['mode']) ?? 'light',
          preset: t.preset ?? 'default',
          background: {
            enabled:  t.background?.enabled ?? false,
            url:      t.background?.url ?? '',
            blur:     clampNum(t.background?.blur, 0, 30, 8),
            opacity:  clampNum(t.background?.opacity, 0, 1, 0.35),
            position: t.background?.position ?? 'cover',
          },
          overrides: t.overrides ?? {},
        }
      : defaultTheme(),
  };
}

function clampNum(v: number | undefined, lo: number, hi: number, fallback: number): number {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return Math.max(lo, Math.min(hi, v));
}
