"use client";

import { create } from "zustand";
import type { SimStatus } from "@/components/ui/controls";
import {
  crearEstado,
  FS,
  MOTOR_DEFAULTS,
  paso,
  ultimasMuestras,
  VENTANA,
  type MotorParams,
} from "./simulation";
import { clasificadorDemostrativo, extraerCaracteristicas, type Caracteristicas, type Prediccion } from "./classifier";

// Estado físico mutable (se lee cuadro a cuadro desde la escena 3D sin re-renderizar React)
export const motorSim = { estado: crearEstado(), params: { ...MOTOR_DEFAULTS } };

export interface PuntoHistorial {
  t: number;
  rpm: number;
  temperatura: number;
  corriente: number;
  rms: number;
}

export interface RegistroVentana {
  id: number;
  t: number;
  clase: Prediccion["clase"];
}

const MAX_HIST = 300; // 30 s a 10 Hz
const ONDA = 300; // 0,3 s de señal mostrada

interface MotorStore {
  status: SimStatus;
  params: MotorParams;
  t: number;
  rpm: number;
  temperatura: number;
  corriente: number;
  historial: PuntoHistorial[];
  onda: { t: number; a: number }[];
  espectro: { f: number; a: number }[];
  caracteristicas: Caracteristicas | null;
  prediccion: Prediccion | null;
  registro: RegistroVentana[];
  setParam: <K extends keyof MotorParams>(k: K, v: MotorParams[K]) => void;
  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  defaults: () => void;
  step: (dt: number) => void;
  sample: () => void;
}

let ultimaClasificacion = -1;
let contadorVentanas = 0;

const vacio = () => ({
  t: 0,
  rpm: 0,
  temperatura: motorSim.estado.temperatura,
  corriente: 0,
  historial: [] as PuntoHistorial[],
  onda: [] as { t: number; a: number }[],
  espectro: [] as { f: number; a: number }[],
  caracteristicas: null,
  prediccion: null,
  registro: [] as RegistroVentana[],
});

export const useMotor = create<MotorStore>((set, get) => ({
  status: "detenido",
  params: { ...MOTOR_DEFAULTS },
  ...vacio(),

  setParam: (k, v) => {
    motorSim.params[k] = v;
    set({ params: { ...motorSim.params } });
  },
  start: () => set({ status: "ejecutando" }),
  pause: () => set({ status: get().status === "ejecutando" ? "pausado" : get().status }),
  toggle: () => (get().status === "ejecutando" ? get().pause() : get().start()),
  reset: () => {
    motorSim.estado = crearEstado();
    ultimaClasificacion = -1;
    contadorVentanas = 0;
    set({ status: "detenido", ...vacio() });
  },
  defaults: () => {
    motorSim.params = { ...MOTOR_DEFAULTS };
    set({ params: { ...MOTOR_DEFAULTS } });
  },

  step: (dt) => paso(motorSim.estado, motorSim.params, dt),

  sample: () => {
    const s = motorSim.estado;
    const punto: PuntoHistorial = {
      t: +s.t.toFixed(2),
      rpm: s.rpm,
      temperatura: s.temperatura,
      corriente: s.corriente,
      rms: get().caracteristicas?.rms ?? 0,
    };
    const historial = [...get().historial, punto].slice(-MAX_HIST);

    const ondaRaw = ultimasMuestras(s, ONDA);
    const onda = Array.from(ondaRaw, (a, i) => ({ t: +(((i - ONDA) / FS) * 1000).toFixed(0), a }));

    const update: Partial<MotorStore> = {
      t: s.t,
      rpm: s.rpm,
      temperatura: s.temperatura,
      corriente: s.corriente,
      historial,
      onda,
    };

    // Una ventana de 512 muestras (≈0,5 s) se clasifica cada 0,5 s
    if (s.vibTotal >= VENTANA && s.t - ultimaClasificacion >= 0.5) {
      ultimaClasificacion = s.t;
      const { c, espectro } = extraerCaracteristicas(ultimasMuestras(s, VENTANA), s.rpm, s.temperatura, s.corriente);
      const df = FS / VENTANA;
      const fMax = 320;
      const esp: { f: number; a: number }[] = [];
      for (let k = 1; k * df <= fMax; k++) esp.push({ f: +(k * df).toFixed(1), a: espectro[k] });
      const prediccion = clasificadorDemostrativo.predecir(c);
      contadorVentanas++;
      update.caracteristicas = c;
      update.espectro = esp;
      update.prediccion = prediccion;
      update.registro = [{ id: contadorVentanas, t: s.t, clase: prediccion.clase }, ...get().registro].slice(0, 8);
    }
    set(update);
  },
}));
