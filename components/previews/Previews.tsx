// Previsualizaciones animadas livianas (SVG + CSS) para las tarjetas del menú.
// No usan WebGL, así el menú carga rápido incluso en celulares.

import type { ProyectoId } from "@/content/proyectos";

const css = `
.pv-spin{transform-box:fill-box;transform-origin:center;animation:pvspin 1.2s linear infinite}
.pv-spin-slow{transform-box:fill-box;transform-origin:center;animation:pvspin 4s linear infinite}
.pv-dash{stroke-dasharray:6 8;animation:pvdash 1s linear infinite}
.pv-flame{transform-box:fill-box;transform-origin:bottom;animation:pvflame .5s ease-in-out infinite alternate}
.pv-scan{animation:pvscan 2.4s ease-in-out infinite}
.pv-wave{animation:pvwave 1.6s linear infinite}
@keyframes pvspin{to{transform:rotate(360deg)}}
@keyframes pvdash{to{stroke-dashoffset:-28}}
@keyframes pvflame{from{transform:scaleY(.75)}to{transform:scaleY(1.1)}}
@keyframes pvscan{0%,100%{transform:translateY(0)}50%{transform:translateY(46px)}}
@keyframes pvwave{to{transform:translateX(-80px)}}
@keyframes pvbean{0%{transform:rotate(0deg) translateX(26px)}100%{transform:rotate(360deg) translateX(26px)}}
@keyframes pvflow{to{offset-distance:100%}}
`;

function Motor() {
  return (
    <svg viewBox="0 0 320 160" className="h-full w-full">
      <rect x="60" y="50" width="130" height="64" rx="10" fill="#334155" stroke="#64748b" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={i} x1={70 + i * 17} y1="50" x2={70 + i * 17} y2="114" stroke="#475569" strokeWidth="3" />
      ))}
      <rect x="190" y="76" width="48" height="12" fill="#cbd5e1" />
      <g transform="translate(40 82)">
        <g className="pv-spin">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect key={a} x="-3" y="-28" width="6" height="26" rx="2" fill="#22d3ee" transform={`rotate(${a})`} />
          ))}
          <circle r="6" fill="#0f172a" />
        </g>
      </g>
      <rect x="112" y="40" width="16" height="10" fill="#2563eb" />
      <path d="M120 40 C120 10, 270 10, 280 40" fill="none" stroke="#22d3ee" strokeWidth="2" className="pv-dash" />
      <rect x="262" y="40" width="44" height="30" rx="4" fill="#1e293b" stroke="#22d3ee" />
      <text x="284" y="59" fill="#67e8f9" fontSize="10" textAnchor="middle">ESP32</text>
      <clipPath id="pvclip"><rect x="200" y="112" width="110" height="40" /></clipPath>
      <g clipPath="url(#pvclip)">
        <path
          className="pv-wave"
          d="M200 132 q10 -16 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0"
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

function Tostadora() {
  return (
    <svg viewBox="0 0 320 160" className="h-full w-full">
      <rect x="56" y="40" width="14" height="80" fill="#475569" />
      <rect x="250" y="40" width="14" height="80" fill="#475569" />
      <rect x="70" y="42" width="180" height="56" rx="26" fill="#64748b" stroke="#94a3b8" />
      <g transform="translate(160 70)">
        <g className="pv-spin-slow">
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="0" y1="-22" x2="0" y2="22" stroke="#cbd5e1" strokeWidth="2" />
        </g>
        {Array.from({ length: 9 }, (_, i) => (
          <ellipse
            key={i}
            rx="5"
            ry="3.4"
            fill={["#65a30d", "#a16207", "#78350f"][i % 3]}
            style={{ animation: `pvbean ${2.4 + (i % 3) * 0.4}s linear ${-i * 0.3}s infinite` }}
          />
        ))}
      </g>
      <rect x="80" y="128" width="160" height="14" rx="3" fill="#1e293b" />
      {[110, 160, 210].map((x) => (
        <path key={x} className="pv-flame" d={`M${x - 10} 128 Q${x} 100 ${x + 10} 128 Z`} fill="#f97316" opacity="0.9" />
      ))}
    </svg>
  );
}

function Recirculacion() {
  const ruta = "M60 60 L60 120 L160 120 L160 90 L250 90 L250 30 L60 30 Z";
  return (
    <svg viewBox="0 0 320 160" className="h-full w-full">
      <path d={ruta} fill="none" stroke="#1f3760" strokeWidth="10" strokeLinejoin="round" />
      <path d={ruta} fill="none" stroke="#38bdf8" strokeWidth="3" className="pv-dash" />
      <circle cx="60" cy="50" r="26" fill="#334155" stroke="#94a3b8" />
      <rect x="130" y="100" width="60" height="44" rx="4" fill="#0f2b46" stroke="#38bdf8" />
      <rect x="132" y="120" width="56" height="22" fill="#38bdf8" opacity="0.5" />
      <rect x="236" y="70" width="28" height="40" rx="4" fill="#1e293b" stroke="#22d3ee" />
      <circle cx="250" cy="30" r="12" fill="#1e293b" stroke="#f97316" />
      <g transform="translate(250 30)"><g className="pv-spin"><rect x="-1.5" y="-9" width="3" height="18" fill="#f97316" /></g></g>
      {Array.from({ length: 8 }, (_, i) => (
        <circle
          key={i}
          r="3.2"
          fill="#7dd3fc"
          style={{ offsetPath: `path("${ruta}")`, animation: `pvflow 5s linear ${-i * 0.62}s infinite` }}
        />
      ))}
    </svg>
  );
}

function Vision() {
  return (
    <svg viewBox="0 0 320 160" className="h-full w-full">
      <rect x="40" y="130" width="160" height="10" fill="#57534e" />
      <ellipse cx="120" cy="126" rx="22" ry="8" fill="#78716c" />
      <rect x="96" y="20" width="48" height="26" rx="4" fill="#1e293b" stroke="#94a3b8" />
      <circle cx="120" cy="46" r="7" fill="#22d3ee" />
      <path d="M120 50 L80 126 L160 126 Z" fill="#22d3ee" opacity="0.12" />
      <g className="pv-scan"><line x1="88" y1="78" x2="152" y2="78" stroke="#22d3ee" strokeWidth="2" /></g>
      <path d="M144 32 C200 32, 210 60, 236 60" fill="none" stroke="#22d3ee" strokeWidth="2" className="pv-dash" />
      <rect x="236" y="40" width="64" height="52" rx="5" fill="#0f172a" stroke="#22d3ee" />
      <rect x="246" y="52" width="44" height="6" rx="2" fill="#22c55e" />
      <rect x="246" y="64" width="30" height="6" rx="2" fill="#eab308" />
      <rect x="246" y="76" width="18" height="6" rx="2" fill="#ef4444" />
    </svg>
  );
}

export function Preview({ id }: { id: ProyectoId }) {
  return (
    <div className="anim-preview h-full w-full">
      <style>{css}</style>
      {id === "motor" ? <Motor /> : id === "tostadora" ? <Tostadora /> : id === "recirculacion" ? <Recirculacion /> : <Vision />}
    </div>
  );
}
