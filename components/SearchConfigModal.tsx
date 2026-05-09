import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Globe, Search, ExternalLink, RotateCcw } from 'lucide-react';
import { ExternalSearchSource, SearchMode } from '../types';

interface SearchConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: ExternalSearchSource[];
  onSave: (sources: ExternalSearchSource[]) => void;
}

const SearchConfigModal: React.FC<SearchConfigModalProps> = ({ 
  isOpen, onClose, sources, onSave 
}) => {
  const [localSources, setLocalSources] = useState<ExternalSearchSource[]>(sources);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newSource, setNewSource] = useState<Partial<ExternalSearchSource>>({
    name: '',
    url: '',
    icon: 'Globe',
    enabled: true
  });

  // 当sources变化或modal打开时，更新localSources
  useEffect(() => {
    if (isOpen) {
      setLocalSources(sources);
    }
  }, [sources, isOpen]);

  const handleAddSource = () => {
    if (!newSource.name || !newSource.url) return;
    
    const source: ExternalSearchSource = {
      id: Date.now().toString(),
      name: newSource.name!,
      url: newSource.url!,
      icon: newSource.icon || 'Globe',
      enabled: newSource.enabled !== false,
      createdAt: Date.now()
    };
    
    setLocalSources([...localSources, source]);
    setNewSource({ name: '', url: '', icon: 'Globe', enabled: true });
  };

  const handleEditSource = (id: string) => {
    setIsEditing(id);
  };

  const handleSaveEdit = (id: string) => {
    setIsEditing(null);
  };

  const handleDeleteSource = (id: string) => {
    setLocalSources(localSources.filter(source => source.id !== id));
  };

  const handleToggleEnabled = (id: string) => {
    setLocalSources(localSources.map(source => 
      source.id === id ? { ...source, enabled: !source.enabled } : source
    ));
  };

  const handleSave = () => {
    onSave(localSources);
    onClose();
  };

  const handleReset = () => {
    const defaultSources: ExternalSearchSource[] = [
      {
        id: 'bing',
        name: '必应',
        url: 'https://www.bing.com/search?q={query}',
        icon: 'Search',
        enabled: true,
        createdAt: Date.now()
      },  
      {
        id: 'google',
        name: 'Google',
        url: 'https://www.google.com/search?q={query}',
        icon: 'Search',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'baidu',
        name: '百度',
        url: 'https://www.baidu.com/s?wd={query}',
        icon: 'Globe',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'sogou',
        name: '搜狗',
        url: 'https://www.sogou.com/web?query={query}',
        icon: 'Globe',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'yandex',
        name: 'Yandex',
        url: 'https://yandex.com/search/?text={query}',
        icon: 'Globe',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'github',
        name: 'GitHub',
        url: 'https://github.com/search?q={query}',
        icon: 'Github',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'linuxdo',
        name: 'Linux.do',
        url: 'https://linux.do/search?q={query}',
        icon: 'Terminal',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'bilibili',
        name: 'B站',
        url: 'https://search.bilibili.com/all?keyword={query}',
        icon: 'Play',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'youtube',
        name: 'YouTube',
        url: 'https://www.youtube.com/results?search_query={query}',
        icon: 'Video',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'wikipedia',
        name: '维基',
        url: 'https://zh.wikipedia.org/wiki/Special:Search?search={query}',
        icon: 'BookOpen',
        enabled: true,
        createdAt: Date.now()
      }
    ];
    
    setLocalSources(defaultSources);
  };

  const handleCancel = () => {
    setLocalSources(sources);
    setIsEditing(null);
    setNewSource({ name: '', url: '', icon: 'Globe', enabled: true });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border-default flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border-default shrink-0">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-accent" />
            <h2 className="text-lg font-semibold text-fg">搜索源管理</h2>
          </div>
          <button onClick={handleCancel} className="p-1 hover:bg-surface-muted rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-fg-subtle" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* 添加新搜索源 */}
          <div className="bg-surface-muted p-4 rounded-lg">
            <h3 className="text-sm font-medium text-fg mb-3">添加新搜索源</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-fg-subtle mb-1">名称</label>
                <input
                  type="text"
                  value={newSource.name || ''}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="例如：Google"
                  className="w-full p-2 text-sm rounded-lg border border-border-default bg-surface text-fg outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-subtle mb-1">搜索URL</label>
                <input
                  type="text"
                  value={newSource.url || ''}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="例如：https://www.google.com/search?q={query}"
                  className="w-full p-2 text-sm rounded-lg border border-border-default bg-surface text-fg outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-fg-subtle">
                提示：URL中必须包含 <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">{'{query}'}</code> 作为搜索关键词占位符
              </span>
              <button
                onClick={handleAddSource}
                disabled={!newSource.name || !newSource.url}
                className="px-3 py-1.5 bg-accent hover:opacity-90 disabled:bg-surface-muted text-accent-fg text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus size={12} /> 添加
              </button>
            </div>
          </div>

          {/* 搜索源列表 */}
          <div>
            <h3 className="text-sm font-medium text-fg mb-3">已配置的搜索源</h3>
            <div className="space-y-2">
              {localSources.length === 0 ? (
                <div className="text-center py-8 text-fg-subtle dark:text-fg-subtle">
                  <Globe size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无搜索源配置</p>
                </div>
              ) : (
                localSources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-3 bg-surface-elevated border border-border-default rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={source.enabled}
                          onChange={() => handleToggleEnabled(source.id)}
                          className="w-4 h-4 text-accent rounded focus:ring-accent"
                        />
                        <Globe size={16} className="text-fg-subtle" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-fg truncate">{source.name}</span>
                          {source.enabled && (
                            <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                              启用
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-fg-subtle dark:text-fg-subtle truncate">
                          {source.url}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 使用说明 */}
          <div className="bg-accent-soft p-4 rounded-lg border border-border-default">
            <h4 className="text-sm font-medium text-accent mb-2 flex items-center gap-1">
              <ExternalLink size={14} /> 使用说明
            </h4>
            <ul className="text-xs text-accent space-y-1">
              <li>• 点击首页搜索框左侧的放大镜图标切换搜索源</li>
              <li>• 搜索URL中必须包含 <code className="bg-accent-soft px-1 rounded">{'{query}'}</code> 占位符</li>
              <li>• 配置信息会自动保存到本地存储和云端（如果已登录）</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-default shrink-0">
          <div className="flex justify-between items-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <RotateCcw size={16} /> 重置为默认
            </button>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm bg-surface-muted text-fg-muted hover:bg-surface-elevated rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-accent text-accent-fg hover:opacity-90 rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <Check size={16} /> 保存配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchConfigModal;