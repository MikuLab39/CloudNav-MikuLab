export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  categoryId: string;
  createdAt: number;
  order?: number; // Sort order within a category
  pinned?: boolean; // New field for pinning
  pinnedOrder?: number; // Field for pinned link sorting order
}

export interface Category {
  id: string;
  name: string; // Legacy/default display name, kept for stored data and integrations.
  nameZh?: string;
  nameEn?: string;
  icon: string; // Lucide icon name or emoji
  protected?: boolean; // 使用导航统一锁保护该分类内容
  /** @deprecated Legacy per-category password, migrated to protected. */
  password?: string;
  /** @deprecated Legacy full-site category lock, migrated to protected. */
  requireAuth?: boolean;
}

export interface SiteSettings {
  title: string;
  navTitle: string;
  favicon: string;
  cardStyle: 'detailed' | 'simple';
  requirePasswordOnVisit: boolean;
  passwordExpiryDays: number; // 密码过期天数，0表示永久不退出
  theme?: ThemeSettings;
}

export type ThemeMode = 'light' | 'dark' | 'system';

/** 字符串字面量留出 string 通配，方便日后追加预设而不破坏 TS 调用点 */
export type ThemePreset = 'default' | 'miku' | 'auto' | string;

export interface ThemeBackground {
  enabled: boolean;
  /** @deprecated 兼容旧数据，normalize 时自动迁移到 urlDark */
  url?: string; // base64 data URI 或外链
  urlLight?: string; // 浅色 / system-light 使用
  urlDark?: string; // 深色 / system-dark 使用
  blur?: number; // 0-30 px
  opacity?: number; // 0-1，UI 文案"图片显示度"，越大图越显
  position?: 'cover' | 'contain' | 'tile'; // 'tile' 预留，UI 暂不暴露
}

export interface ThemeSettings {
  mode: ThemeMode;
  preset: ThemePreset;
  background?: ThemeBackground;
  /** 预留：CSS 变量名（不带 -- 前缀）-> 值；UI 暂不暴露 */
  overrides?: Partial<Record<string, string>>;
}

export interface CategoryLockPublicConfig {
  enabled: boolean;
  hasPassword: boolean;
}

export interface AppState {
  links: LinkItem[];
  categories: Category[];
  darkMode: boolean;
  settings?: SiteSettings;
}

export interface WebDavConfig {
  url: string;
  username: string;
  password: string;
  enabled: boolean;
}

export type AIProvider = 'gemini' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  websiteTitle?: string; // 网站标题 (浏览器标签)
  faviconUrl?: string; // 网站图标URL
  navigationName?: string;
}



// 搜索模式类型
export type SearchMode = 'internal' | 'external';

// 外部搜索源配置
export interface ExternalSearchSource {
  id: string;
  name: string;
  url: string;
  icon?: string;
  enabled: boolean;
  createdAt: number;
}

// 搜索配置
export interface SearchConfig {
  mode: SearchMode;
  externalSources: ExternalSearchSource[];
  selectedSource?: ExternalSearchSource | null; // 选中的搜索源
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'common', name: 'MikuLab', nameZh: 'MikuLab', nameEn: 'MikuLab', icon: 'Star' },
  { id: 'ai', name: '智能', nameZh: '智能', nameEn: 'AI', icon: 'Bot' },
  { id: 'dev', name: '开发', nameZh: '开发', nameEn: 'Dev', icon: 'Code' },
  { id: 'work', name: '效率', nameZh: '效率', nameEn: 'Work', icon: 'BriefcaseBusiness' },
  { id: 'learn', name: '学习', nameZh: '学习', nameEn: 'Learn', icon: 'GraduationCap' },
  { id: 'tools', name: '工具', nameZh: '工具', nameEn: 'Tools', icon: 'Wrench' },
  { id: 'feeds', name: '咨讯', nameZh: '咨讯', nameEn: 'Feeds', icon: 'Rss' },
  { id: 'media', name: '媒娱', nameZh: '媒娱', nameEn: 'Media', icon: 'Clapperboard' },
  { id: 'design', name: '设计', nameZh: '设计', nameEn: 'Design', icon: 'Palette' },
  { id: 'discuss', name: '社区', nameZh: '社区', nameEn: 'Discuss', icon: 'MessagesSquare' },
  { id: 'explore', name: '其他', nameZh: '其他', nameEn: 'Explore', icon: 'Compass' },
];

export const INITIAL_LINKS: LinkItem[] = [
  { id: '1', title: 'GitHub', url: 'https://github.com', categoryId: 'dev', createdAt: Date.now(), description: '代码托管平台', pinned: true, icon: 'https://www.faviconextractor.com/favicon/github.com?larger=true' },
  { id: '2', title: 'React', url: 'https://react.dev', categoryId: 'dev', createdAt: Date.now(), description: '构建Web用户界面的库', pinned: true, icon: 'https://www.faviconextractor.com/favicon/react.dev?larger=true' },
  { id: '3', title: 'Tailwind CSS', url: 'https://tailwindcss.com', categoryId: 'design', createdAt: Date.now(), description: '原子化CSS框架', pinned: true, icon: 'https://www.faviconextractor.com/favicon/tailwindcss.com?larger=true' },
  { id: '4', title: 'ChatGPT', url: 'https://chat.openai.com', categoryId: 'ai', createdAt: Date.now(), description: 'OpenAI聊天机器人', pinned: true, icon: 'https://www.faviconextractor.com/favicon/chat.openai.com?larger=true' },
  { id: '5', title: 'Gemini', url: 'https://gemini.google.com', categoryId: 'ai', createdAt: Date.now(), description: 'Google DeepMind AI', pinned: true, icon: 'https://www.faviconextractor.com/favicon/gemini.google.com?larger=true' },
];
