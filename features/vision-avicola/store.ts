"use client";

import { create } from "zustand";
import type { SimStatus } from "@/components/ui/controls";
import { MUESTRAS } from "./muestras";
import { clasificadorDemostrativo, type ResultadoClasificacion } from "./classifier";

export const ETAPAS_VISION = [
  { id: 1, nombre: "Identificación de la muestra", dur: 1.4 },
  { id: 2, nombre: "Captura de imagen", dur: 1.0 },
  { id: 3, nombre: "Preprocesamiento digital", dur: 2.4 },
  { id: 4, nombre: "Análisis por el modelo", dur: 2.6 },
  { id: 5, nombre: "Presentación del resultado", dur: 1.2 },
  { id: 6, nombre: "Alerta (si corresponde)", dur: 1.6 },
];

export interface Registro {
  n: number;
  hora: string;
  muestraId: string;
  categoria: string;
  confianza: number;
  alerta: boolean;
}

// Estado por cuadro, leído por la escena 3D
export const visionSim = { etapa: 0, tEtapa: 0 };

interface VisionStore {
  status: SimStatus;
  seleccion: string;
  etapa: number; // 0 = en espera, 1–6 etapas, 7 = terminado
  progreso: number; // 0 – 1 dentro de la etapa
  resultado: ResultadoClasificacion | null;
  historial: Registro[];
  seleccionar: (id: string) => void;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  defaults: () => void;
  borrarHistorial: () => void;
  step: (dt: number) => void;
  sample: () => void;
}

let contador = 0;

export const useVision = create<VisionStore>((set, get) => ({
  status: "detenido",
  seleccion: MUESTRAS[0].id,
  etapa: 0,
  progreso: 0,
  resultado: null,
  historial: [],

  seleccionar: (id) => {
    if (get().status === "ejecutando") return;
    visionSim.etapa = 0;
    visionSim.tEtapa = 0;
    set({ seleccion: id, etapa: 0, progreso: 0, resultado: null, status: "detenido" });
  },
  start: () => {
    if (visionSim.etapa === 0 || visionSim.etapa === 7) {
      visionSim.etapa = 1;
      visionSim.tEtapa = 0;
      set({ resultado: null });
    }
    set({ status: "ejecutando", etapa: visionSim.etapa });
  },
  pause: () => set({ status: get().status === "ejecutando" ? "pausado" : get().status }),
  toggle: () => (get().status === "ejecutando" ? get().pause() : get().start()),
  reset: () => {
    visionSim.etapa = 0;
    visionSim.tEtapa = 0;
    set({ status: "detenido", etapa: 0, progreso: 0, resultado: null });
  },
  defaults: () => {
    get().reset();
    set({ seleccion: MUESTRAS[0].id });
  },
  borrarHistorial: () => {
    contador = 0;
    set({ historial: [] });
  },

  step: (dt) => {
    const e = visionSim.etapa;
    if (e < 1 || e > 6) return;
    visionSim.tEtapa += dt;
    const dur = ETAPAS_VISION[e - 1].dur;
    if (visionSim.tEtapa < dur) return;
    visionSim.tEtapa = 0;
    const st = get();
    if (e === 4) {
      // Fin del análisis: se obtiene el resultado demostrativo
      const m = MUESTRAS.find((x) => x.id === st.seleccion)!;
      const r = clasificadorDemostrativo.clasificar(m);
      contador++;
      const hora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      set({
        resultado: r,
        historial: [{ n: contador, hora, muestraId: m.id, categoria: r.categoria, confianza: r.confianza, alerta: r.alerta }, ...st.historial].slice(0, 12),
      });
    }
    let siguiente = e + 1;
    if (siguiente === 6 && !get().resultado?.alerta) siguiente = 7;
    visionSim.etapa = siguiente;
    if (siguiente === 7) set({ status: "detenido", etapa: 7, progreso: 1 });
  },
  sample: () => {
    const e = visionSim.etapa;
    const dur = e >= 1 && e <= 6 ? ETAPAS_VISION[e - 1].dur : 1;
    set({ etapa: e, progreso: Math.min(1, visionSim.tEtapa / dur) });
  },
}));
