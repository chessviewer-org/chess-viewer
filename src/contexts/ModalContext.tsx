import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Modal, { ModalType } from '@shared/ui/Modal/Modal';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ModalContextType {
  showAlert: (title: string, message: string, type?: ModalType) => Promise<void>;
  showConfirm: (title: string, message: string, type?: ModalType) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showAlert = useCallback((title: string, message: string, type: ModalType = 'info') => {
    return new Promise<void>((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve();
        },
        onCancel: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve();
        }
      });
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, type: ModalType = 'warning') => {
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
  }, []);

  const value = useMemo(
    () => ({ showAlert, showConfirm }),
    [showAlert, showConfirm]
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
