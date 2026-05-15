/// <reference types="@capacitor/core" />

declare global {
  interface Window {
    isCapacitor?: boolean;
    Capacitor?: import('@capacitor/core').CapacitorGlobal;
  }
}

export {};
