import { create } from "zustand";

interface OnboardingState {
  step: number;
  isOpen: boolean;
  createdNodeId: string | null;
  createdCoreId: string | null;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  open: () => void;
  close: () => void;
  setCreatedNodeId: (id: string | null) => void;
  setCreatedCoreId: (id: string | null) => void;
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  step: 0,
  isOpen: false,
  createdNodeId: null,
  createdCoreId: null,
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: s.step + 1 })),
  prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
  open: () => set({ step: 0, isOpen: true, createdNodeId: null, createdCoreId: null }),
  close: () => set({ isOpen: false }),
  setCreatedNodeId: (id) => set({ createdNodeId: id }),
  setCreatedCoreId: (id) => set({ createdCoreId: id }),
}));
