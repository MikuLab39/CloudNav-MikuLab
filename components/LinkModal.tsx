import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Pin, Wand2, Trash2 } from 'lucide-react';
import { LinkItem, Category, AIConfig } from '../types';
import { generateLinkDescription, suggestCategory } from '../services/geminiService';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: Omit<LinkItem, 'id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  categories: Category[];
  initialData?: LinkItem;
  aiConfig: AIConfig;
  defaultCategoryId?: string;
  getCategoryDisplayName?: (category?: Category | null) => string;
}

const LinkModal: React.FC<LinkModalProps> = ({ isOpen, onClose, onSave, onDelete, categories, initialData, aiConfig, defaultCategoryId, getCategoryDisplayName }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'common');
  const [pinned, setPinned] = useState(false);
  const [icon, setIcon] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingIcon, setIsFetchingIcon] = useState(false);
  const [autoFetchIcon, setAutoFetchIcon] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // 当模态框关闭时，重置批量模式为默认关闭状态
  useEffect(() => {
    if (!isOpen) {
      setBatchMode(false);
      setShowSuccessMessage(false);
    }
  }, [isOpen]);
  
  // 成功提示1秒后自动消失
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setUrl(initialData.url);
        setDescription(initialData.description || '');
        setCategoryId(initialData.categoryId);
        setPinned(initialData.pinned || false);
        setIcon(initialData.icon || '');
      } else {
        setTitle('');
        setUrl('');
        setDescription('');
        // 如果有默认分类ID且该分类存在，则使用默认分类，否则使用第一个分类
        const defaultCategory = defaultCategoryId && categories.find(cat => cat.id === defaultCategoryId);
        setCategoryId(defaultCategory ? defaultCategoryId : (categories[0]?.id || 'common'));
        setPinned(false);
        setIcon('');
      }
    }
  }, [isOpen, initialData, categories, defaultCategoryId]);

  // 当URL变化且启用自动获取图标时，自动获取图标
  useEffect(() => {
    if (url && autoFetchIcon && !initialData) {
      const timer = setTimeout(() => {
        handleFetchIcon();
      }, 500); // 延迟500ms执行，避免频繁请求
      
      return () => clearTimeout(timer);
    }
  }, [url, autoFetchIcon, initialData]);

  const handleDelete = () => {
    if (!initialData) return;
    onDelete && onDelete(initialData.id);
    onClose();
  };

  // 缓存自定义图标到KV空间
  const cacheCustomIcon = async (url: string, iconUrl: string) => {
    try {
      let domain = url;
      if (domain.startsWith('http://') || domain.startsWith('https://')) {
        const urlObj = new URL(domain);
        domain = urlObj.hostname;
      }
      
      // 将自定义图标保存到KV缓存
      const authToken = localStorage.getItem('cloudnav_auth_token');
      if (authToken) {
        const authIssuedAt = localStorage.getItem('lastLoginTime');
        const response = await fetch('/api/storage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-password': authToken,
            ...(authIssuedAt ? { 'x-auth-issued-at': authIssuedAt } : {})
          },
          body: JSON.stringify({
            saveConfig: 'favicon',
            domain: domain,
            icon: iconUrl
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.icon || iconUrl;
        }
      }
    } catch (error) {
      console.log("Failed to cache custom icon", error);
    }

    return iconUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !url) return;
    
    // 确保URL有协议前缀
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }

    let finalIcon = icon;
    if (finalIcon) {
      finalIcon = await cacheCustomIcon(finalUrl, finalIcon);
      setIcon(finalIcon);
    }
    
    // 保存链接数据
    onSave({
      id: initialData?.id || '',
      title,
      url: finalUrl,
      icon: finalIcon,
      description,
      categoryId,
      pinned
    });
    
    // 批量模式下不关闭窗口，只显示成功提示
    if (batchMode) {
      setShowSuccessMessage(true);
      // 重置表单，但保留分类和批量模式设置
      setTitle('');
      setUrl('');
      setIcon('');
      setDescription('');
      setPinned(false);
      // 如果开启自动获取图标，尝试获取新图标
      if (autoFetchIcon && finalUrl) {
        handleFetchIcon();
      }
    } else {
      onClose();
    }
  };

  const handleAIAssist = async () => {
    if (!url || !title) return;
    if (!aiConfig.apiKey) {
        alert("请先点击侧边栏左下角设置图标配置 AI API Key");
        return;
    }

    setIsGenerating(true);
    
    // Parallel execution for speed
    try {
        const descPromise = generateLinkDescription(title, url, aiConfig);
        const catPromise = suggestCategory(title, url, categories, aiConfig);
        
        const [desc, cat] = await Promise.all([descPromise, catPromise]);
        
        if (desc) setDescription(desc);
        if (cat) setCategoryId(cat);
        
    } catch (e) {
        console.error("AI Assist failed", e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleFetchIcon = async () => {
    if (!url) return;
    
    setIsFetchingIcon(true);
    try {
      // 提取域名
      let domain = url;
      // 如果URL没有协议前缀，添加https://作为默认协议
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        domain = 'https://' + url;
      }
      
      if (domain.startsWith('http://') || domain.startsWith('https://')) {
        const urlObj = new URL(domain);
        domain = urlObj.hostname;
      }
      
      // 先尝试从KV缓存获取图标
      try {
        const response = await fetch(`/api/storage?getConfig=favicon&domain=${encodeURIComponent(domain)}&fetch=true`);
        if (response.ok) {
          const data = await response.json();
          if (data.cached && data.icon) {
            setIcon(data.icon);
            setIsFetchingIcon(false);
            return;
          }
        }
      } catch (error) {
        console.log("Failed to fetch cached icon, will generate new one", error);
      }
      
      // 如果缓存中没有，则生成新图标
      const iconUrl = `https://www.faviconextractor.com/favicon/${domain}?larger=true`;
      setIcon(iconUrl);
      
      // 将图标保存到KV缓存
      try {
        const authToken = localStorage.getItem('cloudnav_auth_token');
        if (authToken) {
          const authIssuedAt = localStorage.getItem('lastLoginTime');
          await fetch('/api/storage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-password': authToken,
              ...(authIssuedAt ? { 'x-auth-issued-at': authIssuedAt } : {})
            },
            body: JSON.stringify({
              saveConfig: 'favicon',
              domain: domain,
              icon: iconUrl
            })
          });
        }
      } catch (error) {
        console.log("Failed to cache icon", error);
      }
    } catch (e) {
      console.error("Failed to fetch icon", e);
      alert("无法获取图标，请检查URL是否正确");
    } finally {
      setIsFetchingIcon(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border-default">
        <div className="flex justify-between items-center p-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-fg">
              {initialData ? '编辑链接' : '添加新链接'}
            </h3>
            <button
              type="button"
              onClick={() => setPinned(!pinned)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all ${
                pinned 
                ? 'bg-accent-soft border-border-default text-accent' 
                : 'bg-surface-muted border-border-default text-fg-subtle'
              }`}
              title={pinned ? "取消置顶" : "置顶"}
            >
              <Pin size={14} className={pinned ? "fill-current" : ""} />
              <span className="text-xs font-medium">置顶</span>
            </button>
            {!initialData && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-surface-muted border-border-default">
                <input
                  type="checkbox"
                  id="batchMode"
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                  className="h-3 w-3 text-accent focus:ring-accent border-border-default rounded bg-surface"
                />
                <label htmlFor="batchMode" className="text-xs font-medium text-fg-subtle dark:text-fg-subtle cursor-pointer">
                  批量添加不关窗口
                </label>
              </div>
            )}
            {initialData && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all ${
                  'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400 dark:hover:bg-red-900/30'
                }`}
                title="删除链接"
              >
                <Trash2 size={14} />
                <span className="text-xs font-medium">删除</span>
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-muted rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-fg-subtle" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-fg-muted">标题</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded-lg border border-border-default bg-surface text-fg focus:ring-2 focus:ring-accent outline-none transition-all"
              placeholder="网站名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-fg-muted">URL 链接</label>
            <div className="flex gap-2">
                <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-2 rounded-lg border border-border-default bg-surface text-fg focus:ring-2 focus:ring-accent outline-none transition-all"
                placeholder="example.com 或 https://..."
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-fg-muted">图标 URL</label>
            <div className="flex gap-2">
              {icon && (
                <div className="w-10 h-10 rounded-xl border border-border-default overflow-hidden flex-shrink-0 bg-surface-elevated">
                  <img
                    key={icon}
                    src={icon}
                    alt="图标预览"
                    className="w-full h-full object-cover rounded-xl"
                    onLoad={(e) => {
                      e.currentTarget.style.display = 'block';
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <input
                type="url"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="flex-1 p-2 rounded-lg border border-border-default bg-surface text-fg focus:ring-2 focus:ring-accent outline-none transition-all"
                placeholder="https://example.com/icon.png"
              />
              <button
                type="button"
                onClick={handleFetchIcon}
                disabled={!url || isFetchingIcon}
                className="px-3 py-2 bg-accent text-accent-fg rounded-lg hover:opacity-90 disabled:bg-gray-400 flex items-center gap-1 transition-colors"
              >
                {isFetchingIcon ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                获取图标
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="autoFetchIcon"
                checked={autoFetchIcon}
                onChange={(e) => setAutoFetchIcon(e.target.checked)}
                className="h-4 w-4 text-accent focus:ring-accent border-border-default rounded bg-surface"
              />
              <label htmlFor="autoFetchIcon" className="text-sm text-fg-muted">
                自动获取URL链接的图标
              </label>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-fg-muted">描述 (选填)</label>
                {(title && url) && (
                    <button
                        type="button"
                        onClick={handleAIAssist}
                        disabled={isGenerating}
                        className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        AI 自动填写
                    </button>
                )}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded-lg border border-border-default bg-surface text-fg focus:ring-2 focus:ring-accent outline-none transition-all h-20 resize-none"
              placeholder="简短描述..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-fg-muted">分类</label>
            <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-2 rounded-lg border border-border-default bg-surface text-fg focus:ring-2 focus:ring-accent outline-none transition-all"
            >
            {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{getCategoryDisplayName ? getCategoryDisplayName(cat) : cat.name}</option>
            ))}
            </select>
          </div>

          <div className="pt-2 relative">
            {/* 成功提示 */}
            {showSuccessMessage && (
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg transition-opacity duration-300">
                添加成功
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-accent hover:opacity-90 text-accent-fg font-medium py-2 px-4 rounded-lg transition-colors shadow-lg shadow-blue-500/30"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkModal;
