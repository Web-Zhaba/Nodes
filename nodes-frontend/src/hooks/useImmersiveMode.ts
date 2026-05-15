import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

export function useImmersiveMode(enabled: boolean = true) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !enabled) return;

    const hideStatusBar = async () => {
      try {
        await StatusBar.hide();
      } catch (e) {
        console.warn('Hide StatusBar failed', e);
      }
    };

    const showStatusBar = async () => {
      try {
        await StatusBar.show();
      } catch (e) {
        console.warn('Show StatusBar failed', e);
      }
    };

    hideStatusBar();

    return () => {
      showStatusBar();
    };
  }, [enabled]);
}
