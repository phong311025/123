import { useState, useEffect, ReactNode } from 'react';
import { X, Save } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function Drawer({ isOpen, onClose, eyebrow, title, children }: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <div 
        className={`overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose} 
      />
      <aside 
        className={`drawer ${isOpen ? 'open' : ''}`} 
        aria-hidden={!isOpen}
      >
        <div className="drawer-header">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <button 
            className="icon-button" 
            onClick={onClose} 
            aria-label="Đóng" 
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="drawer-form">
          {children}
        </div>
      </aside>
    </>
  );
}
