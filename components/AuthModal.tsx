import React, { useEffect, useState } from 'react';
import { Lock, ArrowRight, Loader2, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onLogin: (password: string) => Promise<boolean>;
  onClose?: () => void;
  canClose?: boolean;
  description?: string;
  title?: string;
  passwordPlaceholder?: string;
  submitLabel?: string;
  closeLabel?: string;
  errorMessage?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLogin,
  onClose,
  canClose = false,
  description,
  title = 'Authentication',
  passwordPlaceholder = 'Access password',
  submitLabel = 'Unlock',
  closeLabel = 'Close authentication',
  errorMessage = 'Incorrect password or server unavailable',
}) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const success = await onLogin(password);
    if (!success) {
      setError(errorMessage);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="relative bg-surface-elevated rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-default p-8">
        {canClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-fg-subtle hover:text-fg hover:bg-surface-muted transition-colors"
            aria-label={closeLabel}
          >
            <X size={18} />
          </button>
        )}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-accent-soft rounded-full flex items-center justify-center mb-4 text-accent">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold text-fg">{title}</h2>
          <p className="text-sm text-fg-muted text-center mt-2">
            {description || 'Enter the PASSWORD configured at deployment to continue.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-border-default bg-surface text-fg focus:ring-2 focus:ring-accent outline-none transition-all text-center tracking-widest"
              placeholder={passwordPlaceholder}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-accent-fg font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <>{submitLabel} <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
