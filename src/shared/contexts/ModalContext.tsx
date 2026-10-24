/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';
import { useLocation } from 'wouter';

import { Modal, type ModalType } from '@/shared/ui/Modal/Modal';

// Types
interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ModalContextType {
  showAlert: (
    title: string,
    message: string,
    type?: ModalType
  ) => Promise<void>;
  showConfirm: (
    title: string,
    message: string,
    type?: ModalType
  ) => Promise<boolean>;
  openAuthModal: (tab: 'signin' | 'signup' | 'security') => void;
}

// Context
const ModalContext = createContext<ModalContextType | undefined>(undefined);
const AUTH_ROUTES = {
  signin: '/auth/sign-in',
  signup: '/auth/sign-up',
  security: '/settings?tab=security'
} as const;

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const openAuthModal = useCallback(
    (tab: 'signin' | 'signup' | 'security') => {
      navigate(AUTH_ROUTES[tab]);
    },
    [navigate]
  );
  // State
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Actions
  const showAlert = useCallback(
    (title: string, message: string, type: ModalType = 'info') => {
      return new Promise<void>((resolve) => {
        const close = () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve();
        };
        setModalState({
          isOpen: true,
          title,
          message,
          type,
          onConfirm: close,
          onCancel: close
        });
      });
    },
    []
  );

  const showConfirm = useCallback(
    (title: string, message: string, type: ModalType = 'warning') => {
      return new Promise<boolean>((resolve) => {
        setModalState({
          isOpen: true,
          title,
          message,
          type,
          onConfirm: () => {
            setModalState((prev) => ({ ...prev, isOpen: false }));
            resolve(true);
          },
          onCancel: () => {
            setModalState((prev) => ({ ...prev, isOpen: false }));
            resolve(false);
          }
        });
      });
    },
    []
  );

  const value = useMemo(
    () => ({ showAlert, showConfirm, openAuthModal }),
    [showAlert, showConfirm, openAuthModal]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
