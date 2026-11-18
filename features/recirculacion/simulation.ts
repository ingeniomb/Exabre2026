// Balance de masa CONCEPTUAL de un sistema de recirculación de agua para una peladora de pollos.
// Valores ilustrativos: no representan un diseño validado ni certifican la calidad del agua.

import { clamp } from "@/lib/math";

export type ValvulaId = "v0" | "v1" | "v2" | "v3";

export const VALVULAS: Record<ValvulaId, { nombre: string; funcion: string }> = {
  v0: { nombre: "V0 · Agua nueva", funcion: "Reposición desde la red o tanque de agua limpia" },
  v1: { nombre: "V1 · Salida de la peladora", funcion: "Drenaje del agua utilizada hacia la canaleta" },
  v2: { nombre: "V2 · Succión de la bomba", funcion: "Conecta el depósito con la bomba" },
  v3: { nombre: "V3 · Retorno", funcion: "Envía el agua tratada de regreso a la peladora" },
};

export const PARAMS = {
  demanda: 40, // L/min que requiere la aspersión de la peladora
  perdidas: 0.1, // fracción que se va con el producto, salpicaduras y plumas
  purga: 0.05, // fracción purgada como lodos en sedimentación
  qBomba: 50, // L/min con el filtro limpio
  volumenDeposito: 400, // L
  nivelArranque: 35, // % para volver a arrancar tras protección
  nivelParo: 15, // % protección contra funcionamiento en seco
  colmatacionPorLitro: 1.8e-4, // fracción del filtro que se tapa por litro tratado
  escala: 20, // aceleración del tiempo
};

export interface RecirculacionState {
  t: number; // s simulados
  nivel: number; // L en el depósito
  bombaOrden: boolean; // el operador la encendió
  bombaProteccion: boolean; // disparada por nivel bajo
  colmatacion: number; // 0 – 1
  valvulas: Record<ValvulaId, boolean>;
  peladora: boolean;
  // Caudales instantáneos [L/min]
  qNueva: number;
  qAspersion: number;
  qSalida: number;
  qBomba: number;
  qRetorno: number;
  qRebose: number;
  // Totales [L]
  totalUsado: number;
  totalRecuperado: number;
}

export function crearEstado(): RecirculacionState {
  return {
    t: 0,
    nivel: 0.5 * PARAMS.volumenDeposito,
    bombaOrden: false,
    bombaProteccion: false,
    colmatacion: 0.1,
    valvulas: { v0: true, v1: true, v2: true, v3: true },
    peladora: true,
    qNueva: 0,
    qAspersion: 0,
    qSalida: 0,
    qBomba: 0,
    qRetorno: 0,
    qRebose: 0,
    totalUsado: 0,
    totalRecuperado: 0,
  };
}

export const nivelPct = (s: RecirculacionState) => (s.nivel / PARAMS.volumenDeposito) * 100;

export function bombaFuncionando(s: RecirculacionState) {
  return s.bombaOrden && !s.bombaProteccion;
}

/** Avanza el modelo dtSim segundos SIMULADOS. */
export function paso(s: RecirculacionState, dtSim: number) {
  s.t += dtSim;
  const v = s.valvulas;
  const pct = nivelPct(s);

  // Protección de la bomba por nivel bajo, con histéresis
  if (pct <= PARAMS.nivelParo) s.bombaProteccion = true;
  else if (s.bombaProteccion && pct >= PARAMS.nivelArranque) s.bombaProteccion = false;

  // Bomba: el caudal cae a medida que el filtro se colmata; sin camino abierto no hay caudal
  const caminoAbierto = v.v2 && v.v3;
  s.qBomba = bombaFuncionando(s) && caminoAbierto ? PARAMS.qBomba * (1 - 0.75 * s.colmatacion) : 0;
  s.qRetorno = s.qBomba * (1 - PARAMS.purga);

  // Peladora: completa con agua nueva lo que no llega por el retorno
  const demanda = s.peladora ? PARAMS.demanda : 0;
  s.qNueva = v.v0 ? Math.max(0, demanda - s.qRetorno) : 0;
  s.qAspersion = s.peladora ? s.qRetorno + s.qNueva : 0;
  s.qSalida = v.v1 ? s.qAspersion * (1 - PARAMS.perdidas) : 0;

  // Balance del depósito
  const min = dtSim / 60;
  s.nivel += (s.qSalida - s.qBomba) * min;
  s.qRebose = 0;
  if (s.nivel > PARAMS.volumenDeposito) {
    s.qRebose = (s.nivel - PARAMS.volumenDeposito) / min;
    s.nivel = PARAMS.volumenDeposito;
  }
  s.nivel = Math.max(0, s.nivel);

  s.colmatacion = clamp(s.colmatacion + s.qBomba * min * PARAMS.colmatacionPorLitro, 0, 1);
  s.totalUsado += s.qAspersion * min;
  s.totalRecuperado += (s.peladora ? s.qRetorno : 0) * min;
}

export function estadoFiltro(c: number) {
  if (c < 0.4) return { texto: "Operación normal", tono: "ok" as const };
  if (c < 0.65) return { texto: "Colmatación media", tono: "warn" as const };
  return { texto: "Requiere limpieza", tono: "bad" as const };
}
