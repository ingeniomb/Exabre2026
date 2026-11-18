// Modelo térmico simplificado de una tostadora de tambor horizontal calentada por gas.
// Curvas ILUSTRATIVAS: no sustituyen un perfil de tostión medido.

import { clamp, firstOrder } from "@/lib/math";

export interface TostadoraParams {
  rpm: number; // velocidad del tambor 20 – 90
  intensidad: number; // 0 – 100 %
  tiempoObjetivo: number; // minutos 8 – 20
  escala: number; // aceleración del tiempo (×10, ×30, ×60)
}

export const TOSTADORA_DEFAULTS: TostadoraParams = {
  rpm: 50,
  intensidad: 70,
  tiempoObjetivo: 12,
  escala: 30,
};

/** Geometría y constantes del equipo. */
export const EQUIPO = {
  diametro: 0.5, // m
  tAmbiente: 22,
  // Velocidad crítica (centrifugado de los granos): n_c ≈ 42,3 / √D  [RPM, D en m]
  get rpmCritica() {
    return 42.3 / Math.sqrt(this.diametro);
  },
};

export type Fase = "listo" | "tostando" | "enfriando" | "terminado";

export interface Etapa {
  id: string;
  nombre: string;
  desde: number; // °C del grano
  hasta: number;
  color: string;
  descripcion: string;
}

export const ETAPAS: Etapa[] = [
  { id: "carga", nombre: "Carga", desde: -100, hasta: 100, color: "#4d7c0f", descripcion: "El grano verde entra al tambor caliente; su temperatura baja primero y luego empieza a subir." },
  { id: "secado", nombre: "Secado", desde: 100, hasta: 150, color: "#65a30d", descripcion: "Se evapora la humedad del grano (≈10–12 %)." },
  { id: "amarilleo", nombre: "Amarilleo", desde: 150, hasta: 165, color: "#ca8a04", descripcion: "El grano pasa de verde a amarillo y huele a pan o heno." },
  { id: "maillard", nombre: "Maillard", desde: 165, hasta: 196, color: "#b45309", descripcion: "Reacciones entre azúcares y aminoácidos: aparecen color marrón y aromas." },
  { id: "crack", nombre: "Primer crack", desde: 196, hasta: 206, color: "#92400e", descripcion: "El vapor interno rompe la estructura del grano con un chasquido audible." },
  { id: "desarrollo", nombre: "Desarrollo", desde: 206, hasta: 232, color: "#78350f", descripcion: "Se ajusta el punto final del tueste: claro, medio u oscuro." },
  { id: "oscuro", nombre: "Tueste muy oscuro", desde: 232, hasta: 999, color: "#451a03", descripcion: "Riesgo de sabores quemados; se recomienda descargar." },
];

export function etapaDe(tGrano: number, fase: Fase): Etapa | { id: string; nombre: string; color: string; descripcion: string } {
  if (fase === "listo") return { id: "listo", nombre: "Tambor precalentado", color: "#475569", descripcion: "Listo para cargar el grano verde." };
  if (fase === "enfriando") return { id: "enfriando", nombre: "Descarga y enfriamiento", color: "#0ea5e9", descripcion: "Los granos se descargan y se enfrían para detener el tueste." };
  if (fase === "terminado") return { id: "terminado", nombre: "Proceso terminado", color: "#22c55e", descripcion: "Café tostado y frío." };
  return ETAPAS.find((e) => tGrano >= e.desde && tGrano < e.hasta) ?? ETAPAS[0];
}

/** Color del grano según la temperatura máxima alcanzada (avance del tueste). */
const PALETA_GRANO: [number, [number, number, number]][] = [
  [22, [0.42, 0.55, 0.27]],
  [120, [0.48, 0.56, 0.28]],
  [150, [0.74, 0.66, 0.36]],
  [170, [0.66, 0.43, 0.2]],
  [196, [0.45, 0.27, 0.14]],
  [215, [0.3, 0.17, 0.09]],
  [232, [0.18, 0.1, 0.05]],
  [250, [0.09, 0.05, 0.03]],
];

export function colorGrano(tMax: number): [number, number, number] {
  for (let i = 1; i < PALETA_GRANO.length; i++) {
    const [t1, c1] = PALETA_GRANO[i];
    const [t0, c0] = PALETA_GRANO[i - 1];
    if (tMax <= t1) {
      const u = clamp((tMax - t0) / (t1 - t0), 0, 1);
      return [c0[0] + (c1[0] - c0[0]) * u, c0[1] + (c1[1] - c0[1]) * u, c0[2] + (c1[2] - c0[2]) * u];
    }
  }
  return PALETA_GRANO[PALETA_GRANO.length - 1][1];
}

export function nivelTueste(tMax: number): string {
  if (tMax < 196) return "Sin tostar / incompleto";
  if (tMax < 210) return "Claro";
  if (tMax < 224) return "Medio";
  if (tMax < 240) return "Oscuro";
  return "Muy oscuro";
}

/** Factor de mezcla según la velocidad: óptimo cerca de 0,7·n_c y malo por encima de n_c (centrifugado). */
export function factorMezcla(rpm: number): number {
  const nc = EQUIPO.rpmCritica;
  const x = rpm / nc;
  if (x >= 1) return 0.35;
  return clamp(0.35 + 0.65 * Math.sin((Math.PI / 2) * Math.min(x / 0.7, 1)) - (x > 0.85 ? (x - 0.85) * 2 : 0), 0.3, 1);
}

export interface TostadoraState {
  t: number; // s simulados desde la carga
  fase: Fase;
  tTambor: number;
  tGrano: number;
  tMax: number;
  ror: number; // °C/min
  llama: number; // 0 – 1
  dispersion: number; // falta de uniformidad 0 – 1
  tGranoPrevio: number;
  tRor: number;
}

export function crearEstado(p: TostadoraParams = TOSTADORA_DEFAULTS): TostadoraState {
  const tPre = objetivoTambor(p.intensidad);
  return {
    t: 0,
    fase: "listo",
    tTambor: tPre,
    tGrano: EQUIPO.tAmbiente,
    tMax: EQUIPO.tAmbiente,
    ror: 0,
    llama: p.intensidad / 100,
    dispersion: 0,
    tGranoPrevio: EQUIPO.tAmbiente,
    tRor: 0,
  };
}

export function objetivoTambor(intensidad: number) {
  return EQUIPO.tAmbiente + 2.9 * intensidad;
}

/** Avanza el modelo dtSim segundos SIMULADOS. */
export function paso(s: TostadoraState, p: TostadoraParams, dtSim: number) {
  if (s.fase === "terminado") return;
  s.t += dtSim;

  if (s.fase === "tostando") {
    s.llama = firstOrder(s.llama, p.intensidad / 100, 3, dtSim);
    const m = factorMezcla(p.rpm);
    // Tambor: se acerca a la temperatura que impone la llama y cede calor a la carga de granos
    const dTd = (objetivoTambor(s.llama * 100) - s.tTambor) / 90 - 0.0025 * (s.tTambor - s.tGrano);
    s.tTambor += dTd * dtSim;
    // Grano: transferencia de calor proporcional a la mezcla
    s.tGrano += 0.0042 * m * (s.tTambor - s.tGrano) * dtSim;
    // Mezcla deficiente → tueste disparejo
    s.dispersion = firstOrder(s.dispersion, 1 - m, 60, dtSim);
    if (s.t >= p.tiempoObjetivo * 60) s.fase = "enfriando";
  } else if (s.fase === "enfriando") {
    s.llama = firstOrder(s.llama, 0, 2, dtSim);
    s.tGrano = firstOrder(s.tGrano, EQUIPO.tAmbiente + 3, 70, dtSim);
    s.tTambor = firstOrder(s.tTambor, objetivoTambor(15), 300, dtSim);
    if (s.tGrano < 40) s.fase = "terminado";
  }

  s.tMax = Math.max(s.tMax, s.tGrano);

  // Tasa de aumento (RoR) calculada cada 15 s simulados
  s.tRor += dtSim;
  if (s.tRor >= 15) {
    s.ror = ((s.tGrano - s.tGranoPrevio) / s.tRor) * 60;
    s.tGranoPrevio = s.tGrano;
    s.tRor = 0;
  }
}
