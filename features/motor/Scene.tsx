"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { Label3D } from "@/components/three/Label3D";
import { clamp } from "@/lib/math";
import { motorSim, useMotor } from "./store";

/** La rotación se dibuja ralentizada para que sea perceptible (a 3600 RPM el eje da 60 vueltas por segundo). */
export const FACTOR_VISUAL = 1 / 25;
const EJE_Y = 0.85;

const C_GRIS = new THREE.Color("#8b97a8");
const C_NARANJA = new THREE.Color("#f97316");
const C_ROJO = new THREE.Color("#dc2626");

function colorTemperatura(t: number, out: THREE.Color) {
  if (t <= 40) return out.copy(C_GRIS);
  if (t <= 90) return out.copy(C_GRIS).lerp(C_NARANJA, (t - 40) / 50);
  return out.copy(C_NARANJA).lerp(C_ROJO, clamp((t - 90) / 30, 0, 1));
}

const ESP32_POS = new THREE.Vector3(-0.25, 1.32, -2.17);

function MotorModelo() {
  const cuerpo = useRef<THREE.Group>(null);
  const ventilador = useRef<THREE.Group>(null);
  const eje = useRef<THREE.Group>(null);
  const borron = useRef<THREE.MeshStandardMaterial>(null);
  const carcasaMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: C_GRIS, metalness: 0.65, roughness: 0.38 }),
    [],
  );
  const tmp = useMemo(() => new THREE.Color(), []);
  const anguloVisual = useRef(0);

  useFrame((_, delta) => {
    const s = motorSim.estado;
    const corriendo = useMotor.getState().status === "ejecutando";
    if (corriendo) anguloVisual.current += 2 * Math.PI * (s.rpm / 60) * FACTOR_VISUAL * Math.min(delta, 0.05);
    if (ventilador.current) ventilador.current.rotation.x = anguloVisual.current;
    if (eje.current) eje.current.rotation.x = anguloVisual.current;
    if (cuerpo.current) {
      // Desplazamiento proporcional a la aceleración medida (exagerado para que sea visible)
      const a = corriendo ? s.aceleracionActual : 0;
      cuerpo.current.position.y = a * 0.006;
      cuerpo.current.position.z = a * 0.004;
    }
    colorTemperatura(s.temperatura, tmp);
    carcasaMat.color.copy(tmp);
    carcasaMat.emissive.copy(tmp).multiplyScalar(clamp((s.temperatura - 70) / 60, 0, 0.35));
    if (borron.current) borron.current.opacity = clamp(s.rpm / 3600, 0, 1) * 0.55;
  });

  const aletas = useMemo(() => {
    const n = 20;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return { a, y: Math.cos(a) * 0.6, z: Math.sin(a) * 0.6 };
    }).filter((f) => f.y > -0.42); // sin aletas donde van las patas
  }, []);

  return (
    <group>
      {/* Base y pernos */}
      <mesh position={[0.1, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.9, 0.12, 1.35]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.6} />
      </mesh>
      {[-0.55, 0.55].flatMap((x) =>
        [-0.45, 0.45].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.16, z]}>
            <cylinderGeometry args={[0.05, 0.05, 0.08, 6]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.25} />
          </mesh>
        )),
      )}

      <group ref={cuerpo}>
        {/* Patas */}
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.27, 0]} castShadow material={carcasaMat}>
            <boxGeometry args={[0.32, 0.3, 1.05]} />
          </mesh>
        ))}

        <group position={[0, EJE_Y, 0]}>
          {/* Carcasa con aletas de refrigeración */}
          <mesh rotation-z={Math.PI / 2} castShadow material={carcasaMat}>
            <cylinderGeometry args={[0.55, 0.55, 1.6, 48]} />
          </mesh>
          {aletas.map((f) => (
            <mesh key={f.a} position={[0, f.y, f.z]} rotation-x={f.a} castShadow material={carcasaMat}>
              <boxGeometry args={[1.5, 0.11, 0.035]} />
            </mesh>
          ))}
          {/* Tapas */}
          <mesh position={[0.86, 0, 0]} rotation-z={Math.PI / 2} material={carcasaMat}>
            <cylinderGeometry args={[0.5, 0.55, 0.14, 40]} />
          </mesh>
          <mesh position={[-0.86, 0, 0]} rotation-z={Math.PI / 2} material={carcasaMat}>
            <cylinderGeometry args={[0.55, 0.5, 0.14, 40]} />
          </mesh>
          {/* Caja de bornes */}
          <mesh position={[0.1, 0.68, 0]} castShadow material={carcasaMat}>
            <boxGeometry args={[0.46, 0.26, 0.46]} />
          </mesh>
          {/* Placa de datos */}
          <mesh position={[-0.2, 0.12, 0.6]}>
            <boxGeometry args={[0.32, 0.18, 0.01]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Eje, chaveta y acople (giran) */}
          <group ref={eje}>
            <mesh position={[1.2, 0, 0]} rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.6, 24]} />
              <meshStandardMaterial color="#d1d5db" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh position={[1.2, 0.07, 0]}>
              <boxGeometry args={[0.3, 0.03, 0.04]} />
              <meshStandardMaterial color="#facc15" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[1.55, 0, 0]} rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.18, 0.18, 0.22, 32, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color="#f97316" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[1.55, 0, 0]} rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[0.18, 0.18, 0.22, 32, 1, false, Math.PI, Math.PI]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Tapa del ventilador (semitransparente) y rejilla */}
          <mesh position={[-1.08, 0, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.54, 0.54, 0.4, 40, 1, true]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {[0.18, 0.34, 0.5].map((r) => (
            <mesh key={r} position={[-1.28, 0, 0]} rotation-y={Math.PI / 2}>
              <torusGeometry args={[r, 0.012, 8, 48]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[-1.28, 0, 0]} rotation-x={(i / 6) * Math.PI}>
              <boxGeometry args={[0.02, 1.04, 0.02]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
          {/* Ventilador (gira) */}
          <group ref={ventilador} position={[-1.06, 0, 0]}>
            <mesh rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.1, 0.1, 0.12, 20]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => (
              <group key={i} rotation-x={(i / 8) * Math.PI * 2}>
                <mesh position={[0, 0.27, 0]} rotation-y={0.45}>
                  <boxGeometry args={[0.03, 0.36, 0.16]} />
                  <meshStandardMaterial color="#22d3ee" metalness={0.2} roughness={0.5} />
                </mesh>
              </group>
            ))}
            <mesh rotation-y={Math.PI / 2}>
              <circleGeometry args={[0.47, 40]} />
              <meshStandardMaterial ref={borron} color="#67e8f9" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          </group>

          {/* Sensor de vibración (acelerómetro) */}
          <group position={[0.55, 0.6, 0.18]}>
            <mesh castShadow>
              <boxGeometry args={[0.16, 0.07, 0.16]} />
              <meshStandardMaterial color="#2563eb" metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.05, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
          {/* Sensor de temperatura */}
          <group position={[-0.35, 0, 0.6]}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.03, 0.03, 0.16, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.11]}>
              <boxGeometry args={[0.09, 0.09, 0.07]} />
              <meshStandardMaterial color="#f97316" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function curva(puntos: [number, number, number][]) {
  return new THREE.CatmullRomCurve3(puntos.map((p) => new THREE.Vector3(...p)));
}

const CABLE_POTENCIA = curva([
  [0.1, 1.67, 0],
  [0.1, 2.05, -0.7],
  [0.45, 2.0, -1.6],
  [0.45, 1.62, -2.17],
]);

const LINEAS_DATOS = [
  {
    nombre: "vibracion",
    curva: curva([
      [0.55, 1.52, 0.18],
      [0.55, 2.3, -0.6],
      [-0.1, 2.15, -1.7],
      [ESP32_POS.x + 0.12, ESP32_POS.y + 0.1, ESP32_POS.z],
    ]),
    pulsos: 4,
    velocidad: 0.8,
  },
  {
    nombre: "temperatura",
    curva: curva([
      [-0.35, 0.85, 0.75],
      [-1.4, 1.0, 0.4],
      [-1.2, 1.35, -1.5],
      [ESP32_POS.x - 0.15, ESP32_POS.y, ESP32_POS.z],
    ]),
    pulsos: 1,
    velocidad: 0.3,
  },
  {
    nombre: "corriente",
    curva: curva([
      [0.3, 2.02, -1.25],
      [0.15, 1.75, -1.8],
      [ESP32_POS.x + 0.15, ESP32_POS.y - 0.08, ESP32_POS.z],
    ]),
    pulsos: 2,
    velocidad: 0.55,
  },
];

function Cableado() {
  const tubo = useMemo(() => new THREE.TubeGeometry(CABLE_POTENCIA, 60, 0.035, 10, false), []);
  const pinza = useMemo(() => {
    const p = CABLE_POTENCIA.getPointAt(0.48);
    const tg = CABLE_POTENCIA.getTangentAt(0.48);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg);
    return { p, q };
  }, []);
  return (
    <group>
      <mesh geometry={tubo} castShadow>
        <meshStandardMaterial color="#111827" roughness={0.7} />
      </mesh>
      <group position={pinza.p} quaternion={pinza.q}>
        <mesh>
          <torusGeometry args={[0.11, 0.04, 12, 32]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
        </mesh>
        <mesh position={[0.15, 0, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.08]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function FlujoDatos() {
  const refs = useRef<(THREE.Mesh | null)[][]>(LINEAS_DATOS.map(() => []));
  const fase = useRef(0);
  const puntos = useMemo(() => LINEAS_DATOS.map((l) => l.curva.getPoints(60)), []);

  useFrame((_, delta) => {
    const st = useMotor.getState();
    const activo = st.status === "ejecutando" && motorSim.estado.rpm > 1;
    if (activo) fase.current += Math.min(delta, 0.05);
    LINEAS_DATOS.forEach((l, i) => {
      for (let k = 0; k < l.pulsos; k++) {
        const m = refs.current[i][k];
        if (!m) continue;
        m.visible = activo;
        const u = (fase.current * l.velocidad + k / l.pulsos) % 1;
        m.position.copy(l.curva.getPointAt(u));
      }
    });
  });

  return (
    <group>
      {LINEAS_DATOS.map((l, i) => (
        <group key={l.nombre}>
          <Line points={puntos[i]} color="#22d3ee" lineWidth={1.5} dashed dashSize={0.08} gapSize={0.06} transparent opacity={0.7} />
          {Array.from({ length: l.pulsos }, (_, k) => (
            <mesh
              key={k}
              ref={(m) => {
                refs.current[i][k] = m;
              }}
            >
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color="#a5f3fc" toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function GabineteControl() {
  const led = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const p = useMotor.getState().prediccion;
    const color =
      p?.clase === "Anomalía" ? "#ef4444" : p?.clase === "Advertencia" ? "#eab308" : p?.clase === "Normal" ? "#22c55e" : "#475569";
    led.current?.color.set(color);
  });
  const z = ESP32_POS.z;
  return (
    <group>
      {/* Poste y gabinete */}
      <mesh position={[0, 0.6, z - 0.15]} castShadow>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.35, z - 0.12]} castShadow>
        <boxGeometry args={[1.3, 0.9, 0.08]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Placa ESP32 */}
      <group position={[ESP32_POS.x, ESP32_POS.y, z - 0.06]}>
        <mesh>
          <boxGeometry args={[0.55, 0.28, 0.025]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[0.06, 0.02, 0.025]}>
          <boxGeometry args={[0.2, 0.16, 0.025]} />
          <meshStandardMaterial color="#d1d5db" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.22, 0.02, 0.02]}>
          <boxGeometry args={[0.08, 0.16, 0.01]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <group key={i}>
            <mesh position={[-0.24 + i * 0.04, 0.125, 0.02]}>
              <boxGeometry args={[0.015, 0.02, 0.02]} />
              <meshStandardMaterial color="#facc15" metalness={0.8} />
            </mesh>
            <mesh position={[-0.24 + i * 0.04, -0.125, 0.02]}>
              <boxGeometry args={[0.015, 0.02, 0.02]} />
              <meshStandardMaterial color="#facc15" metalness={0.8} />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.2, 0.0, 0.03]}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshBasicMaterial ref={led} color="#475569" toneMapped={false} />
        </mesh>
      </group>
      {/* Variador de frecuencia */}
      <mesh position={[0.42, 1.3, z - 0.05]}>
        <boxGeometry args={[0.32, 0.55, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0.42, 1.43, z - 0.005]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Etiquetas() {
  return (
    <>
      <Label3D position={[0.55, EJE_Y + 0.75, 0.18]} title="Sensor de vibración" subtitle="Acelerómetro" />
      <Label3D position={[-0.35, EJE_Y + 0.12, 0.8]} title="Sensor de temperatura" subtitle="Sonda en carcasa" />
      <Label3D position={[0.3, 2.22, -1.25]} title="Sensor de corriente" subtitle="Pinza no invasiva" />
      <Label3D position={[ESP32_POS.x, ESP32_POS.y + 0.3, ESP32_POS.z]} title="ESP32 + TinyML" subtitle="Adquisición y clasificación" />
      <Label3D position={[0.42, 0.98, ESP32_POS.z]} title="Variador (VFD)" />
      <Label3D position={[-1.1, EJE_Y + 0.65, 0]} title="Ventilador" subtitle="Refrigeración" />
      <Label3D position={[1.55, EJE_Y + 0.32, 0]} title="Eje y acople" />
      <Label3D position={[-0.1, EJE_Y - 0.05, -0.75]} title="Carcasa del motor" subtitle="Color según temperatura" />
    </>
  );
}

export default function MotorScene() {
  const status = useMotor((s) => s.status);
  return (
    <SceneCanvas
      running={status === "ejecutando"}
      camera={[4.6, 3.1, 4.6]}
      target={[0, 1.0, -0.55]}
      overlay={
        <div className="hidden rounded-lg border border-white/10 bg-navy-950/80 px-2.5 py-1.5 text-[11px] text-slate-400 sm:block">
          Giro dibujado 25 veces más lento · vibración exagerada
        </div>
      }
    >
      <MotorModelo />
      <Cableado />
      <FlujoDatos />
      <GabineteControl />
      <Etiquetas />
    </SceneCanvas>
  );
}
