interface Env {
  CLOUDNAV_KV: any;
  PASSWORD: string;
}

type CloudflareRequestInit = RequestInit & {
  cf?: {
    cacheTtl?: number;
    cacheEverything?: boolean;
  };
};

interface WebsiteConfig {
  title?: string;
  navTitle?: string;
  favicon?: string;
  cardStyle?: 'detailed' | 'simple';
  requirePasswordOnVisit?: boolean;
  passwordExpiryDays?: number;
}

interface CategoryLockConfig {
  enabled?: boolean;
  password?: string;
}

interface StoredCategory {
  id: string;
  protected?: boolean;
  password?: string;
  requireAuth?: boolean;
}

interface StoredLink {
  categoryId: string;
}

interface StoredAppData {
  links?: StoredLink[];
  categories?: StoredCategory[];
}

const AUTH_TIME_HEADER = 'x-auth-issued-at';
const CATEGORY_LOCK_TOKEN_HEADER = 'x-category-lock-token';
const CATEGORY_LOCK_TIME_HEADER = 'x-category-lock-issued-at';
const CATEGORY_LOCK_CONFIG_KEY = 'category_lock_config';
const CATEGORY_LOCK_SESSION_PREFIX = 'category_lock_session:';

const getCorsHeaders = (request: Request) => {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');
  const allowOrigin = origin && (
    origin === requestUrl.origin ||
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('moz-extension://')
  ) ? origin : requestUrl.origin;

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': `Content-Type, x-auth-password, ${AUTH_TIME_HEADER}, ${CATEGORY_LOCK_TOKEN_HEADER}, ${CATEGORY_LOCK_TIME_HEADER}`,
  };
};

const getWebsiteConfig = async (env: Env): Promise<WebsiteConfig> => {
  const websiteConfigStr = await env.CLOUDNAV_KV.get('website_config');
  return websiteConfigStr
    ? JSON.parse(websiteConfigStr)
    : { requirePasswordOnVisit: false, passwordExpiryDays: 7 };
};

const buildUnauthorizedResponse = (message: string, corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const buildJsonResponse = (body: unknown, corsHeaders: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

const getCategoryLockConfig = async (env: Env): Promise<CategoryLockConfig> => {
  const rawConfig = await env.CLOUDNAV_KV.get(CATEGORY_LOCK_CONFIG_KEY);
  return rawConfig ? JSON.parse(rawConfig) : { enabled: false };
};

const createSessionToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

const getExpiryMs = (websiteConfig: WebsiteConfig) => {
  const passwordExpiryDays = websiteConfig.passwordExpiryDays ?? 7;
  return passwordExpiryDays > 0 ? passwordExpiryDays * 24 * 60 * 60 * 1000 : 0;
};

const normalizeStoredCategory = (category: StoredCategory): StoredCategory => {
  const isProtected = !!category.protected || !!category.password || !!category.requireAuth;
  const { password, requireAuth, ...rest } = category;
  return {
    ...rest,
    ...(isProtected ? { protected: true } : {}),
  };
};

const normalizeStoredAppData = (data: StoredAppData): StoredAppData => ({
  ...data,
  categories: Array.isArray(data.categories) ? data.categories.map(normalizeStoredCategory) : [],
  links: Array.isArray(data.links) ? data.links : [],
});

const filterProtectedAppData = (data: StoredAppData) => {
  const normalized = normalizeStoredAppData(data);
  const protectedCategoryIds = new Set(
    (normalized.categories || [])
      .filter(category => !!category.protected)
      .map(category => category.id)
  );

  if (protectedCategoryIds.size === 0) {
    return { data: normalized, hidden: false };
  }

  return {
    data: {
      ...normalized,
      links: (normalized.links || []).filter(link => !protectedCategoryIds.has(link.categoryId)),
    },
    hidden: true,
  };
};

const validateCategoryLockSession = async (
  request: Request,
  env: Env,
  websiteConfig: WebsiteConfig,
  categoryLockConfig: CategoryLockConfig
) => {
  if (!categoryLockConfig.enabled || !categoryLockConfig.password) return true;

  const token = request.headers.get(CATEGORY_LOCK_TOKEN_HEADER);
  if (!token) return false;

  const sessionRaw = await env.CLOUDNAV_KV.get(`${CATEGORY_LOCK_SESSION_PREFIX}${token}`);
  if (!sessionRaw) return false;

  try {
    const session = JSON.parse(sessionRaw);
    const issuedAt = Number(session.issuedAt);
    const headerIssuedAt = Number(request.headers.get(CATEGORY_LOCK_TIME_HEADER));
    const expiryMs = getExpiryMs(websiteConfig);

    if (!Number.isFinite(issuedAt) || issuedAt <= 0) return false;
    if (Number.isFinite(headerIssuedAt) && headerIssuedAt > 0 && headerIssuedAt !== issuedAt) return false;
    if (expiryMs > 0 && Date.now() - issuedAt > expiryMs) {
      await env.CLOUDNAV_KV.delete(`${CATEGORY_LOCK_SESSION_PREFIX}${token}`);
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const validateAuth = async (
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  options: { requireSession?: boolean } = {}
) => {
  const serverPassword = env.PASSWORD;
  if (!serverPassword) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: 'Server misconfigured: PASSWORD not set' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }),
    };
  }

  const providedPassword = request.headers.get('x-auth-password');
  if (!providedPassword || providedPassword !== serverPassword) {
    return {
      ok: false,
      response: buildUnauthorizedResponse('Unauthorized', corsHeaders),
    };
  }

  const websiteConfig = await getWebsiteConfig(env);
  const passwordExpiryDays = websiteConfig.passwordExpiryDays ?? 7;

  if (options.requireSession && passwordExpiryDays > 0) {
    const authIssuedAtRaw = request.headers.get(AUTH_TIME_HEADER);
    const authIssuedAt = authIssuedAtRaw ? Number(authIssuedAtRaw) : NaN;
    const expiryMs = passwordExpiryDays * 24 * 60 * 60 * 1000;

    if (Number.isFinite(authIssuedAt) && authIssuedAt > 0 && Date.now() - authIssuedAt > expiryMs) {
      return {
        ok: false,
        response: buildUnauthorizedResponse('密码已过期，请重新输入', corsHeaders),
      };
    }
  }

  return {
    ok: true,
    websiteConfig,
  };
};

const normalizeDomain = (rawDomain: string | null) => {
  if (!rawDomain) return '';

  try {
    const value = rawDomain.startsWith('http://') || rawDomain.startsWith('https://')
      ? rawDomain
      : `https://${rawDomain}`;
    return new URL(value).hostname;
  } catch {
    return rawDomain.trim();
  }
};

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const fetchAndEncodeImage = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl, {
      cf: { cacheTtl: 86400, cacheEverything: true },
    } as CloudflareRequestInit);

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength) return null;

    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${toBase64(arrayBuffer)}`;
  } catch {
    return null;
  }
};

const fetchAndEncodeFavicon = async (domain: string) => {
  const providers = [
    `https://www.faviconextractor.com/favicon/${encodeURIComponent(domain)}?larger=true`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
  ];

  for (const iconUrl of providers) {
    const encoded = await fetchAndEncodeImage(iconUrl);
    if (encoded) return encoded;
  }

  return null;
};

// 处理 OPTIONS 请求（解决跨域预检）
export const onRequestOptions = async (context: { request: Request }) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request),
  });
};

// GET: 获取数据
export const onRequestGet = async (context: { env: Env; request: Request }) => {
  const corsHeaders = getCorsHeaders(context.request);
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const checkAuth = url.searchParams.get('checkAuth');
    const getConfig = url.searchParams.get('getConfig');
    const websiteConfig = await getWebsiteConfig(env);
    const serverPassword = env.PASSWORD;
    const requiresAuth = !!serverPassword && !!websiteConfig.requirePasswordOnVisit;
    
    // 如果是检查认证请求，返回是否设置了密码
    if (checkAuth === 'true') {
      return new Response(JSON.stringify({ 
        hasPassword: !!serverPassword,
        requiresAuth
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // 如果是获取配置请求
    if (getConfig === 'ai') {
      const authCheck = await validateAuth(request, env, corsHeaders, { requireSession: true });
      if (!authCheck.ok) {
        return authCheck.response;
      }
      const aiConfig = await env.CLOUDNAV_KV.get('ai_config');
      return new Response(aiConfig || '{}', {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // 如果是获取搜索配置请求
    if (getConfig === 'search') {
      const searchConfig = await env.CLOUDNAV_KV.get('search_config');
      return new Response(searchConfig || '{}', {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (getConfig === 'webdav') {
      const authCheck = await validateAuth(request, env, corsHeaders, { requireSession: true });
      if (!authCheck.ok) {
        return authCheck.response;
      }
      const webDavConfig = await env.CLOUDNAV_KV.get('webdav_config');
      return new Response(webDavConfig || '{}', {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (getConfig === 'categoryLock') {
      const categoryLockConfig = await getCategoryLockConfig(env);
      return buildJsonResponse({
        enabled: !!categoryLockConfig.enabled,
        hasPassword: !!categoryLockConfig.password,
      }, corsHeaders);
    }
    
    // 如果是获取网站配置请求
    if (getConfig === 'website') {
      return new Response(JSON.stringify({
        requirePasswordOnVisit: false,
        passwordExpiryDays: 7,
        ...websiteConfig,
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // 如果是获取图标请求
    if (getConfig === 'favicon') {
      const domain = normalizeDomain(url.searchParams.get('domain'));
      const shouldFetch = url.searchParams.get('fetch') === 'true';
      if (!domain) {
        return new Response(JSON.stringify({ error: 'Domain parameter is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      // 从KV中获取缓存的图标
      const cachedIcon = await env.CLOUDNAV_KV.get(`favicon:${domain}`);
      if (cachedIcon && (!shouldFetch || cachedIcon.startsWith('data:'))) {
        return new Response(JSON.stringify({ icon: cachedIcon, cached: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (shouldFetch) {
        const fetchedIcon = await fetchAndEncodeFavicon(domain);

        if (fetchedIcon) {
          await env.CLOUDNAV_KV.put(`favicon:${domain}`, fetchedIcon);
          return new Response(JSON.stringify({ icon: fetchedIcon, cached: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        if (cachedIcon) {
          return new Response(JSON.stringify({ icon: cachedIcon, cached: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }
      
      // 如果没有缓存，返回空结果
      return new Response(JSON.stringify({ icon: null, cached: false }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // 从 KV 中读取数据
    const data = await env.CLOUDNAV_KV.get('app_data');
    
    // 如果开启了访问认证，读取数据时也需要密码
    if (requiresAuth) {
      const authCheck = await validateAuth(request, env, corsHeaders, { requireSession: true });
      if (!authCheck.ok) {
        return authCheck.response;
      }
    }
    
    if (!data) {
      // 如果没有数据，返回空结构
      return new Response(JSON.stringify({ links: [], categories: [] }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const parsedData = normalizeStoredAppData(JSON.parse(data));
    const providedPassword = request.headers.get('x-auth-password');
    const authCheck = serverPassword && providedPassword
      ? await validateAuth(request, env, corsHeaders, { requireSession: true })
      : { ok: false };
    const categoryLockConfig = await getCategoryLockConfig(env);
    const hasCategoryLockSession = await validateCategoryLockSession(request, env, websiteConfig, categoryLockConfig);

    if (authCheck.ok || hasCategoryLockSession) {
      return buildJsonResponse({ ...parsedData, protectedContentHidden: false }, corsHeaders);
    }

    const filtered = filterProtectedAppData(parsedData);
    return buildJsonResponse({ ...filtered.data, protectedContentHidden: filtered.hidden }, corsHeaders);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

// POST: 保存数据
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  // 1. 验证密码（对于敏感操作需要密码）
  const providedPassword = request.headers.get('x-auth-password');
  const serverPassword = env.PASSWORD;

  try {
    const body = await request.json();
    
    // 如果只是验证密码，不更新数据
    if (body.authOnly) {
      const authCheck = await validateAuth(request, env, corsHeaders);
      if (!authCheck.ok) {
        return authCheck.response;
      }
      
      return new Response(JSON.stringify({ success: true, authenticatedAt: Date.now() }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (body.categoryLockAuthOnly) {
      const categoryLockConfig = await getCategoryLockConfig(env);
      if (!categoryLockConfig.enabled || !categoryLockConfig.password) {
        return buildUnauthorizedResponse('Category lock is not configured', corsHeaders);
      }

      if (!body.password || body.password !== categoryLockConfig.password) {
        return buildUnauthorizedResponse('Unauthorized', corsHeaders);
      }

      const websiteConfig = await getWebsiteConfig(env);
      const issuedAt = Date.now();
      const token = createSessionToken();
      const expiryMs = getExpiryMs(websiteConfig);
      const putOptions = expiryMs > 0 ? { expirationTtl: Math.ceil(expiryMs / 1000) } : undefined;

      await env.CLOUDNAV_KV.put(
        `${CATEGORY_LOCK_SESSION_PREFIX}${token}`,
        JSON.stringify({ issuedAt }),
        putOptions
      );

      return buildJsonResponse({ success: true, token, authenticatedAt: issuedAt }, corsHeaders);
    }
    
    // 如果是保存搜索配置（允许无密码访问，因为搜索配置不包含敏感数据）
    if (body.saveConfig === 'search') {
      // 如果服务器设置了密码，需要验证密码
      if (serverPassword) {
        const authCheck = await validateAuth(request, env, corsHeaders, { requireSession: true });
        if (!authCheck.ok) {
          return authCheck.response;
        }
      }
      
      await env.CLOUDNAV_KV.put('search_config', JSON.stringify(body.config));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (body.saveConfig === 'webdav') {
      const authCheck = await validateAuth(request, env, corsHeaders, { requireSession: true });
      if (!authCheck.ok) {
        return authCheck.response;
      }
      await env.CLOUDNAV_KV.put('webdav_config', JSON.stringify(body.config));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (body.saveConfig === 'categoryLock') {
      const authCheck = await validateAuth(request, env, corsHeaders, { requireSession: true });
      if (!authCheck.ok) {
        return authCheck.response;
      }

      const currentConfig = await getCategoryLockConfig(env);
      const nextPassword = typeof body.config?.password === 'string' && body.config.password.length > 0
        ? body.config.password
        : currentConfig.password;
      const nextConfig: CategoryLockConfig = {
        enabled: !!body.config?.enabled,
        ...(nextPassword ? { password: nextPassword } : {}),
      };

      await env.CLOUDNAV_KV.put(CATEGORY_LOCK_CONFIG_KEY, JSON.stringify(nextConfig));
      return buildJsonResponse({ success: true, enabled: !!nextConfig.enabled, hasPassword: !!nextConfig.password }, corsHeaders);
    }
    
    // 保存图标也需要密码，避免任意写入缓存
    if (body.saveConfig === 'favicon') {
      const domain = normalizeDomain(body.domain);
      const { icon } = body;
      if (!domain || !icon) {
        return new Response(JSON.stringify({ error: 'Domain and icon are required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (!serverPassword || providedPassword !== serverPassword) {
        const authCheck = await validateAuth(request, env, corsHeaders, { requireSession: true });
        if (!authCheck.ok) {
          return authCheck.response;
        }
      }
      
      let finalIcon = icon;
      if (!finalIcon.startsWith('data:')) {
        const isCustomImageUrl = /^https?:\/\//i.test(finalIcon);
        finalIcon = isCustomImageUrl
          ? await fetchAndEncodeImage(finalIcon)
          : await fetchAndEncodeFavicon(domain);
      }

      if (!finalIcon) {
        return new Response(JSON.stringify({ error: 'Failed to fetch favicon' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      await env.CLOUDNAV_KV.put(`favicon:${domain}`, finalIcon);
      return new Response(JSON.stringify({ success: true, icon: finalIcon }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // 对于其他操作（保存AI配置、应用数据等），需要密码验证
    if (serverPassword) {
      const authCheck = await validateAuth(request, env, corsHeaders, { requireSession: true });
      if (!authCheck.ok) {
        return authCheck.response;
      }
    } else {
      return new Response(JSON.stringify({ error: 'Server misconfigured: PASSWORD not set' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // 如果是保存AI配置
    if (body.saveConfig === 'ai') {
      await env.CLOUDNAV_KV.put('ai_config', JSON.stringify(body.config));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // 如果是保存网站配置
    if (body.saveConfig === 'website') {
      await env.CLOUDNAV_KV.put('website_config', JSON.stringify(body.config));
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    // 将数据写入 KV。保存时清理旧版分类密码字段，避免分类密码继续随 app_data 下发。
    await env.CLOUDNAV_KV.put('app_data', JSON.stringify(normalizeStoredAppData(body)));

    return buildJsonResponse({ success: true }, corsHeaders);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to save data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};
