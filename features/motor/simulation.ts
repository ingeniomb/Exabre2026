// Modelo simplificado de un motor de inducción accionado por variador de frecuencia.
// Todos los valores son simulados con fines demostrativos.

import { clamp, firstOrder, gauss } from "@/lib/math";

export type Escenario = "normal" | "vibracion" | "sobrecarga";

export interface MotorParams {
  rpmObjetivo: number; // 0 – 3600
  carga: number; // 0 – 1 (fracción de la carga nominal)
  escenario: Escenario;
}

export const MOTOR_DEFAULTS: MotorParams = {
  rpmObjetivo: 1750,
  carga: 0.6,
  escenario: "normal",
};

/** Datos de placa de referencia (motor de 2,2 kW, 220 V trifásico). */
export const PLACA = {
  rpmNominal: 1750,
  corrienteNominal: 8.5, // A
  corrienteVacio: 3.2, // A
  tAmbiente: 25, // °C
  tAlarma: 90, // °C
};

export const FS = 1000; // frecuencia de muestreo del acelerómetro [Hz]
export const VENTANA = 512; // muestras por ventana para la FFT
const BUFFER = 2048;

export interface MotorState {
  t: number; // tiempo simulado [s]
  rpm: number; // velocidad real (con rampa)
  angulo: number; // ángulo del eje [rad]
  corriente: number; // [A]
  temperatura: number; // [°C]
  vib: Float64Array; // buffer circular de aceleración [m/s²]
  vibIdx: number; // índice de escritura
  vibTotal: number; // muestras escritas
  aceleracionActual: number;
  muestraAcc: number;
}

export function crearEstado(): MotorState {
  return {
    t: 0,
    rpm: 0,
    angulo: 0,
    corriente: 0,
    temperatura: PLACA.tAmbiente,
    vib: new Float64Array(BUFFER),
    vibIdx: 0,
    vibTotal: 0,
    aceleracionActual: 0,
    muestraAcc: 0,
  };
}

/** Amplitudes de cada componente de vibración según el escenario. */
function amplitudes(p: MotorParams, f1: number) {
  const r = f1 / (PLACA.rpmNominal / 60); // relación de velocidad
  const desbalance = 0.55 * Math.pow(r, 1.5); // crece con la velocidad de giro
  switch (p.escenario) {
    case "vibracion":
      return { a1: desbalance * 1.8, a2: 1.6 * r, rod: 1.1, ruido: 0.12 };
    case "sobrecarga":
      return { a1: desbalance * 1.15, a2: 0.25 * r, rod: 0.05, ruido: 0.1 };
    default:
      return { a1: desbalance, a2: 0.12 * r, rod: 0, ruido: 0.07 };
  }
}

export function paso(s: MotorState, p: MotorParams, dt: number) {
  s.t += dt;

  // 1) Dinámica mecánica: rampa de primer orden del variador
  s.rpm = firstOrder(s.rpm, p.rpmObjetivo, 1.2, dt);
  if (s.rpm < 0.5 && p.rpmObjetivo === 0) s.rpm = 0;
  const f1 = s.rpm / 60; // frecuencia de giro [Hz]
  s.angulo = (s.angulo + 2 * Math.PI * f1 * dt) % (2 * Math.PI * 1000);

  // 2) Corriente: vacío + componente proporcional a la potencia mecánica
  const cargaEf = p.escenario === "sobrecarga" ? p.carga + 0.55 : p.carga;
  const vel = s.rpm / PLACA.rpmNominal;
  const iObjetivo =
    s.rpm < 1
      ? 0
      : PLACA.corrienteVacio * Math.min(1, 0.4 + vel) +
        (PLACA.corrienteNominal - PLACA.corrienteVacio) * cargaEf * vel;
  s.corriente = firstOrder(s.corriente, iObjetivo, 0.4, dt);

  // 3) Térmica de primer orden. Constante de tiempo acelerada (15 s) para la demostración.
  //    El ventilador está en el eje: a menor velocidad, peor refrigeración.
  const ventilacion = clamp(0.25 + 0.75 * vel, 0.25, 1.2);
  const rth = (p.escenario === "sobrecarga" ? 1.35 : 1) / ventilacion;
  const iRel = s.corriente / PLACA.corrienteNominal;
  const elevacion = s.rpm < 1 ? 0 : rth * (6 + 48 * iRel * iRel);
  s.temperatura = firstOrder(s.temperatura, PLACA.tAmbiente + elevacion, 15, dt);

  // 4) Señal del acelerómetro muestreada a FS
  const a = amplitudes(p, f1);
  s.muestraAcc += dt;
  const ts = 1 / FS;
  while (s.muestraAcc >= ts) {
    s.muestraAcc -= ts;
    const tk = s.t - s.muestraAcc;
    const th = 2 * Math.PI * f1 * tk;
    const fRod = 3.6 * f1; // frecuencia de falla de rodamiento (ilustrativa)
    let v =
      a.a1 * Math.sin(th) +
      a.a2 * Math.sin(2 * th + 0.7) +
      a.rod * (0.6 + 0.4 * Math.sin(th)) * Math.sin(2 * Math.PI * fRod * tk) +
      a.ruido * gauss();
    if (s.rpm < 1) v = 0.01 * gauss();
    s.vib[s.vibIdx] = v;
    s.vibIdx = (s.vibIdx + 1) % BUFFER;
    s.vibTotal++;
    s.aceleracionActual = v;
  }
}

/** Copia las últimas n muestras del buffer circular. */
export function ultimasMuestras(s: MotorState, n: number): Float64Array {
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const idx = (s.vibIdx - n + i + BUFFER * 2) % BUFFER;
    out[i] = s.vib[idx];
  }
  return out;
}
