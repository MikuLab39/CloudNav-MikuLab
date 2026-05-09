import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { X, Search, ExternalLink } from 'lucide-react';
import Icon from './Icon';

interface IconSelectorProps {
  onSelectIcon: (iconName: string) => void;
}

// 常用图标列表，可以根据需要扩展
const commonIcons = [
  'Star', 'Heart', 'Bookmark', 'Flag', 'Tag', 'Hash',
  'Home', 'User', 'Users', 'Settings', 'Bell', 'Mail',
  'Calendar', 'Clock', 'MapPin', 'Phone', 'Camera', 'Image',
  'Folder', 'File', 'Archive', 'Trash2', 'Download', 'Upload',
  'Search', 'Filter', 'Menu', 'MoreVertical', 'ChevronDown', 'ChevronUp',
  'Plus', 'Minus', 'X', 'Check', 'AlertCircle', 'Info',
  'Edit', 'Copy', 'Share', 'Link', 'ExternalLink', 'Lock',
  'Code', 'Terminal', 'Database', 'Server', 'Cloud', 'Wifi',
  'ShoppingCart', 'CreditCard', 'Package', 'Truck', 'Store',
  'Music', 'Play', 'Pause', 'Volume2', 'Headphones', 'Mic',
  'Book', 'BookOpen', 'FileText', 'PenTool', 'Highlighter', 'Type',
  'Layout', 'Grid', 'List', 'Columns', 'Sidebar', 'Layers',
  'Circle', 'Square', 'Triangle', 'Hexagon', 'Zap', 'Target',
  'Rocket', 'Plane', 'Car', 'Bike', 'Ship', 'Train',
  'Moon', 'Sun', 'CloudRain', 'CloudSnow', 'Wind', 'Thermometer',
  'Github', 'Gitlab', 'Chrome', 'Firefox', 'Safari', 'Edge',
  'MessageSquare', 'MessageCircle', 'Send', 'AtSign', 'Percent'
];

const IconSelector: React.FC<IconSelectorProps> = ({ 
  onSelectIcon
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [customIconName, setCustomIconName] = useState('');
  const [isValidIcon, setIsValidIcon] = useState(true);

  // 获取当前目标图标
  const getCurrentIcon = () => {
    return selectedIcon;
  };

  // 过滤图标
  const filteredIcons = commonIcons.filter(icon => 
    icon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 将 kebab-case 转换为 PascalCase
  const kebabToPascal = (kebabName: string): string => {
    return kebabName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  // 验证图标名称是否有效
  const validateIconName = (iconName: string): boolean => {
    if (!iconName.trim()) return false;
    
    // 检查是否是常用图标列表中的图标
    if (commonIcons.includes(iconName)) return true;
    
    // 检查是否是 Lucide 图标库中的图标
    try {
      // 首先尝试直接匹配
      if (iconName in LucideIcons) return true;
      
      // 如果包含连字符，尝试转换为 PascalCase
      if (iconName.includes('-')) {
        const pascalName = kebabToPascal(iconName);
        return pascalName in LucideIcons;
      }
      
      // 尝试首字母大写
      const capitalizedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
      return capitalizedName in LucideIcons;
    } catch {
      return false;
    }
  };

  const handleSelect = (iconName: string) => {
    setSelectedIcon(iconName);
    setCustomIconName('');
    setIsValidIcon(true);
  };

  const handleCustomIconChange = (iconName: string) => {
    setCustomIconName(iconName);
    
    if (iconName.trim()) {
      const isValid = validateIconName(iconName);
      setIsValidIcon(isValid);
      if (isValid) {
        // 转换为正确的图标名称格式
        let finalIconName = iconName;
        if (iconName.includes('-')) {
          finalIconName = kebabToPascal(iconName);
        } else if (!commonIcons.includes(iconName)) {
          // 如果不是常用图标，尝试首字母大写
          finalIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
        }
        setSelectedIcon(finalIconName);
      }
    } else {
      setIsValidIcon(true);
    }
  };

  const handleConfirm = () => {
    onSelectIcon(selectedIcon);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border-default">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
          <input
            type="text"
            placeholder="搜索图标..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-default bg-surface text-fg focus:ring-2 focus:ring-accent outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Custom Icon Input */}
      <div className="p-4 border-b border-border-default">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-fg-subtle">输入图标名称:</span>
            <a 
              href="https://lucide.dev/icons/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <ExternalLink size={12} />
              查看所有图标
            </a>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="例如: star, heart, cloud..."
              value={customIconName}
              onChange={(e) => handleCustomIconChange(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${
                customIconName && !isValidIcon 
                  ? 'border-red-300 dark:border-red-700' 
                  : 'border-border-default'
              } bg-surface text-fg focus:ring-2 focus:ring-accent outline-none`}
            />
            {customIconName && !isValidIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-xs text-red-500">无效图标</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Selection */}
      <div className="px-4 py-3 bg-surface-muted border-b border-border-default">
        <div className="flex items-center gap-3">
          <span className="text-sm text-fg-subtle">当前选择:</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated rounded-lg border border-border-default">
            <Icon name={selectedIcon} size={18} />
            <span className="text-sm font-medium text-fg">{selectedIcon}</span>
          </div>
        </div>
      </div>

      {/* Confirm Selection */}
      <div className="p-4 border-b border-border-default bg-surface-muted">
        <div className="flex items-center justify-between">
          <div className="text-xs text-fg-subtle dark:text-fg-subtle">
            提示：可以输入 Lucide 图标名称或选择图标库
          </div>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-accent hover:opacity-90 text-accent-fg rounded-lg transition-colors text-sm font-medium"
          >
            确定选择
          </button>
        </div>
      </div>

      {/* Icons Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredIcons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-fg-subtle">
            <Search size={40} className="mb-3 opacity-50" />
            <p>没有找到匹配的图标</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {filteredIcons.map(iconName => (
              <button
                key={iconName}
                onClick={() => handleSelect(iconName)}
                className={`p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
                  selectedIcon === iconName 
                    ? 'bg-accent-soft text-accent ring-2 ring-accent' 
                    : 'hover:bg-surface-muted text-fg-subtle'
                }`}
                title={iconName}
              >
                <Icon name={iconName} size={20} />
                <span className="text-xs truncate w-full text-center">{iconName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IconSelector;