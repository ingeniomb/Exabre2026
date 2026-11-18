"use client";

import { create } from "zustand";
import type { SimStatus } from "@/components/ui/controls";
import { crearEstado, paso, TOSTADORA_DEFAULTS, type Fase, type TostadoraParams } from "./simulation";

export const tostadoraSim = {
  estado: crearEstado(),
  params: { ...TOSTADORA_DEFAULTS },
};

export type Vista = "exterior" | "corte";

export interface PuntoTostion {
  min: number;
  grano: number;
  tambor: number;
}

interface TostadoraStore {
  status: SimStatus;
  params: TostadoraParams;
  vista: Vista;
  t: number;
  fase: Fase;
  tGrano: number;
  tTambor: number;
  tMax: number;
  ror: number;
  dispersion: number;
  historial: PuntoTostion[];
  setParam: <K extends keyof TostadoraParams>(k: K, v: TostadoraParams[K]) => void;
  setVista: (v: Vista) => void;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  defaults: () => void;
  step: (dt: number) => void;
  sample: () => void;
}

let ultimoRegistro = -999;

function snapshot() {
  const s = tostadoraSim.estado;
  return { t: s.t, fase: s.fase, tGrano: s.tGrano, tTambor: s.tTambor, tMax: s.tMax, ror: s.ror, dispersion: s.dispersion };
}

export const useTostadora = create<TostadoraStore>((set, get) => ({
  status: "detenido",
  params: { ...TOSTADORA_DEFAULTS },
  vista: "corte",
  ...snapshot(),
  historial: [],

  setParam: (k, v) => {
    tostadoraSim.params[k] = v;
    // Antes de cargar, el tambor se precalienta a la temperatura de la nueva intensidad
    if (k === "intensidad" && tostadoraSim.estado.fase === "listo") {
      tostadoraSim.estado = crearEstado(tostadoraSim.params);
    }
    set({ params: { ...tostadoraSim.params }, ...snapshot() });
  },
  setVista: (vista) => set({ vista }),
  start: () => {
    const s = tostadoraSim.estado;
    if (s.fase === "terminado") {
      tostadoraSim.estado = crearEstado(tostadoraSim.params);
      ultimoRegistro = -999;
      set({ historial: [] });
    }
    if (tostadoraSim.estado.fase === "listo") tostadoraSim.estado.fase = "tostando";
    set({ status: "ejecutando", ...snapshot() });
  },
  pause: () => set({ status: get().status === "ejecutando" ? "pausado" : get().status }),
  toggle: () => (get().status === "ejecutando" ? get().pause() : get().start()),
  reset: () => {
    tostadoraSim.estado = crearEstado(tostadoraSim.params);
    ultimoRegistro = -999;
    set({ status: "detenido", historial: [], ...snapshot() });
  },
  defaults: () => {
    tostadoraSim.params = { ...TOSTADORA_DEFAULTS };
    if (tostadoraSim.estado.fase === "listo") tostadoraSim.estado = crearEstado(tostadoraSim.params);
    set({ params: { ...TOSTADORA_DEFAULTS }, ...snapshot() });
  },

  // dt real → dt simulado con la escala de tiempo
  step: (dt) => {
    paso(tostadoraSim.estado, tostadoraSim.params, dt * tostadoraSim.params.escala);
  },
  sample: () => {
    const s = tostadoraSim.estado;
    const update: Partial<TostadoraStore> = snapshot();
    if (s.t - ultimoRegistro >= 5 && s.fase !== "listo") {
      ultimoRegistro = s.t;
      update.historial = [...get().historial, { min: +(s.t / 60).toFixed(3), grano: s.tGrano, tambor: s.tTambor }].slice(-600);
    }
    if (s.fase === "terminado") update.status = "detenido";
    set(update);
  },
}));
