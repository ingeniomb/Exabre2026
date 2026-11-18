"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { Label3D } from "@/components/three/Label3D";
import { clamp } from "@/lib/math";
import { colorGrano, EQUIPO } from "./simulation";
import { tostadoraSim, useTostadora } from "./store";

const EJE_Y = 1.35;
const R = 0.5; // radio dibujado del tambor
const LARGO = 1.6;
const N_GRANOS = 240;
const BANDEJA = new THREE.Vector3(-1.75, 0.62, 1.05);

// Plano de corte: conserva solo la mitad trasera (z ≤ 0) para ver el interior
const PLANO_CORTE = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

function useMaterialesTambor(corte: boolean) {
  const acero = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b8c0cc", metalness: 0.85, roughness: 0.32, side: THREE.DoubleSide }),
    [],
  );
  const oscuro = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#475569", metalness: 0.7, roughness: 0.4, side: THREE.DoubleSide }),
    [],
  );
  useEffect(() => {
    for (const m of [acero, oscuro]) {
      m.clippingPlanes = corte ? [PLANO_CORTE] : [];
      m.needsUpdate = true;
    }
  }, [corte, acero, oscuro]);
  return { acero, oscuro };
}

function Tambor() {
  const vista = useTostadora((s) => s.vista);
  const { acero, oscuro } = useMaterialesTambor(vista === "corte");
  const giro = useRef<THREE.Group>(null);
  const poleaMotor = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const corriendo = useTostadora.getState().status === "ejecutando";
    const s = tostadoraSim.estado;
    const w = corriendo ? (2 * Math.PI * tostadoraSim.params.rpm) / 60 : 0;
    const dt = Math.min(delta, 0.05);
    if (giro.current) giro.current.rotation.x += w * dt;
    // Relación de poleas 0,28 / 0,09 ≈ 3,1
    if (poleaMotor.current) poleaMotor.current.rotation.x += w * (0.28 / 0.09) * dt;
    // Brillo térmico leve del acero
    const calor = clamp((s.tTambor - 120) / 200, 0, 1);
    acero.emissive.setRGB(0.18 * calor, 0.05 * calor, 0);
  });

  const correa = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const a = { y: EJE_Y, r: 0.29 };
    const b = { y: 0.42, r: 0.1 };
    for (let i = 0; i <= 16; i++) {
      const t = -Math.PI / 2 + (i / 16) * Math.PI;
      pts.push(new THREE.Vector3(1.15, a.y + a.r * Math.sin(t), a.r * Math.cos(t)));
    }
    for (let i = 0; i <= 16; i++) {
      const t = Math.PI / 2 + (i / 16) * Math.PI;
      pts.push(new THREE.Vector3(1.15, b.y + b.r * Math.sin(t), b.r * Math.cos(t)));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, 0.016, 6, true);
  }, []);

  return (
    <group>
      {/* Soportes laterales en A con chumaceras */}
      {[-0.98, 0.98].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[-1, 1].map((sz) => (
            <mesh key={sz} position={[0, EJE_Y / 2, sz * 0.32]} rotation-x={sz * 0.24} castShadow>
              <boxGeometry args={[0.1, EJE_Y + 0.1, 0.1]} />
              <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.5} />
            </mesh>
          ))}
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.2, 0.06, 0.95]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, EJE_Y, 0]} rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.14, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Eje fijo visible */}
      <mesh position={[0.15, EJE_Y, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.04, 0.04, 2.6, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Tambor giratorio */}
      <group ref={giro} position={[0, EJE_Y, 0]}>
        <mesh rotation-z={Math.PI / 2} material={acero} castShadow>
          <cylinderGeometry args={[R, R, LARGO, 64, 1, true]} />
        </mesh>
        {[-LARGO / 2, LARGO / 2].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation-y={Math.PI / 2} material={oscuro}>
            <circleGeometry args={[R, 64]} />
          </mesh>
        ))}
        {/* Aros de refuerzo */}
        {[-0.55, 0, 0.55].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation-y={Math.PI / 2} material={oscuro}>
            <torusGeometry args={[R + 0.012, 0.018, 8, 64]} />
          </mesh>
        ))}
        {/* Paletas internas de mezcla */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <mesh key={i} position={[0, Math.cos(a) * (R - 0.06), Math.sin(a) * (R - 0.06)]} rotation-x={a} material={oscuro}>
              <boxGeometry args={[LARGO * 0.92, 0.12, 0.02]} />
            </mesh>
          );
        })}
        {/* Compuerta de carga */}
        <mesh position={[0.35, R + 0.01, 0]} material={oscuro}>
          <boxGeometry args={[0.3, 0.02, 0.22]} />
        </mesh>
        {/* Polea del tambor */}
        <group position={[1.15, 0, 0]}>
          <mesh rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.28, 0.28, 0.05, 40]} />
            <meshStandardMaterial color="#f97316" metalness={0.5} roughness={0.4} />
          </mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation-x={(i / 3) * Math.PI} position={[0.03, 0, 0]}>
              <boxGeometry args={[0.02, 0.5, 0.04]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          ))}
        </group>
      </group>

      {/* Motorreductor y transmisión por correa */}
      <mesh geometry={correa}>
        <meshStandardMaterial color="#111827" roughness={0.8} />
      </mesh>
      <group position={[1.15, 0.42, 0]} ref={poleaMotor}>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.09, 0.09, 0.05, 24]} />
          <meshStandardMaterial color="#f97316" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.03, 0, 0]}>
          <boxGeometry args={[0.02, 0.16, 0.03]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
      <group position={[1.42, 0.42, 0]}>
        <mesh rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.42, 32]} />
          <meshStandardMaterial color="#2563eb" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.46, 0.1, 0.36]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {/* Tolva de carga */}
      <mesh position={[0.35, EJE_Y + R + 0.32, 0]}>
        <cylinderGeometry args={[0.28, 0.08, 0.45, 4, 1, true]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Estufa() {
  const llamas = useRef<THREE.Group>(null);
  const luz = useRef<THREE.PointLight>(null);
  const quemadores = [-0.48, 0, 0.48];

  useFrame(({ clock }) => {
    const s = tostadoraSim.estado;
    const corriendo = useTostadora.getState().status === "ejecutando" || s.fase === "tostando";
    const l = corriendo ? s.llama : 0;
    if (luz.current) luz.current.intensity = l * 6;
    llamas.current?.children.forEach((c, i) => {
      const fl = 1 + 0.18 * Math.sin(clock.elapsedTime * 18 + i * 1.7) + 0.08 * Math.sin(clock.elapsedTime * 31 + i);
      const h = l * fl;
      c.visible = h > 0.02;
      c.scale.set(0.6 + 0.4 * l, Math.max(h, 0.01), 0.6 + 0.4 * l);
    });
  });

  return (
    <group>
      {/* Mesa de la estufa */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.7]} />
        <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.5} />
      </mesh>
      {[-0.68, 0.68].flatMap((x) =>
        [-0.3, 0.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.24, z]}>
            <boxGeometry args={[0.05, 0.48, 0.05]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
        )),
      )}
      {/* Parrilla */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.64, 0]}>
          <boxGeometry args={[0.02, 0.02, 0.6]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
      {/* Quemadores */}
      {quemadores.map((x) => (
        <mesh key={x} position={[x, 0.57, 0]}>
          <cylinderGeometry args={[0.11, 0.13, 0.06, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Llamas: conos azules interiores y anaranjados exteriores */}
      <group ref={llamas}>
        {quemadores.flatMap((x) =>
          [0, 1, 2, 3, 4, 5].map((k) => {
            const a = (k / 6) * Math.PI * 2;
            return (
              <group key={`${x}-${k}`} position={[x + Math.cos(a) * 0.07, 0.6, Math.sin(a) * 0.07]}>
                <mesh position={[0, 0.16, 0]}>
                  <coneGeometry args={[0.045, 0.32, 10]} />
                  <meshBasicMaterial color="#fb923c" transparent opacity={0.75} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
                <mesh position={[0, 0.07, 0]}>
                  <coneGeometry args={[0.025, 0.14, 8]} />
                  <meshBasicMaterial color="#60a5fa" transparent opacity={0.85} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
              </group>
            );
          }),
        )}
      </group>
      <pointLight ref={luz} position={[0, 0.85, 0]} color="#fb923c" intensity={0} distance={3} decay={1.5} />
      {/* Tubería de gas, perilla y cilindro */}
      <mesh position={[0, 0.5, 0.4]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 10]} />
        <meshStandardMaterial color="#facc15" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.6, 0.5, 0.44]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.045, 0.045, 0.05, 16]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <group position={[-1.6, 0, -0.65]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.8, 24]} />
          <meshStandardMaterial color="#f97316" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f97316" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.13, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      </group>
      <mesh>
        <tubeGeometry
          args={[
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(-1.6, 1.15, -0.65),
              new THREE.Vector3(-1.3, 0.6, -0.1),
              new THREE.Vector3(-0.9, 0.48, 0.4),
              new THREE.Vector3(-0.75, 0.5, 0.4),
            ]),
            30,
            0.018,
            8,
            false,
          ]}
        />
        <meshStandardMaterial color="#111827" />
      </mesh>
    </group>
  );
}

function BandejaEnfriamiento() {
  return (
    <group position={BANDEJA}>
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.5, 0.48, 0.1, 40, 1, true]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.08, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.48, 40]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.36, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.56, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
}

function crearDatos() {
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  return Array.from({ length: N_GRANOS }, () => ({
    x: rnd(-0.68, 0.68),
    capa: rnd(0, 1), // 0 = pegado a la pared, 1 = superficie del lecho
    fase: Math.random(),
    phi: rnd(-0.55, 0.55),
    ruido: rnd(-1, 1),
    rot: new THREE.Euler(rnd(0, 6), rnd(0, 6), rnd(0, 6)),
    giro: new THREE.Vector3(rnd(-3, 3), rnd(-3, 3), rnd(-3, 3)),
    bandeja: { r: Math.sqrt(Math.random()) * 0.42, a: rnd(0, Math.PI * 2) },
  }));
}

/** Granos con un modelo cinemático de lecho rodante (no es un motor de física). */
function Granos() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const datosRef = useRef<ReturnType<typeof crearDatos> | null>(null);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    datosRef.current ??= crearDatos();
    const datos = datosRef.current;
    const st = useTostadora.getState();
    const s = tostadoraSim.estado;
    const corriendo = st.status === "ejecutando";
    const dt = corriendo ? Math.min(delta, 0.05) : 0;
    const rpm = tostadoraSim.params.rpm;
    const nc = EQUIPO.rpmCritica;
    const w = (2 * Math.PI * rpm) / 60;
    const tRel = 0.55 + 1.05 * Math.min(rpm / nc, 1); // ángulo de desprendimiento
    const tLand = -0.6;
    const enBandeja = s.fase === "enfriando" || s.fase === "terminado";
    m.visible = s.fase !== "listo";

    for (let i = 0; i < N_GRANOS; i++) {
      const g = datos[i];
      const r = R - 0.04 - g.capa * 0.16;
      let x = g.x;
      let y: number;
      let z: number;
      if (enBandeja) {
        g.bandeja.a += dt * 0.6 * (1 - g.bandeja.r);
        x = BANDEJA.x + Math.cos(g.bandeja.a) * g.bandeja.r;
        y = BANDEJA.y - 0.04 + (g.capa > 0.5 ? 0.03 : 0);
        z = BANDEJA.z + Math.sin(g.bandeja.a) * g.bandeja.r;
      } else if (rpm >= nc) {
        // Centrifugado: los granos giran pegados a la pared y casi no se mezclan
        g.phi += w * dt;
        y = EJE_Y - (R - 0.04) * Math.cos(g.phi);
        z = -(R - 0.04) * Math.sin(g.phi);
      } else {
        // Ciclo: subir con la pared (parte arrastrada) y caer en cascada
        const vel = w * (0.55 + 0.45 * (1 - g.capa));
        const tSubida = (tRel - tLand) / Math.max(vel, 1e-3);
        const tCaida = 0.38;
        const T = tSubida + tCaida;
        g.fase = (g.fase + dt / T) % 1;
        const u = g.fase * T;
        if (u < tSubida) {
          const phi = tLand + vel * u;
          y = EJE_Y - r * Math.cos(phi);
          z = -r * Math.sin(phi);
        } else {
          const k = (u - tSubida) / tCaida;
          const y1 = EJE_Y - r * Math.cos(tRel);
          const z1 = -r * Math.sin(tRel);
          const y2 = EJE_Y - (R - 0.06) * Math.cos(tLand);
          const z2 = -(R - 0.06) * Math.sin(tLand);
          y = y1 + (y2 - y1) * k - 0.12 * Math.sin(Math.PI * k);
          z = z1 + (z2 - z1) * k;
        }
        // Mezcla axial lenta
        g.x += dt * 0.08 * g.ruido * (0.5 + 0.5 * Math.sin(g.fase * 6.28));
        if (g.x > 0.7 || g.x < -0.7) g.ruido *= -1;
        x = g.x;
      }
      g.rot.x += g.giro.x * dt;
      g.rot.y += g.giro.y * dt;
      dummy.position.set(x, y, z);
      dummy.rotation.copy(g.rot);
      dummy.scale.set(0.034, 0.022, 0.027); // grano: elipsoide aplanado
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      const [cr, cg, cb] = colorGrano(s.tMax + g.ruido * (4 + 38 * s.dispersion));
      color.setRGB(cr, cg, cb, THREE.SRGBColorSpace);
      m.setColorAt(i, color);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N_GRANOS]} castShadow frustumCulled={false}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial roughness={0.55} metalness={0.05} />
    </instancedMesh>
  );
}

function Etiquetas() {
  return (
    <>
      <Label3D position={[-0.2, EJE_Y + R + 0.2, 0]} title="Tambor metálico horizontal" subtitle="Gira sobre su eje" />
      <Label3D position={[-0.98, 0.35, -0.55]} title="Soporte lateral" />
      <Label3D position={[0.98, 0.25, 0.5]} title="Soporte lateral" />
      <Label3D position={[1.25, EJE_Y + 0.42, 0]} title="Polea y correa" subtitle="Transmisión" />
      <Label3D position={[1.42, 0.75, 0]} title="Motorreductor" />
      <Label3D position={[0.35, EJE_Y + R + 0.62, 0]} title="Tolva de carga" />
      <Label3D position={[0, 0.38, 0.55]} title="Estufa de gas" subtitle="3 quemadores" />
      <Label3D position={[-1.6, 1.35, -0.65]} title="Cilindro de gas" />
      <Label3D position={[0.2, EJE_Y - 0.25, 0.1]} title="Granos de café" />
      <Label3D position={[BANDEJA.x, BANDEJA.y + 0.25, BANDEJA.z]} title="Bandeja de enfriamiento" />
    </>
  );
}

export default function TostadoraScene() {
  const status = useTostadora((s) => s.status);
  const vista = useTostadora((s) => s.vista);
  return (
    <SceneCanvas
      running={status === "ejecutando"}
      camera={[2.6, 2.6, 4.4]}
      target={[0, 1.0, 0]}
      overlay={
        <div className="hidden rounded-lg border border-white/10 bg-navy-950/80 px-2.5 py-1.5 text-[11px] text-slate-400 sm:block">
          {vista === "corte" ? "Vista en corte: se retiró la mitad frontal del tambor" : "Vista exterior"}
        </div>
      }
    >
      <Tambor />
      <Estufa />
      <BandejaEnfriamiento />
      <Granos />
      <Etiquetas />
    </SceneCanvas>
  );
}
