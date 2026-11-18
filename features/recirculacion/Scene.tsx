"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { Label3D } from "@/components/three/Label3D";
import { clamp } from "@/lib/math";
import { bombaFuncionando, nivelPct, PARAMS, type RecirculacionState, type ValvulaId } from "./simulation";
import { recSim, useRecirculacion } from "./store";

type V3 = [number, number, number];

// ---------- Trazado de tuberías (tramos de flujo) ----------
interface Tramo {
  id: string;
  nombre: string;
  puntos: V3[];
  color: string;
  caudal: (s: RecirculacionState) => number;
}

export const TRAMOS: Tramo[] = [
  {
    id: "nueva",
    nombre: "Agua nueva → aspersión",
    puntos: [[-3.6, 1.4, 0.55], [-3.25, 1.4, 0.55], [-3.25, 2.2, 0.55], [-3.25, 2.2, 0.2], [-3.05, 2.1, 0.12]],
    color: "#38bdf8",
    caudal: (s) => s.qNueva,
  },
  {
    id: "salida",
    nombre: "Salida de agua utilizada",
    puntos: [[-2.6, 1.15, 0], [-2.6, 1.0, 0.25], [-2.6, 1.0, 1.6], [-1.65, 1.0, 1.6]],
    color: "#a89a80",
    caudal: (s) => s.qSalida,
  },
  {
    id: "tamiz",
    nombre: "Tamiz → depósito",
    puntos: [[-0.8, 0.82, 1.6], [-0.35, 0.82, 1.6], [-0.35, 0.62, 1.6]],
    color: "#a89a80",
    caudal: (s) => s.qSalida,
  },
  {
    id: "succion",
    nombre: "Depósito → bomba",
    puntos: [[0.85, 0.15, 1.6], [1.5, 0.15, 1.6], [1.62, 0.25, 1.6]],
    color: "#a89a80",
    caudal: (s) => s.qBomba,
  },
  {
    id: "impulsion",
    nombre: "Bomba → sedimentación",
    puntos: [[1.75, 0.45, 1.6], [1.75, 1.45, 1.6], [1.75, 1.45, 0.2], [1.75, 1.22, 0.2]],
    color: "#a89a80",
    caudal: (s) => s.qBomba,
  },
  {
    id: "sedimentado",
    nombre: "Sedimentación → filtro",
    puntos: [[1.75, 0.8, -0.25], [1.75, 0.8, -1.0]],
    color: "#8fb3c4",
    caudal: (s) => s.qRetorno,
  },
  {
    id: "filtrada",
    nombre: "Filtro → desinfección",
    puntos: [[1.75, 0.25, -1.55], [1.75, 0.25, -1.9], [0.75, 0.25, -1.9], [0.75, 0.9, -1.9], [0.62, 0.9, -1.9]],
    color: "#7dd3fc",
    caudal: (s) => s.qRetorno,
  },
  {
    id: "retorno",
    nombre: "Retorno de agua tratada",
    puntos: [[-0.42, 0.9, -1.9], [-1.95, 0.9, -1.9], [-1.95, 2.2, -1.9], [-1.95, 2.2, -0.35], [-2.2, 2.1, -0.15]],
    color: "#a5f3fc",
    caudal: (s) => (s.peladora ? s.qRetorno : 0),
  },
];

function camino(puntos: V3[]) {
  const c = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < puntos.length - 1; i++) c.add(new THREE.LineCurve3(new THREE.Vector3(...puntos[i]), new THREE.Vector3(...puntos[i + 1])));
  return c;
}

const CAMINOS = TRAMOS.map((t) => camino(t.puntos));

const VALVULA_POS: Record<ValvulaId, { pos: V3; eje: "x" | "y" | "z" }> = {
  v0: { pos: [-3.25, 1.8, 0.55], eje: "y" },
  v1: { pos: [-2.6, 1.0, 1.0], eje: "z" },
  v2: { pos: [1.18, 0.15, 1.6], eje: "x" },
  v3: { pos: [-1.1, 0.9, -1.9], eje: "x" },
};

// ---------- Componentes ----------
function Tuberias() {
  const mats = useMemo(
    () =>
      TRAMOS.map(
        () =>
          new THREE.MeshStandardMaterial({ color: "#94a3b8", metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.42, depthWrite: false }),
      ),
    [],
  );
  const geos = useMemo(() => CAMINOS.map((c) => new THREE.TubeGeometry(c, 64, 0.055, 12, false)), []);
  const codos = useMemo(() => TRAMOS.flatMap((t) => t.puntos.slice(1, -1)), []);

  useFrame(({ clock, invalidate }) => {
    const ruta = useRecirculacion.getState().ruta;
    if (ruta) invalidate();
    const activo = Math.floor(clock.elapsedTime / 1.1) % TRAMOS.length;
    mats.forEach((m, i) => {
      const on = ruta && i === activo;
      m.emissive.set(on ? "#22d3ee" : "#000000");
      m.emissiveIntensity = on ? 1.4 : 0;
      m.opacity = on ? 0.7 : 0.42;
    });
  });

  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={TRAMOS[i].id} geometry={g} material={mats[i]} />
      ))}
      {codos.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.065, 14, 10]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function ParticulasAgua() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const info = useMemo(() => {
    const lista: { tramo: number; u: number }[] = [];
    CAMINOS.forEach((c, i) => {
      const n = Math.max(6, Math.round(c.getLength() * 7));
      for (let k = 0; k < n; k++) lista.push({ tramo: i, u: k / n });
    });
    return lista;
  }, []);
  const uRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const c = new THREE.Color();
    info.forEach((p, i) => {
      c.set(TRAMOS[p.tramo].color);
      m.setColorAt(i, c);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [info]);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    if (!uRef.current) uRef.current = Float32Array.from(info.map((p) => p.u));
    const u = uRef.current;
    const corriendo = useRecirculacion.getState().status === "ejecutando";
    const s = recSim.estado;
    const dt = corriendo ? Math.min(delta, 0.05) : 0;
    const vel = TRAMOS.map((t, i) => (t.caudal(s) / PARAMS.qBomba) * 0.9 / CAMINOS[i].getLength());
    for (let i = 0; i < info.length; i++) {
      const tr = info[i].tramo;
      u[i] = (u[i] + vel[tr] * dt) % 1;
      const q = TRAMOS[tr].caudal(s);
      dummy.position.copy(CAMINOS[tr].getPointAt(u[i]));
      // Sin caudal, el agua queda quieta y se dibuja más pequeña
      dummy.scale.setScalar(q > 0.1 ? 1 : 0.55);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, info.length]} frustumCulled={false}>
      <sphereGeometry args={[0.038, 8, 6]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function Valvula({ id }: { id: ValvulaId }) {
  const abierta = useRecirculacion((s) => s.valvulas[id]);
  const toggle = useRecirculacion((s) => s.toggleValvula);
  const { pos, eje } = VALVULA_POS[id];
  const rot: V3 = eje === "x" ? [0, 0, Math.PI / 2] : eje === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return (
    <group
      position={pos}
      onClick={(e) => {
        e.stopPropagation();
        toggle(id);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <mesh rotation={rot}>
        <cylinderGeometry args={[0.09, 0.09, 0.2, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.14, 8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Manija: paralela al tubo = abierta; perpendicular = cerrada */}
      <mesh position={[0, 0.22, 0]} rotation-y={abierta ? (eje === "x" ? 0 : Math.PI / 2) : eje === "x" ? Math.PI / 2 : 0}>
        <boxGeometry args={[0.32, 0.04, 0.06]} />
        <meshStandardMaterial color={abierta ? "#22c55e" : "#ef4444"} emissive={abierta ? "#14532d" : "#7f1d1d"} />
      </mesh>
    </group>
  );
}

function Peladora() {
  const plato = useRef<THREE.Group>(null);
  const gotas = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const N = 40;
  const semillas = useMemo(() => Array.from({ length: N }, (_, i) => ({ a: (i / N) * Math.PI * 2, f: (i * 0.37) % 1 })), []);
  const t = useRef(0);

  useFrame((_, delta) => {
    const corriendo = useRecirculacion.getState().status === "ejecutando";
    const s = recSim.estado;
    const dt = corriendo ? Math.min(delta, 0.05) : 0;
    t.current += dt;
    if (plato.current && s.peladora) plato.current.rotation.y += dt * 4;
    const g = gotas.current;
    if (!g) return;
    const hay = s.qAspersion > 0.5;
    g.visible = hay;
    for (let i = 0; i < N; i++) {
      const k = (semillas[i].f + t.current * 1.6) % 1;
      const r = 0.48 * (1 - 0.6 * k);
      dummy.position.set(Math.cos(semillas[i].a) * r, 2.0 - k * 0.75, Math.sin(semillas[i].a) * r);
      dummy.updateMatrix();
      g.setMatrixAt(i, dummy.matrix);
    }
    g.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[-2.6, 0, 0]}>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.45, 0.6, Math.sin(a) * 0.45]} castShadow>
            <boxGeometry args={[0.07, 1.2, 0.07]} />
            <meshStandardMaterial color="#475569" metalness={0.6} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.7, 48, 1, true]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} side={THREE.DoubleSide} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.6, 48]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} />
      </mesh>
      <mesh position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.18, 0.12, 0.2, 20]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
      {/* Plato giratorio con dedos de goma */}
      <group ref={plato} position={[0, 1.24, 0]}>
        <mesh>
          <cylinderGeometry args={[0.55, 0.55, 0.04, 40]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} />
        </mesh>
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const r = i % 2 ? 0.25 : 0.42;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0.09, Math.sin(a) * r]}>
              <cylinderGeometry args={[0.025, 0.03, 0.16, 8]} />
              <meshStandardMaterial color="#f97316" roughness={0.9} />
            </mesh>
          );
        })}
      </group>
      {/* Anillo de aspersión */}
      <mesh position={[0, 2.05, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.5, 0.03, 8, 48]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
      </mesh>
      <instancedMesh ref={gotas} args={[undefined, undefined, N]} frustumCulled={false}>
        <sphereGeometry args={[0.018, 6, 4]} />
        <meshBasicMaterial color="#7dd3fc" />
      </instancedMesh>
    </group>
  );
}

function TanqueAguaNueva() {
  return (
    <group position={[-4.0, 0, 0.55]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.8, 0.9, 0.8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 1.3, 32]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.25, 0]}>
        <cylinderGeometry args={[0.15, 0.4, 0.12, 32]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
    </group>
  );
}

function Tamiz() {
  const giro = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const corriendo = useRecirculacion.getState().status === "ejecutando";
    if (giro.current && corriendo && recSim.estado.qSalida > 0) giro.current.rotation.x += Math.min(delta, 0.05) * 1.5;
  });
  const plumas = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({ p: [((i * 0.37) % 1) * 0.5 - 0.25, 0.32 + ((i * 0.53) % 1) * 0.06, ((i * 0.71) % 1) * 0.3 - 0.15] as V3, r: i })),
    [],
  );
  return (
    <group position={[-1.2, 0, 1.6]}>
      <group ref={giro} position={[0, 0.95, 0]}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.28, 0.28, 0.8, 20, 6, true]} />
          <meshStandardMaterial color="#94a3b8" wireframe />
        </mesh>
      </group>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.48, 0]}>
          <boxGeometry args={[0.05, 0.96, 0.6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      ))}
      {/* Recipiente de plumas y sólidos */}
      <group position={[0, 0, 0.65]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.7, 0.4, 0.45]} />
          <meshStandardMaterial color="#166534" transparent opacity={0.85} />
        </mesh>
        {plumas.map((f) => (
          <mesh key={f.r} position={f.p} rotation={[f.r, f.r * 2, 0]}>
            <planeGeometry args={[0.1, 0.04]} />
            <meshStandardMaterial color="#f8fafc" side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Deposito() {
  const agua = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const p = clamp(nivelPct(recSim.estado) / 100, 0.01, 1);
    if (agua.current) {
      agua.current.scale.y = p;
      agua.current.position.y = 0.04 + (0.62 * p) / 2;
    }
  });
  return (
    <group position={[0.25, 0, 1.6]}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.2, 0.7, 0.9]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.18} roughness={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.22, 0.72, 0.92]} />
        <meshBasicMaterial color="#64748b" wireframe />
      </mesh>
      <mesh ref={agua} position={[0, 0.35, 0]}>
        <boxGeometry args={[1.16, 0.62, 0.86]} />
        <meshStandardMaterial color="#7c8f99" transparent opacity={0.75} roughness={0.15} />
      </mesh>
    </group>
  );
}

function Bomba() {
  const rotor = useRef<THREE.Group>(null);
  const luz = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, delta) => {
    const s = recSim.estado;
    const corriendo = useRecirculacion.getState().status === "ejecutando";
    if (rotor.current && corriendo && s.qBomba > 0) rotor.current.rotation.x += Math.min(delta, 0.05) * 14;
    luz.current?.color.set(bombaFuncionando(s) ? (s.qBomba > 0 ? "#22c55e" : "#eab308") : s.bombaProteccion ? "#f97316" : "#ef4444");
  });
  return (
    <group position={[1.75, 0.25, 1.6]}>
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.22, 0.22, 0.14, 32]} />
        <meshStandardMaterial color="#0e7490" metalness={0.4} roughness={0.4} transparent opacity={0.55} />
      </mesh>
      <group ref={rotor}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} rotation-x={(i / 6) * Math.PI * 2}>
            <boxGeometry args={[0.08, 0.34, 0.03]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
        ))}
      </group>
      <mesh position={[0.32, 0, 0]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.45, 24]} />
        <meshStandardMaterial color="#2563eb" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.2, -0.2, 0]}>
        <boxGeometry args={[0.8, 0.1, 0.4]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.32, 0.2, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial ref={luz} color="#ef4444" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Tratamiento() {
  const cartucho = useRef<THREE.MeshStandardMaterial>(null);
  const carcasa = useRef<THREE.MeshStandardMaterial>(null);
  const limpio = useMemo(() => new THREE.Color("#f1f5f9"), []);
  const sucio = useMemo(() => new THREE.Color("#78350f"), []);
  useFrame(({ clock, invalidate }) => {
    const c = recSim.estado.colmatacion;
    cartucho.current?.color.copy(limpio).lerp(sucio, c);
    const mant = useRecirculacion.getState().mantenimiento;
    if (carcasa.current) {
      carcasa.current.emissive.set(mant ? "#22d3ee" : "#000000");
      carcasa.current.emissiveIntensity = mant ? 0.4 + 0.3 * Math.sin(clock.elapsedTime * 4) : 0;
    }
    if (mant) invalidate();
  });
  return (
    <group>
      {/* Sedimentador */}
      <group position={[1.75, 0, 0.2]}>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.75, 32]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.43, 0.43, 0.6, 32]} />
          <meshStandardMaterial color="#8fb3c4" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.45, 0.4, 32, 1, true]} />
          <meshStandardMaterial color="#64748b" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.12, 0.08, 0.14, 16]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.38, 0.25, Math.sin(a) * 0.38]}>
              <boxGeometry args={[0.05, 0.5, 0.05]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          );
        })}
      </group>
      {/* Filtro de cartucho */}
      <group position={[1.75, 0, -1.3]}>
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 1.2, 32]} />
          <meshStandardMaterial ref={carcasa} color="#93c5fd" transparent opacity={0.35} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.95, 24]} />
          <meshStandardMaterial ref={cartucho} color="#f1f5f9" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.08, 32]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
      </group>
      {/* Desinfección (UV o dosificación), conceptual */}
      <group position={[0.1, 0.9, -1.9]}>
        <mesh rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 1.05, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.35, 0.28, 0.12]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0.35, 0.065]}>
          <planeGeometry args={[0.2, 0.1]} />
          <meshBasicMaterial color="#a78bfa" toneMapped={false} />
        </mesh>
        {[-0.4, 0.4].map((x) => (
          <mesh key={x} position={[x, -0.45, 0]}>
            <boxGeometry args={[0.06, 0.9, 0.06]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CamaraMantenimiento() {
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const mant = useRecirculacion((s) => s.mantenimiento);
  const restante = useRef(0);

  useEffect(() => {
    restante.current = 2.5;
    invalidate();
  }, [mant, invalidate]);

  useFrame((_, delta) => {
    if (restante.current <= 0 || !controls) return;
    restante.current -= delta;
    const k = 1 - Math.exp(-Math.min(delta, 0.25) * 5);
    const pos = mant ? new THREE.Vector3(4.6, 2.3, 0.7) : new THREE.Vector3(4.4, 4.8, 7.4);
    const tgt = mant ? new THREE.Vector3(1.75, 0.75, -1.3) : new THREE.Vector3(-1.0, 0.9, 0.2);
    camera.position.lerp(pos, k);
    controls.target.lerp(tgt, k);
    controls.update();
    invalidate();
  });
  return null;
}

function Etiquetas() {
  return (
    <>
      <Label3D position={[-2.45, 2.75, -0.2]} title="Peladora de tambor" subtitle="Aspersión y dedos de goma" />
      <Label3D position={[-4.0, 2.55, 0.55]} title="Agua nueva" subtitle="Reposición" />
      <Label3D position={[-1.2, 1.4, 1.6]} title="Separación de sólidos" subtitle="Tamiz rotatorio" />
      <Label3D position={[-1.2, 0.55, 2.3]} title="Plumas y sólidos" />
      <Label3D position={[0.25, 0.95, 1.6]} title="Depósito de recolección" />
      <Label3D position={[1.9, 0.75, 1.9]} title="Bomba centrífuga" />
      <Label3D position={[1.75, 1.75, 0.2]} title="Sedimentación" subtitle="Tratamiento conceptual" />
      <Label3D position={[1.75, 1.65, -1.3]} title="Filtro de cartucho" />
      <Label3D position={[0.1, 1.45, -1.9]} title="Desinfección" subtitle="Etapa conceptual" />
      <Label3D position={[-1.95, 2.45, -1.9]} title="Línea de retorno" />
      {(Object.keys(VALVULA_POS) as ValvulaId[]).map((v) => (
        <Label3D key={v} position={[VALVULA_POS[v].pos[0], VALVULA_POS[v].pos[1] + 0.42, VALVULA_POS[v].pos[2]]} title={v.toUpperCase()} />
      ))}
    </>
  );
}

export default function RecirculacionScene() {
  const status = useRecirculacion((s) => s.status);
  return (
    <SceneCanvas
      running={status === "ejecutando"}
      camera={[4.4, 4.8, 7.4]}
      target={[-1.0, 0.9, 0.2]}
      overlay={
        <div className="hidden rounded-lg border border-white/10 bg-navy-950/80 px-2.5 py-1.5 text-[11px] text-slate-400 sm:block">
          Haga clic en una válvula para abrirla o cerrarla
        </div>
      }
    >
      <Peladora />
      <TanqueAguaNueva />
      <Tamiz />
      <Deposito />
      <Bomba />
      <Tratamiento />
      <Tuberias />
      <ParticulasAgua />
      {(Object.keys(VALVULA_POS) as ValvulaId[]).map((v) => (
        <Valvula key={v} id={v} />
      ))}
      <CamaraMantenimiento />
      <Etiquetas />
    </SceneCanvas>
  );
}
