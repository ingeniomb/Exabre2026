export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ruido gaussiano (Box–Muller). */
export function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Aproxima x hacia objetivo con constante de tiempo tau (primer orden). */
export function firstOrder(x: number, objetivo: number, tau: number, dt: number): number {
  return x + (objetivo - x) * (1 - Math.exp(-dt / Math.max(tau, 1e-6)));
}
