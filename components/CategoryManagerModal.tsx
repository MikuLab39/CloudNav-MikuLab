import React, { useState } from 'react';
import { X, ArrowUp, ArrowDown, Trash2, Edit2, Plus, Check, Lock, Palette } from 'lucide-react';
import { Category } from '../types';
import Icon from './Icon';
import IconSelector from './IconSelector';
import CategoryActionAuthModal from './CategoryActionAuthModal';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdateCategories: (newCategories: Category[]) => void;
  onDeleteCategory: (id: string) => void;
  onVerifyPassword?: (password: string) => Promise<boolean>;
  commonCategoryName?: string;
  defaultCategoryNote?: string;
  commonCategoryLockedTitle?: string;
  getCategoryDisplayName?: (category?: Category | null) => string;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ 
  isOpen, 
  onClose, 
  categories, 
  onUpdateCategories,
  onDeleteCategory,
  onVerifyPassword,
  commonCategoryName = 'Recommendations',
  defaultCategoryNote = 'Default category, not editable',
  commonCategoryLockedTitle = 'The default category cannot be deleted',
  getCategoryDisplayName
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameZh, setEditNameZh] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editProtected, setEditProtected] = useState(false);
  
  const [newCatNameZh, setNewCatNameZh] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Folder');
  const [newCatProtected, setNewCatProtected] = useState(false);
  
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [iconSelectorTarget, setIconSelectorTarget] = useState<'edit' | 'new' | null>(null);
  
  // 分类操作验证相关状态
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    categoryId: string;
    categoryName: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    if (direction === 'up' && index > 0) {
      [newCats[index], newCats[index - 1]] = [newCats[index - 1], newCats[index]];
    } else if (direction === 'down' && index < newCats.length - 1) {
      [newCats[index], newCats[index + 1]] = [newCats[index + 1], newCats[index]];
    }
    onUpdateCategories(newCats);
  };

  // 处理密码验证
  const handlePasswordVerification = async (password: string): Promise<boolean> => {
    if (!onVerifyPassword) return true; // 如果没有提供验证函数，默认通过
    
    try {
      const isValid = await onVerifyPassword(password);
      return isValid;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  // 处理编辑分类前的验证
  const handleStartEdit = (cat: Category) => {
    if (!onVerifyPassword) {
      // 如果没有提供验证函数，直接编辑
      startEdit(cat);
      return;
    }

    // 设置待处理的操作
    setPendingAction({
      type: 'edit',
      categoryId: cat.id,
      categoryName: getCategoryDisplayName ? getCategoryDisplayName(cat) : cat.name
    });
    
    // 打开验证弹窗
    setIsAuthModalOpen(true);
  };

  // 处理删除分类前的验证
  const handleDeleteClick = (cat: Category) => {
    if (!onVerifyPassword) {
      // 如果没有提供验证函数，直接删除
      if (confirm(`确定删除"${getCategoryDisplayName ? getCategoryDisplayName(cat) : cat.name}"分类吗？该分类下的书签将移动到"${commonCategoryName}"。`)) {
        onDeleteCategory(cat.id);
      }
      return;
    }

    // 设置待处理的操作
    setPendingAction({
      type: 'delete',
      categoryId: cat.id,
      categoryName: getCategoryDisplayName ? getCategoryDisplayName(cat) : cat.name
    });
    
    // 打开验证弹窗
    setIsAuthModalOpen(true);
  };

  const toggleCategoryProtected = (cat: Category) => {
    const nextCats = categories.map(c => c.id === cat.id ? {
      ...c,
      protected: !(c.protected || c.password || c.requireAuth) || undefined,
      password: undefined,
      requireAuth: undefined,
    } : c);
    onUpdateCategories(nextCats);
  };

  // 处理验证成功后的操作
  const handleAuthSuccess = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'edit') {
      const cat = categories.find(c => c.id === pendingAction.categoryId);
      if (cat) {
        startEdit(cat);
      }
    } else if (pendingAction.type === 'delete') {
      const cat = categories.find(c => c.id === pendingAction.categoryId);
      if (cat && confirm(`确定删除"${getCategoryDisplayName ? getCategoryDisplayName(cat) : cat.name}"分类吗？该分类下的书签将移动到"${commonCategoryName}"。`)) {
        onDeleteCategory(cat.id);
      }
    }

    // 清除待处理的操作
    setPendingAction(null);
  };

  // 处理验证弹窗关闭
  const handleAuthModalClose = () => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditNameZh(cat.nameZh || cat.name);
    setEditNameEn(cat.nameEn || cat.name);
    setEditIcon(cat.icon);
    setEditProtected(!!cat.protected || !!cat.password || !!cat.requireAuth);
  };

  const saveEdit = () => {
    if (!editingId || !editNameZh.trim()) return;
    const normalizedNameZh = editNameZh.trim();
    const normalizedNameEn = editNameEn.trim() || normalizedNameZh;
    const newCats = categories.map(c => c.id === editingId ? { 
        ...c, 
        name: normalizedNameZh,
        nameZh: normalizedNameZh,
        nameEn: normalizedNameEn,
        icon: editIcon,
        protected: editProtected || undefined,
        password: undefined,
        requireAuth: undefined
    } : c);
    onUpdateCategories(newCats);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newCatNameZh.trim()) return;
    const normalizedNameZh = newCatNameZh.trim();
    const normalizedNameEn = newCatNameEn.trim() || normalizedNameZh;
    const newCat: Category = {
      id: Date.now().toString(),
      name: normalizedNameZh,
      nameZh: normalizedNameZh,
      nameEn: normalizedNameEn,
      icon: newCatIcon,
      protected: newCatProtected || undefined
    };
    onUpdateCategories([...categories, newCat]);
    setNewCatNameZh('');
    setNewCatNameEn('');
    setNewCatIcon('Folder');
    setNewCatProtected(false);
  };

  const openIconSelector = (target: 'edit' | 'new') => {
    setIconSelectorTarget(target);
    setIsIconSelectorOpen(true);
  };
  
  const handleIconSelect = (iconName: string) => {
    if (iconSelectorTarget === 'edit') {
      setEditIcon(iconName);
    } else if (iconSelectorTarget === 'new') {
      setNewCatIcon(iconName);
    }
  };
  
  const cancelIconSelector = () => {
    setIsIconSelectorOpen(false);
    setIconSelectorTarget(null);
  };
  
  const cancelAdd = () => {
    setNewCatNameZh('');
    setNewCatNameEn('');
    setNewCatIcon('Folder');
    setNewCatProtected(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-border-default flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-4 border-b border-border-default">
          <h3 className="text-lg font-semibold text-fg">分类管理</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-muted rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-fg-subtle" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {categories.map((cat, index) => (
            <div key={cat.id} className="flex flex-col p-3 bg-surface-muted rounded-lg group gap-2">
              <div className="flex items-center gap-2">
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1 mr-2">
                    <button 
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-0.5 text-fg-subtle hover:text-accent disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-0.5 text-fg-subtle hover:text-accent disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === cat.id && cat.id !== 'common' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Icon name={editIcon} size={16} />
                          <div className="flex flex-col gap-1 flex-1">
                            <input 
                              type="text" 
                              value={editNameZh}
                              onChange={(e) => setEditNameZh(e.target.value)}
                              className="p-1.5 px-2 text-sm rounded border border-accent bg-surface text-fg outline-none"
                              placeholder="中文名称"
                              autoFocus
                            />
                            <input 
                              type="text" 
                              value={editNameEn}
                              onChange={(e) => setEditNameEn(e.target.value)}
                              className="p-1.5 px-2 text-sm rounded border border-accent bg-surface text-fg outline-none"
                              placeholder="English name"
                            />
                          </div>
                          <button
                            type="button"
                            className="p-1 text-fg-subtle hover:text-accent transition-colors"
                            onClick={() => openIconSelector('edit')}
                            title="选择图标"
                          >
                            <Palette size={16} />
                          </button>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-fg-muted">
                          <input
                            type="checkbox"
                            checked={editProtected}
                            onChange={(e) => setEditProtected(e.target.checked)}
                            className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent dark:border-border-default dark:bg-surface"
                          />
                          <span>受导航统一锁保护</span>
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Icon name={cat.icon} size={16} />
                        <span className="font-medium text-fg truncate">
                          {getCategoryDisplayName ? getCategoryDisplayName(cat) : (cat.id === 'common' ? commonCategoryName : cat.name)}
                          {cat.id === 'common' && (
                            <span className="ml-2 text-xs text-fg-subtle">({defaultCategoryNote})</span>
                          )}
                        </span>
                        {(cat.protected || cat.password || cat.requireAuth) && (
                          <Lock size={12} className="text-fg-subtle" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-start mt-1">
                    {editingId === cat.id ? (
                       <button onClick={saveEdit} className="text-green-500 hover:bg-green-50 dark:hover:bg-slate-600 p-1.5 rounded bg-surface-elevated shadow-sm border border-border-default"><Check size={16}/></button>
                    ) : (
                       <>
                        {cat.id !== 'common' && (
                          <button onClick={() => handleStartEdit(cat)} className="p-1.5 text-fg-subtle hover:text-accent hover:bg-surface-muted rounded">
                              <Edit2 size={14} />
                          </button>
                        )}
                        {/* 只有非内置常用分类才显示删除按钮 */}
                        {cat.id !== 'common' && (
                            <button 
                            onClick={() => handleDeleteClick(cat)}
                            className="p-1.5 text-fg-subtle hover:text-red-500 hover:bg-surface-muted rounded"
                            >
                            <Trash2 size={14} />
                            </button>
                        )}
                        {/* 内置常用分类显示锁定图标 */}
                        {cat.id === 'common' && (
                            <button
                              onClick={() => toggleCategoryProtected(cat)}
                              className={`p-1.5 rounded transition-colors ${cat.protected || cat.password || cat.requireAuth ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-600' : 'text-fg-subtle hover:text-amber-500 hover:bg-surface-muted'}`}
                              title={`${commonCategoryLockedTitle}；点击切换导航统一锁保护`}
                            >
                              <Lock size={14} />
                            </button>
                        )}
                       </>
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border-default bg-surface-muted">
           <label className="text-xs font-semibold text-fg-subtle uppercase mb-2 block">添加新分类</label>
           <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2">
               <Icon name={newCatIcon} size={16} />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input 
                    type="text"
                    value={newCatNameZh}
                    onChange={(e) => setNewCatNameZh(e.target.value)}
                    placeholder="中文名称"
                    className="p-2 rounded-lg border border-border-default bg-surface text-fg text-sm focus:ring-2 focus:ring-accent outline-none"
                  />
                  <input 
                    type="text"
                    value={newCatNameEn}
                    onChange={(e) => setNewCatNameEn(e.target.value)}
                    placeholder="English name"
                    className="p-2 rounded-lg border border-border-default bg-surface text-fg text-sm focus:ring-2 focus:ring-accent outline-none"
                  />
                </div>
               <button
                 type="button"
                 className="p-1 text-gray-500 hover:text-accent transition-colors"
                 onClick={() => openIconSelector('new')}
                 title="选择图标"
               >
                 <Palette size={16} />
               </button>
             </div>
              <label className="flex items-center gap-2 text-sm text-fg-muted">
                <input
                  type="checkbox"
                  checked={newCatProtected}
                  onChange={(e) => setNewCatProtected(e.target.checked)}
                  className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent dark:border-border-default dark:bg-surface"
                />
                <span>受导航统一锁保护</span>
              </label>
              <button
                onClick={handleAdd}
                disabled={!newCatNameZh.trim()}
                className="bg-accent hover:opacity-90 disabled:opacity-50 text-accent-fg px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
           </div>
          
          {/* 图标选择器弹窗 */}
          {isIconSelectorOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-surface-elevated rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border-default">
                  <h3 className="text-lg font-semibold text-slate-800 text-fg">选择图标</h3>
                  <button
                    type="button"
                    onClick={cancelIconSelector}
                    className="p-1 rounded-md text-fg-subtle hover:text-slate-600 hover:bg-surface-muted transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <IconSelector 
                    onSelectIcon={(iconName) => {
                      handleIconSelect(iconName);
                      setIsIconSelectorOpen(false);
                      setIconSelectorTarget(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 分类操作密码验证弹窗 */}
          {isAuthModalOpen && pendingAction && (
            <CategoryActionAuthModal
              isOpen={isAuthModalOpen}
              onClose={handleAuthModalClose}
              onVerify={handlePasswordVerification}
              onVerified={handleAuthSuccess}
              actionType={pendingAction.type}
              categoryName={pendingAction.categoryName}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
