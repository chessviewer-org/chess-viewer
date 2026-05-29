import { useCallback, useEffect } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { ADVANCED_FEN_CONFIG } from '@constants';

import { logger } from '@utils';

/** Options for the useAdvancedNavigation hook. */
interface UseAdvancedNavigationOptions {
  favorites: unknown;
  positionSettings: unknown;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/** Provides back navigation, settings redirect, and restores the active tab from location state. */
export function useAdvancedNavigation({
  favorites,
  positionSettings,
  activeTab,
  setActiveTab
}: UseAdvancedNavigationOptions) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    const restoreTab = state?.['restoreTab'] as string | undefined;
    if (restoreTab) {
      setActiveTab(restoreTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setActiveTab]);

  const handleBack = useCallback(() => {
    try {
      localStorage.setItem(
        ADVANCED_FEN_CONFIG.STORAGE_KEYS.FAVORITES,
        JSON.stringify(favorites)
      );
      localStorage.setItem(
        'advanced-fen-position-settings',
        JSON.stringify(positionSettings)
      );
    } catch (err) {
      logger.warn('Failed to save settings:', err);
    }
    navigate(-1);
  }, [navigate, favorites, positionSettings]);

  const handleSettingsClick = useCallback(() => {
    navigate('/settings', {
      state: { returnTo: '/advanced-fen', returnTab: activeTab }
    });
  }, [navigate, activeTab]);

  const handleNotification = useCallback((message: string, type: string) => {
    logger.log(`[${type}] ${message}`);
  }, []);

  return { handleBack, handleSettingsClick, handleNotification };
}
