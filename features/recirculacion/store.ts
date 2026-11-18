"use client";

import { create } from "zustand";
import type { SimStatus } from "@/components/ui/controls";
import { bombaFuncionando, crearEstado, nivelPct, paso, PARAMS, type RecirculacionState, type ValvulaId } from "./simulation";

export const recSim = { estado: crearEstado() };

export interface PuntoRec {
  min: number;
  qBomba: number;
  qNueva: number;
  nivel: number;
  colmatacion: number;
}

type Snapshot = Pick<
  RecirculacionState,
  "t" | "qNueva" | "qAspersion" | "qSalida" | "qBomba" | "qRetorno" | "qRebose" | "colmatacion" | "bombaOrden" | "bombaProteccion" | "peladora"
> & { nivelPct: number; recuperacion: number; valvulas: Record<ValvulaId, boolean> };

interface RecStore extends Snapshot {
  status: SimStatus;
  ruta: boolean;
  mantenimiento: boolean;
  historial: PuntoRec[];
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  defaults: () => void;
  bomba: (on: boolean) => void;
  toggleValvula: (v: ValvulaId) => void;
  togglePeladora: () => void;
  limpiarFiltro: () => void;
  setRuta: (v: boolean) => void;
  setMantenimiento: (v: boolean) => void;
  step: (dt: number) => void;
  sample: () => void;
}

let ultimo = -999;

function snapshot(): Snapshot {
  const s = recSim.estado;
  return {
    t: s.t,
    qNueva: s.qNueva,
    qAspersion: s.qAspersion,
    qSalida: s.qSalida,
    qBomba: s.qBomba,
    qRetorno: s.qRetorno,
    qRebose: s.qRebose,
    colmatacion: s.colmatacion,
    bombaOrden: s.bombaOrden,
    bombaProteccion: s.bombaProteccion,
    peladora: s.peladora,
    nivelPct: nivelPct(s),
    recuperacion: s.totalUsado > 0 ? (s.totalRecuperado / s.totalUsado) * 100 : 0,
    valvulas: { ...s.valvulas },
  };
}

export const useRecirculacion = create<RecStore>((set, get) => ({
  status: "detenido",
  ruta: false,
  mantenimiento: false,
  historial: [],
  ...snapshot(),

  start: () => {
    // Al iniciar se pone en marcha la peladora y la bomba
    recSim.estado.bombaOrden = true;
    set({ status: "ejecutando", ...snapshot() });
  },
  pause: () => set({ status: get().status === "ejecutando" ? "pausado" : get().status }),
  toggle: () => (get().status === "ejecutando" ? get().pause() : get().start()),
  reset: () => {
    recSim.estado = crearEstado();
    ultimo = -999;
    set({ status: "detenido", historial: [], mantenimiento: false, ruta: false, ...snapshot() });
  },
  defaults: () => {
    const s = recSim.estado;
    s.valvulas = { v0: true, v1: true, v2: true, v3: true };
    s.peladora = true;
    set({ ...snapshot() });
  },
  bomba: (on) => {
    recSim.estado.bombaOrden = on;
    paso(recSim.estado, 0);
    set({ ...snapshot() });
  },
  toggleValvula: (v) => {
    recSim.estado.valvulas[v] = !recSim.estado.valvulas[v];
    paso(recSim.estado, 0);
    set({ ...snapshot() });
  },
  togglePeladora: () => {
    recSim.estado.peladora = !recSim.estado.peladora;
    paso(recSim.estado, 0);
    set({ ...snapshot() });
  },
  limpiarFiltro: () => {
    recSim.estado.colmatacion = 0.05;
    paso(recSim.estado, 0);
    set({ ...snapshot() });
  },
  setRuta: (ruta) => set({ ruta }),
  setMantenimiento: (mantenimiento) => set({ mantenimiento }),

  step: (dt) => paso(recSim.estado, dt * PARAMS.escala),
  sample: () => {
    const s = recSim.estado;
    const update: Partial<RecStore> = snapshot();
    if (s.t - ultimo >= 6) {
      ultimo = s.t;
      update.historial = [
        ...get().historial,
        { min: +(s.t / 60).toFixed(2), qBomba: s.qBomba, qNueva: s.qNueva, nivel: nivelPct(s), colmatacion: s.colmatacion * 100 },
      ].slice(-400);
    }
    set(update);
  },
}));

export { bombaFuncionando };
