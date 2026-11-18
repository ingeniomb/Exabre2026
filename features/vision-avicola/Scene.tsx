"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { Label3D } from "@/components/three/Label3D";
import { MUESTRAS, type Muestra } from "./muestras";
import { ETAPAS_VISION, useVision, visionSim } from "./store";

const AREA = new THREE.Vector3(0, 0, 0.7);
const CAMARA = new THREE.Vector3(0, 2.25, 0.7);
const PROCESADOR = new THREE.Vector3(0.95, 1.35, 0.7);
const PANTALLA = new THREE.Vector3(2.1, 1.25, -0.3);

function crearViruta() {
  const geo = new THREE.BoxGeometry(0.09, 0.008, 0.03);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.95 }), 500);
  const d = new THREE.Object3D();
  const c = new THREE.Color();
  const tonos = ["#c8a46e", "#b88f55", "#d9bb85", "#a57b45"];
  for (let i = 0; i < 500; i++) {
    d.position.set((Math.random() - 0.5) * 6.5, 0.012, (Math.random() - 0.5) * 4.5 - 0.3);
    d.rotation.set(0, Math.random() * Math.PI, 0);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
    mesh.setColorAt(i, c.set(tonos[i % 4]));
  }
  return mesh;
}

function Galpon() {
  const viruta = useMemo(() => crearViruta(), []);
  return (
    <group>
      {/* Cama de viruta */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, -0.3]} receiveShadow>
        <planeGeometry args={[6.8, 4.8]} />
        <meshStandardMaterial color="#b89466" roughness={1} />
      </mesh>
      <primitive object={viruta} />
      {/* Muro bajo, malla y columnas del galpón */}
      <mesh position={[0, 0.3, -2.7]} castShadow>
        <boxGeometry args={[6.8, 0.6, 0.12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.35, -2.7]}>
        <planeGeometry args={[6.8, 1.5, 34, 8]} />
        <meshBasicMaterial color="#94a3b8" wireframe />
      </mesh>
      {[-3.3, -1.1, 1.1, 3.3].map((x) => (
        <mesh key={x} position={[x, 1.4, -2.7]} castShadow>
          <boxGeometry args={[0.14, 2.8, 0.14]} />
          <meshStandardMaterial color="#78716c" />
        </mesh>
      ))}
      <mesh position={[0, 2.85, -2.7]}>
        <boxGeometry args={[6.9, 0.12, 0.14]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
      {/* Comedero de tolva y bebedero de campana */}
      <group position={[-2.0, 0, -1.3]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.35, 0.3, 0.1, 24]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.7, 16]} />
          <meshStandardMaterial color="#e2e8f0" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 1.6, 6]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>
      <group position={[-0.6, 0, -1.8]}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.12, 0.3, 0.22, 24]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <torusGeometry args={[0.28, 0.035, 8, 24]} />
          <meshStandardMaterial color="#60a5fa" />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 2.5, 6]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>
    </group>
  );
}

function Gallina({ centro, radio, vel, fase, color }: { centro: [number, number]; radio: number; vel: number; fase: number; color: string }) {
  const grupo = useRef<THREE.Group>(null);
  const cabeza = useRef<THREE.Group>(null);
  const a = useRef(fase);
  useFrame(({ clock }, delta) => {
    const corriendo = useVision.getState().status === "ejecutando";
    if (corriendo) a.current += vel * Math.min(delta, 0.05);
    const g = grupo.current;
    if (!g) return;
    g.position.set(centro[0] + Math.cos(a.current) * radio, 0, centro[1] + Math.sin(a.current) * radio);
    g.rotation.y = -a.current - (vel > 0 ? 0 : Math.PI);
    if (cabeza.current) cabeza.current.rotation.z = corriendo ? Math.max(0, Math.sin(clock.elapsedTime * 3 + fase * 5)) * 0.9 : 0;
  });
  return (
    <group ref={grupo}>
      <group rotation-y={Math.PI / 2}>
        <mesh position={[0, 0.3, 0]} scale={[0.26, 0.2, 0.17]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={color} flatShading roughness={0.9} />
        </mesh>
        <mesh position={[-0.24, 0.42, 0]} rotation-z={0.9}>
          <coneGeometry args={[0.1, 0.22, 5]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
        <group ref={cabeza} position={[0.2, 0.42, 0]}>
          <mesh position={[0.06, 0.08, 0]}>
            <icosahedronGeometry args={[0.085, 1]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
          <mesh position={[0.06, 0.18, 0]}>
            <boxGeometry args={[0.09, 0.05, 0.025]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
          <mesh position={[0.16, 0.07, 0]} rotation-z={-Math.PI / 2}>
            <coneGeometry args={[0.025, 0.07, 4]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          <mesh position={[0.11, 0.0, 0]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
        {[-0.05, 0.05].map((z) => (
          <mesh key={z} position={[0.02, 0.07, z]}>
            <cylinderGeometry args={[0.012, 0.012, 0.15, 5]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function piezasDe(m: Muestra) {
  let h = 7;
  for (const c of m.id) h = (h * 31 + c.charCodeAt(0)) % 10007;
  const rnd = () => ((h = (h * 16807) % 2147483647) / 2147483647);
  const extension = 0.12 + m.extension * 0.16;
  return Array.from({ length: 9 }, () => ({
    x: (rnd() - 0.5) * extension * 1.4,
    z: (rnd() - 0.5) * extension,
    s: 0.05 + rnd() * 0.05 + m.extension * 0.04,
  }));
}

function MuestraEnArea() {
  const id = useVision((s) => s.seleccion);
  const m = MUESTRAS.find((x) => x.id === id)!;
  const piezas = useMemo(() => piezasDe(m), [m]);
  return (
    <group position={[AREA.x, 0.02, AREA.z]}>
      {piezas.map((p, i) => (
        <mesh key={i} position={[p.x, 0, p.z]} scale={[p.s * 1.3, p.s * (0.45 - m.extension * 0.3), p.s]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color={m.colorBase} roughness={1 - m.brillo * 0.8} />
        </mesh>
      ))}
      {m.uratos ? (
        <mesh position={[0.03, 0.025, -0.02]} scale={[0.07, 0.025, 0.05]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#f1efe6" roughness={0.7} />
        </mesh>
      ) : null}
      {m.manchas
        ? Array.from({ length: Math.min(10, m.manchas.n) }, (_, i) => (
            <mesh key={i} position={[Math.cos(i * 2.3) * 0.09, 0.035, Math.sin(i * 2.3) * 0.06]} scale={m.manchas!.forma === "hilo" ? [0.03, 0.006, 0.008] : [0.012, 0.01, 0.009]}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color={m.manchas!.color} />
            </mesh>
          ))
        : null}
    </group>
  );
}

function AreaYCamara() {
  const anillo = useRef<THREE.Mesh>(null);
  const cono = useRef<THREE.MeshBasicMaterial>(null);
  const flash = useRef<THREE.PointLight>(null);
  const barrido = useRef<THREE.Mesh>(null);
  const led = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock, invalidate }) => {
    const e = visionSim.etapa;
    const t = clock.elapsedTime;
    const k = e >= 1 && e <= 6 ? visionSim.tEtapa / ETAPAS_VISION[e - 1].dur : 0;
    if (anillo.current) {
      anillo.current.visible = e === 1 || e === 7 || e === 5 || e === 6;
      const s = e === 1 ? 1 + 0.25 * Math.sin(t * 8) : 1;
      anillo.current.scale.set(s, s, 1);
    }
    if (cono.current) cono.current.opacity = e === 2 ? 0.35 * (1 - k) + 0.1 : e >= 1 && e <= 4 ? 0.12 : 0.05;
    if (flash.current) flash.current.intensity = e === 2 && k < 0.35 ? 25 : 0;
    if (barrido.current) {
      barrido.current.visible = e === 3 || e === 4;
      barrido.current.position.x = -0.5 + ((t * 0.6) % 1);
    }
    led.current?.color.set(e >= 2 && e <= 4 ? (Math.sin(t * 20) > 0 ? "#22d3ee" : "#0e7490") : e === 6 ? "#ef4444" : "#22c55e");
    if (e >= 1 && e <= 6) invalidate();
  });

  return (
    <group>
      {/* Área de observación demarcada */}
      <group position={[AREA.x, 0.015, AREA.z]}>
        {[
          [0, -0.45, 1.3, 0.03],
          [0, 0.45, 1.3, 0.03],
          [-0.65, 0, 0.03, 0.9],
          [0.65, 0, 0.03, 0.9],
        ].map(([x, z, w, d], i) => (
          <mesh key={i} position={[x, 0, z]}>
            <boxGeometry args={[w, 0.01, d]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
        ))}
        <mesh ref={anillo} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.28, 0.31, 40]} />
          <meshBasicMaterial color="#22d3ee" toneMapped={false} />
        </mesh>
        <mesh ref={barrido} position={[0, 0.03, 0]}>
          <boxGeometry args={[0.015, 0.02, 0.85]} />
          <meshBasicMaterial color="#22d3ee" toneMapped={false} />
        </mesh>
      </group>

      {/* Poste, brazo y cámara */}
      <mesh position={[0.95, 1.15, AREA.z]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 2.3, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.6} />
      </mesh>
      <mesh position={[0.47, 2.3, AREA.z]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.025, 0.025, 1.0, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.6} />
      </mesh>
      <group position={CAMARA}>
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.12, 0.18]} />
          <meshStandardMaterial color="#1e293b" metalness={0.4} />
        </mesh>
        <mesh position={[0, -0.09, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 0.07, 20]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, -0.126, 0]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.04, 20]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.05} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.09, 0.03, 0.091]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial ref={led} color="#22c55e" toneMapped={false} />
        </mesh>
        <pointLight ref={flash} position={[0, -0.2, 0]} intensity={0} distance={3} color="#e0f2fe" />
      </group>
      {/* Campo de visión */}
      <mesh position={[0, CAMARA.y / 2 - 0.06, AREA.z]}>
        <coneGeometry args={[0.6, CAMARA.y - 0.12, 4, 1, true]} />
        <meshBasicMaterial ref={cono} color="#22d3ee" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Caja del procesador */}
      <group position={PROCESADOR}>
        <mesh position={[0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.3, 0.26]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[0.185, 0, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[0.18, 0.12]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>
    </group>
  );
}

const CABLES = [
  new THREE.CatmullRomCurve3([CAMARA.clone().add(new THREE.Vector3(0.12, 0.05, 0)), new THREE.Vector3(0.95, 2.33, AREA.z), PROCESADOR.clone().add(new THREE.Vector3(0.1, 0.16, 0))]),
  new THREE.CatmullRomCurve3([
    PROCESADOR.clone().add(new THREE.Vector3(0.18, -0.1, 0)),
    new THREE.Vector3(1.5, 0.4, 0.4),
    new THREE.Vector3(2.1, 0.35, -0.2),
    PANTALLA.clone().add(new THREE.Vector3(0, -0.45, 0)),
  ]),
];

function FlujoDatos() {
  const pulsos = useRef<(THREE.Mesh | null)[]>([]);
  const fase = useRef(0);
  const tubos = useMemo(() => CABLES.map((c) => new THREE.TubeGeometry(c, 40, 0.012, 6, false)), []);
  useFrame((_, delta) => {
    const e = visionSim.etapa;
    const corriendo = useVision.getState().status === "ejecutando";
    if (corriendo) fase.current += Math.min(delta, 0.05);
    pulsos.current.forEach((p, i) => {
      if (!p) return;
      const cable = i < 3 ? 0 : 1;
      const activo = cable === 0 ? e >= 2 && e <= 3 : e >= 4 && e <= 6;
      p.visible = activo && corriendo;
      p.position.copy(CABLES[cable].getPointAt((fase.current * 0.9 + (i % 3) / 3) % 1));
    });
  });
  return (
    <group>
      {tubos.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            pulsos.current[i] = m;
          }}
        >
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color="#a5f3fc" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function dibujarPantalla(ctx: CanvasRenderingContext2D, texto: string, r: { categoria: string; confianza: number; alerta: boolean } | null) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#155e75";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.fillStyle = "#22d3ee";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText("SISTEMA DE VISIÓN · SIMULADO", 28, 48);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 36px system-ui, sans-serif";
  ctx.fillText(texto, 28, 104);
  if (r) {
    ctx.font = "500 30px system-ui, sans-serif";
    ctx.fillText(r.categoria, 28, 160);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText(`Confianza simulada: ${(r.confianza * 100).toFixed(0)} %`, 28, 200);
    if (r.alerta) {
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(28, 226, W - 56, 50);
      ctx.fillStyle = "#fecaca";
      ctx.font = "700 24px system-ui, sans-serif";
      ctx.fillText("ALERTA: revisar con médico veterinario", 42, 260);
    }
  }
}

function pintarTextura(t: THREE.CanvasTexture, texto: string, r: Parameters<typeof dibujarPantalla>[2]) {
  const ctx = (t.image as HTMLCanvasElement).getContext("2d");
  if (!ctx) return;
  dibujarPantalla(ctx, texto, r);
  t.needsUpdate = true;
}

function Pantalla() {
  const etapa = useVision((s) => s.etapa);
  const resultado = useVision((s) => s.resultado);
  const textura = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 300;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => {
    const texto = etapa === 0 ? "En espera" : etapa === 7 ? "Análisis terminado" : ETAPAS_VISION[etapa - 1].nombre;
    pintarTextura(textura, texto, resultado && etapa >= 5 ? resultado : null);
  }, [etapa, resultado, textura]);
  return (
    <group position={PANTALLA}>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 20]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <group rotation-y={0.25}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 0.5, 0.05]} />
          <meshStandardMaterial color="#0f172a" metalness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.027]}>
          <planeGeometry args={[0.94, 0.44]} />
          <meshBasicMaterial map={textura} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Etiquetas() {
  return (
    <>
      <Label3D position={[CAMARA.x, CAMARA.y + 0.25, CAMARA.z]} title="Cámara de captura" />
      <Label3D position={[AREA.x - 0.4, 0.2, AREA.z + 0.5]} title="Área de observación" />
      <Label3D position={[PROCESADOR.x + 0.1, PROCESADOR.y + 0.3, PROCESADOR.z]} title="Dispositivo de procesamiento" subtitle="Ej.: ESP32-CAM o placa embebida" />
      <Label3D position={[PANTALLA.x, PANTALLA.y + 0.45, PANTALLA.z]} title="Pantalla de resultados" />
      <Label3D position={[-2.0, 1.0, -1.3]} title="Comedero" />
      <Label3D position={[-0.6, 0.45, -1.8]} title="Bebedero" />
      <Label3D position={[1.1, 2.6, -2.7]} title="Galpón avícola" />
    </>
  );
}

export default function VisionScene() {
  const status = useVision((s) => s.status);
  return (
    <SceneCanvas running={status === "ejecutando"} camera={[3.2, 3.0, 4.6]} target={[0.4, 0.8, -0.2]}>
      <Galpon />
      <Gallina centro={[-1.5, -0.6]} radio={0.7} vel={0.35} fase={0} color="#f8fafc" />
      <Gallina centro={[-1.4, -0.4]} radio={1.1} vel={-0.25} fase={2} color="#b45309" />
      <Gallina centro={[1.3, -1.5]} radio={0.6} vel={0.3} fase={4} color="#f8fafc" />
      <Gallina centro={[-0.3, -1.1]} radio={0.5} vel={-0.4} fase={1} color="#92400e" />
      <AreaYCamara />
      <MuestraEnArea />
      <FlujoDatos />
      <Pantalla />
      <Etiquetas />
    </SceneCanvas>
  );
}
