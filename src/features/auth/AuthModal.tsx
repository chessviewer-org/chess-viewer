import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import { TwoFactorSetup } from './TwoFactorSetup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'signup' | 'security';
}

export function AuthModal({ isOpen, onClose, initialTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'security'>(initialTab);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-bg/90 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md sm:max-w-lg rounded-2xl border border-border bg-surface-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-primary">
          <h2 className="text-xl font-bold font-display text-text-primary">
            {activeTab === 'signin' && 'Welcome Back'}
            {activeTab === 'signup' && 'Create Account'}
            {activeTab === 'security' && 'Security Settings'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {activeTab !== 'security' && (
            <>
              <div className="flex gap-2 mb-5 bg-surface-elevated p-1.5 rounded-xl border border-border">
                <button 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'signin' ? 'bg-surface-primary text-text-primary shadow-sm ring-1 ring-border' : 'text-text-secondary hover:text-text-primary'}`}
                  onClick={() => setActiveTab('signin')}
                >
                  Sign In
                </button>
                <button 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'signup' ? 'bg-surface-primary text-text-primary shadow-sm ring-1 ring-border' : 'text-text-secondary hover:text-text-primary'}`}
                  onClick={() => setActiveTab('signup')}
                >
                  Sign Up
                </button>
              </div>
              <p className="text-text-secondary text-sm mb-5 text-center">
                Save your boards to the cloud and sync across all your devices.
              </p>
            </>
          )}

          <div className="mt-2">
            {activeTab === 'signin' && <SignIn onSuccess={onClose} />}
            {activeTab === 'signup' && <SignUp />}
            {activeTab === 'security' && (
              <div className="bg-surface-primary rounded-xl">
                <TwoFactorSetup />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
