// Galería DEMOSTRATIVA: ilustraciones generadas por código, no fotografías reales.
// Las categorías describen características visuales; no son diagnósticos.

export interface Muestra {
  id: string;
  nombre: string;
  observacion: string; // lo que se ve
  categoria: string; // clase que entregaría el clasificador
  confianzaBase: number; // confianza SIMULADA
  alerta: boolean;
  nota: string; // posible asociación descrita en la literatura
  // Parámetros de la ilustración
  colorBase: string;
  colorBorde: string;
  extension: number; // 0 compacta – 1 extendida (acuosa)
  uratos: boolean; // capa blanquecina
  manchas?: { color: string; n: number; forma: "punto" | "hilo" | "grano" };
  brillo: number;
}

export const MUESTRAS: Muestra[] = [
  {
    id: "tipica",
    nombre: "Ejemplo A",
    observacion: "Forma definida, color marrón con capa blanquecina de uratos.",
    categoria: "Apariencia típica",
    confianzaBase: 0.91,
    alerta: false,
    nota: "Aspecto que suele describirse como habitual en aves sanas.",
    colorBase: "#6b4a2b",
    colorBorde: "#4a321c",
    extension: 0.15,
    uratos: true,
    brillo: 0.15,
  },
  {
    id: "cecal",
    nombre: "Ejemplo B",
    observacion: "Pasta homogénea marrón oscuro, brillante, sin capa blanca.",
    categoria: "Variante cecal (típica)",
    confianzaBase: 0.84,
    alerta: false,
    nota: "Las heces cecales se producen de forma periódica y su aspecto diferente es normal.",
    colorBase: "#3b2414",
    colorBorde: "#24150b",
    extension: 0.35,
    uratos: false,
    brillo: 0.5,
  },
  {
    id: "acuosa",
    nombre: "Ejemplo C",
    observacion: "Consistencia líquida, mancha extendida con bordes irregulares.",
    categoria: "Consistencia acuosa",
    confianzaBase: 0.88,
    alerta: true,
    nota: "Se describe como posible señal de estrés térmico, consumo excesivo de agua o trastornos entéricos. Requiere evaluación veterinaria.",
    colorBase: "#8a7350",
    colorBorde: "#a08c6a",
    extension: 0.95,
    uratos: true,
    brillo: 0.7,
  },
  {
    id: "verdosa",
    nombre: "Ejemplo D",
    observacion: "Coloración verdosa predominante.",
    categoria: "Coloración verdosa",
    confianzaBase: 0.79,
    alerta: true,
    nota: "Se ha asociado de forma posible con ayuno prolongado u otras condiciones. Requiere evaluación veterinaria.",
    colorBase: "#4f6b2a",
    colorBorde: "#3a501d",
    extension: 0.45,
    uratos: true,
    brillo: 0.35,
  },
  {
    id: "rojiza",
    nombre: "Ejemplo E",
    observacion: "Presencia de tonos rojizos o filamentos rojos.",
    categoria: "Presencia de tonos rojizos",
    confianzaBase: 0.82,
    alerta: true,
    nota: "La presencia de sangre se describe como posible signo de afecciones intestinales (por ejemplo, coccidiosis). Requiere evaluación veterinaria.",
    colorBase: "#6b3f2a",
    colorBorde: "#4a2a1c",
    extension: 0.4,
    uratos: false,
    manchas: { color: "#b91c1c", n: 14, forma: "hilo" },
    brillo: 0.35,
  },
  {
    id: "nodigerido",
    nombre: "Ejemplo F",
    observacion: "Partículas de alimento visibles sin digerir.",
    categoria: "Material no digerido visible",
    confianzaBase: 0.76,
    alerta: true,
    nota: "Se describe como posible indicio de tránsito intestinal acelerado o alteraciones digestivas. Requiere evaluación veterinaria.",
    colorBase: "#7a5a33",
    colorBorde: "#5a4024",
    extension: 0.3,
    uratos: true,
    manchas: { color: "#e5b94a", n: 22, forma: "grano" },
    brillo: 0.2,
  },
];

/** Pseudoaleatorio determinista para que cada ilustración sea siempre igual. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function contorno(seed: string, cx: number, cy: number, r: number, irregular: number, puntos = 28) {
  const rnd = rng(seed);
  const pts: [number, number][] = [];
  const fases = [rnd() * 6, rnd() * 6, rnd() * 6];
  for (let i = 0; i < puntos; i++) {
    const a = (i / puntos) * Math.PI * 2;
    const k =
      1 +
      irregular * (0.22 * Math.sin(3 * a + fases[0]) + 0.14 * Math.sin(5 * a + fases[1]) + 0.08 * Math.sin(9 * a + fases[2])) +
      irregular * 0.08 * (rnd() - 0.5);
    pts.push([cx + Math.cos(a) * r * k * 1.15, cy + Math.sin(a) * r * k * 0.85]);
  }
  // Curva suave cerrada (Catmull-Rom → Bézier)
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

/** Ilustración SVG de una muestra sobre fondo de viruta. */
export function IlustracionMuestra({ m, className = "", filtro }: { m: Muestra; className?: string; filtro?: string }) {
  const rnd = rng(m.id + "fondo");
  const viruta = Array.from({ length: 70 }, () => ({
    x: rnd() * 200,
    y: rnd() * 200,
    w: 6 + rnd() * 14,
    a: rnd() * 180,
    c: ["#c8a46e", "#b88f55", "#d9bb85", "#a57b45"][Math.floor(rnd() * 4)],
  }));
  const r = 34 + m.extension * 34;
  const forma = contorno(m.id, 100, 104, r, 0.5 + m.extension * 0.9);
  const centro = contorno(m.id + "c", 100, 100, r * 0.55, 0.6);
  const urato = contorno(m.id + "u", 108 - m.extension * 10, 92, r * (m.extension > 0.6 ? 0.3 : 0.38), 0.8, 18);
  const rm = rng(m.id + "m");
  const manchas = m.manchas
    ? Array.from({ length: m.manchas.n }, () => {
        const a = rm() * Math.PI * 2;
        const d = Math.sqrt(rm()) * r * 0.75;
        return { x: 100 + Math.cos(a) * d * 1.1, y: 104 + Math.sin(a) * d * 0.8, rot: rm() * 180, s: 0.6 + rm() * 0.8 };
      })
    : [];
  const gid = `g-${m.id}`;
  return (
    <svg viewBox="0 0 200 200" className={className} style={filtro ? { filter: filtro } : undefined} role="img" aria-label={`Ilustración de ejemplo: ${m.categoria}`}>
      <defs>
        <radialGradient id={gid} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={m.brillo * 0.55} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="#caa775" />
      {viruta.map((v, i) => (
        <rect key={i} x={v.x} y={v.y} width={v.w} height={3} rx={1.5} fill={v.c} opacity={0.8} transform={`rotate(${v.a} ${v.x} ${v.y})`} />
      ))}
      {m.extension > 0.6 ? <path d={contorno(m.id + "h", 100, 106, r * 1.12, 1.4)} fill={m.colorBorde} opacity={0.45} /> : null}
      <path d={forma} fill={m.colorBase} stroke={m.colorBorde} strokeWidth={2} />
      <path d={centro} fill={m.colorBorde} opacity={0.35} />
      {manchas.map((p, i) =>
        m.manchas?.forma === "grano" ? (
          <ellipse key={i} cx={p.x} cy={p.y} rx={3.2 * p.s} ry={2.2 * p.s} fill={m.manchas.color} transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
        ) : (
          <rect key={i} x={p.x} y={p.y} width={9 * p.s} height={2} rx={1} fill={m.manchas?.color} transform={`rotate(${p.rot} ${p.x} ${p.y})`} />
        ),
      )}
      {m.uratos ? <path d={urato} fill="#f1efe6" opacity={0.92} /> : null}
      <path d={forma} fill={`url(#${gid})`} />
      <text x="6" y="194" fontSize="9" fill="#3b2a14" opacity={0.75}>
        Ilustración de ejemplo
      </text>
    </svg>
  );
}
