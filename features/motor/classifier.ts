// Clasificador DEMOSTRATIVO basado en umbrales.
// No es un modelo TinyML entrenado: imita la salida que tendría uno para fines didácticos.
// La interfaz `Clasificador` permite reemplazarlo por un modelo real en el futuro.

import { clamp } from "@/lib/math";
import { magnitudeSpectrum } from "@/lib/fft";
import { FS, PLACA } from "./simulation";

export type Clase = "Normal" | "Advertencia" | "Anomalía" | "Motor detenido";

export interface Caracteristicas {
  rms: number; // m/s²
  pico: number; // m/s²
  a1x: number; // amplitud a 1× [m/s²]
  a2x: number; // amplitud a 2× [m/s²]
  altaFrecuencia: number; // energía por encima de 2,5×
  temperatura: number;
  corriente: number;
  f1: number;
}

export interface Prediccion {
  clase: Clase;
  puntuaciones: { normal: number; advertencia: number; anomalia: number };
  causa: string;
}

export interface Clasificador {
  nombre: string;
  predecir(c: Caracteristicas): Prediccion;
}

export function extraerCaracteristicas(
  ventana: Float64Array,
  rpm: number,
  temperatura: number,
  corriente: number,
): { c: Caracteristicas; espectro: Float64Array } {
  let suma = 0;
  let pico = 0;
  for (const v of ventana) {
    suma += v * v;
    pico = Math.max(pico, Math.abs(v));
  }
  const rms = Math.sqrt(suma / ventana.length);
  const espectro = magnitudeSpectrum(ventana);
  const df = FS / ventana.length;
  const f1 = rpm / 60;

  // Máximo en un entorno de ±2 bins alrededor de una frecuencia
  const amp = (f: number) => {
    if (f <= 0) return 0;
    const k = Math.round(f / df);
    let m = 0;
    for (let i = Math.max(1, k - 2); i <= Math.min(espectro.length - 1, k + 2); i++)
      m = Math.max(m, espectro[i]);
    return m;
  };

  let alta = 0;
  const kMin = Math.ceil((2.6 * f1) / df);
  for (let i = Math.max(kMin, 1); i < espectro.length; i++) alta += espectro[i] * espectro[i];

  return {
    c: {
      rms,
      pico,
      a1x: amp(f1),
      a2x: amp(2 * f1),
      altaFrecuencia: Math.sqrt(alta),
      temperatura,
      corriente,
      f1,
    },
    espectro,
  };
}

export const clasificadorDemostrativo: Clasificador = {
  nombre: "Lógica demostrativa basada en umbrales",
  predecir(c) {
    if (c.f1 < 0.5) {
      return {
        clase: "Motor detenido",
        puntuaciones: { normal: 0, advertencia: 0, anomalia: 0 },
        causa: "Sin giro: no se evalúa la ventana.",
      };
    }
    const indicadores: [number, string][] = [
      [clamp((c.rms - 1.1) / 1.2, 0, 1), "nivel global de vibración (RMS) elevado"],
      [clamp((c.a2x / Math.max(c.a1x, 0.05) - 0.6) / 0.9, 0, 1), "componente 2× alta: posible desalineación"],
      [clamp((c.altaFrecuencia - 0.35) / 0.6, 0, 1), "energía de alta frecuencia: patrón tipo rodamiento"],
      [clamp((c.temperatura - 80) / 25, 0, 1), "temperatura de carcasa elevada"],
      [clamp((c.corriente - PLACA.corrienteNominal * 0.98) / 2.2, 0, 1), "corriente por encima de la nominal"],
    ];
    indicadores.sort((a, b) => b[0] - a[0]);
    const s = indicadores[0][0];

    // Pertenencias triangulares para las tres clases (suman 1)
    const normal = clamp(1 - s / 0.45, 0, 1);
    const anomalia = clamp((s - 0.5) / 0.4, 0, 1);
    const advertencia = clamp(1 - normal - anomalia, 0, 1);
    const clase: Clase = anomalia >= 0.5 ? "Anomalía" : normal >= 0.5 ? "Normal" : "Advertencia";
    return {
      clase,
      puntuaciones: { normal, advertencia, anomalia },
      causa: clase === "Normal" ? "Todas las características dentro de los rangos esperados." : `Motivo principal: ${indicadores[0][1]}.`,
    };
  },
};
