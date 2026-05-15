import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';

export async function initializeMobileApp() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Set status bar style based on theme
    const isDark = document.documentElement.classList.contains('dark');
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: isDark ? '#030303' : '#ffffff' });
  } catch (e) {
    console.warn('StatusBar init failed', e);
  }

  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
  } catch (e) {
    console.warn('Keyboard init failed', e);
  }

  // Handle app state changes
  App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      await SplashScreen.hide();
    }
  });

  // Handle network status
  Network.addListener('networkStatusChange', (status) => {
    console.log('Network status changed', status.connected);
  });

  // Hide splash after init
  setTimeout(() => {
    SplashScreen.hide();
  }, 1500);
}

export const isNative = () => Capacitor.isNativePlatform();
