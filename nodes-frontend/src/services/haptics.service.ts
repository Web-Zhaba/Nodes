import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!isNative()) return;
  try {
    const impactMap: Record<string, ImpactStyle> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: impactMap[style] });
  } catch (e) {
    console.warn('Haptics impact failed', e);
  }
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!isNative()) return;
  try {
    const notificationMap: Record<string, NotificationType> = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    };
    await Haptics.notification({ type: notificationMap[type] });
  } catch (e) {
    console.warn('Haptics notification failed', e);
  }
}

export async function hapticVibrate() {
  if (!isNative()) return;
  try {
    await Haptics.vibrate();
  } catch (e) {
    console.warn('Haptics vibrate failed', e);
  }
}

export function useHaptics() {
  return {
    impact: hapticImpact,
    notification: hapticNotification,
    vibrate: hapticVibrate,
  };
}
