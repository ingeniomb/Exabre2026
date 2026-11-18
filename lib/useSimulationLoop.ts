"use client";

import { useEffect, useRef } from "react";

/**
 * Bucle de simulación con paso de tiempo fijo (acumulador).
 * - step(dt): avanza el modelo físico un paso fijo.
 * - sample(): se llama a sampleHz para refrescar la interfaz y las gráficas.
 * El bucle solo corre mientras `running` es verdadero.
 */
export function useSimulationLoop(
  running: boolean,
  step: (dt: number) => void,
  sample: () => void,
  { fixedDt = 1 / 120, sampleHz = 10 }: { fixedDt?: number; sampleHz?: number } = {},
) {
  const stepRef = useRef(step);
  const sampleRef = useRef(sample);
  useEffect(() => {
    stepRef.current = step;
    sampleRef.current = sample;
  });

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let sampleAcc = 0;
    const samplePeriod = 1 / sampleHz;

    const tick = (now: number) => {
      // Se limita el salto para no "explotar" tras cambiar de pestaña
      const frame = Math.min((now - last) / 1000, 0.1);
      last = now;
      acc += frame;
      sampleAcc += frame;
      while (acc >= fixedDt) {
        stepRef.current(fixedDt);
        acc -= fixedDt;
      }
      if (sampleAcc >= samplePeriod) {
        sampleAcc %= samplePeriod;
        sampleRef.current();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, fixedDt, sampleHz]);
}
