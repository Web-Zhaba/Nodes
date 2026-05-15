/// <reference types="@capacitor/core" />

declare module '@capacitor/haptics' {
  export enum ImpactStyle {
    Light = 'LIGHT',
    Medium = 'MEDIUM',
    Heavy = 'HEAVY',
  }
  export enum NotificationType {
    Success = 'SUCCESS',
    Warning = 'WARNING',
    Error = 'ERROR',
  }
  export const Haptics: {
    impact(options: { style: ImpactStyle }): Promise<void>;
    notification(options: { type: NotificationType }): Promise<void>;
    vibrate(): Promise<void>;
  };
}

declare global {
  interface Window {
    isCapacitor?: boolean;
    Capacitor?: import('@capacitor/core').CapacitorGlobal;
  }
}

export {};
