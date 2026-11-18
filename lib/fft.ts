// FFT radix-2 (Cooley–Tukey) iterativa, sin dependencias externas.
// Devuelve la magnitud de un solo lado del espectro (N/2 puntos).

export function magnitudeSpectrum(signal: ArrayLike<number>): Float64Array {
  const n = signal.length;
  if (n === 0 || (n & (n - 1)) !== 0) {
    throw new Error("La longitud de la ventana debe ser potencia de 2");
  }
  const re = new Float64Array(n);
  const im = new Float64Array(n);

  // Ventana de Hann para reducir la fuga espectral
  let mean = 0;
  for (let i = 0; i < n; i++) mean += signal[i];
  mean /= n;
  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    re[i] = (signal[i] - mean) * w;
  }

  // Reordenamiento por inversión de bits
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }

  const half = n / 2;
  const mag = new Float64Array(half);
  // Factor 4/N compensa el lado único y la ganancia media de Hann (0.5)
  for (let k = 0; k < half; k++) mag[k] = (4 / n) * Math.hypot(re[k], im[k]);
  return mag;
}
