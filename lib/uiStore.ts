"use client";

import { create } from "zustand";

interface UiState {
  etiquetas: boolean;
  textoGrande: boolean;
  ayuda: boolean;
  toggleEtiquetas: () => void;
  toggleTextoGrande: () => void;
  setAyuda: (v: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  etiquetas: true,
  textoGrande: false,
  ayuda: false,
  toggleEtiquetas: () => set((s) => ({ etiquetas: !s.etiquetas })),
  toggleTextoGrande: () =>
    set((s) => {
      const v = !s.textoGrande;
      document.documentElement.classList.toggle("texto-grande", v);
      return { textoGrande: v };
    }),
  setAyuda: (v) => set({ ayuda: v }),
}));
