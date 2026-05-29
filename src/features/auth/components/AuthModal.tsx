import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import type { AuthModalProps, AuthTab } from '../types';
import { MfaVerification } from './MfaVerification';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import { TwoFactorSetup } from './TwoFactorSetup';

export function AuthModal({ isOpen, onClose, initialTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab | 'mfa'>(initialTab);
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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-bg"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content — max-h + overflow for viewport safety */}
      <motion.div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.05 }
        }}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-border bg-bg shadow-2xl overflow-hidden"
      >
        {/* Header — fixed height */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-bg shrink-0">
          <h2 className="text-xl font-bold font-display text-text-primary">
            {activeTab === 'signin' && 'Welcome Back'}
            {activeTab === 'signup' && 'Create Account'}
            {activeTab === 'security' && 'Security Settings'}
            {activeTab === 'mfa' && 'Security Verification'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {activeTab !== 'security' && activeTab !== 'mfa' && (
            <>
              <div className="flex gap-2 mb-5 bg-surface-elevated p-1.5 rounded-xl border border-border">
                <button 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'signin' ? 'bg-bg text-text-primary shadow-sm ring-1 ring-border' : 'text-text-secondary hover:text-text-primary'}`}
                  onClick={() => setActiveTab('signin')}
                >
                  Sign In
                </button>
                <button 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${activeTab === 'signup' ? 'bg-bg text-text-primary shadow-sm ring-1 ring-border' : 'text-text-secondary hover:text-text-primary'}`}
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
            {activeTab === 'signin' && (
              <SignIn 
                onSuccess={onClose} 
                onMfaRequired={() => setActiveTab('mfa')}
              />
            )}
            {activeTab === 'signup' && <SignUp />}
            {activeTab === 'mfa' && (
              <MfaVerification 
                onSuccess={onClose} 
                onBack={() => setActiveTab('signin')}
              />
            )}
            {activeTab === 'security' && (
              <div className="rounded-xl">
                <TwoFactorSetup />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

export default AuthModal;
