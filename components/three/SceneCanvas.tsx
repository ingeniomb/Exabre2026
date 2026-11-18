"use client";

import { Component, Suspense, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Crosshair } from "lucide-react";

class SceneErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error) return <SceneFallback motivo="Ocurrió un error al dibujar la escena 3D." />;
    return this.props.children;
  }
}

function SceneFallback({ motivo }: { motivo: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-400">
      <div>
        <p className="mb-1 font-semibold text-slate-200">No se pudo mostrar la vista 3D</p>
        <p>{motivo}</p>
        <p className="mt-2">Los controles, indicadores y gráficas siguen funcionando.</p>
      </div>
    </div>
  );
}

let webglCache: boolean | null = null;
function detectWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    webglCache = Boolean(gl);
    // Libera el contexto de prueba para no ocupar uno de los pocos disponibles
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

const noop = () => () => {};
function useIsMobile() {
  return useSyncExternalStore(
    noop,
    () => window.matchMedia("(max-width: 768px)").matches,
    () => false,
  );
}
function useWebGL() {
  return useSyncExternalStore(noop, detectWebGL, () => true);
}

export function SceneCanvas({
  children,
  camera = [6, 4, 7],
  target = [0, 0.8, 0],
  running,
  overlay,
}: {
  children: ReactNode;
  camera?: [number, number, number];
  target?: [number, number, number];
  running: boolean;
  overlay?: ReactNode;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const mobile = useIsMobile();
  const webgl = useWebGL();
  const [ready, setReady] = useState(false);

  if (!webgl) return <SceneFallback motivo="Este navegador o dispositivo no tiene WebGL disponible." />;

  return (
    <SceneErrorBoundary>
      <div className="absolute inset-0">
        <Canvas
          shadows={mobile ? false : "percentage"}
          dpr={[1, mobile ? 1.5 : 2]}
          frameloop={running ? "always" : "demand"}
          camera={{
            // En celular la cámara se aleja para que el equipo quepa en la pantalla vertical
            position: mobile ? [camera[0] * 1.45, camera[1] * 1.3, camera[2] * 1.45] : camera,
            fov: 42,
            near: 0.1,
            far: 200,
          }}
          gl={{ antialias: true, localClippingEnabled: true }}
          onCreated={() => setReady(true)}
        >
          <color attach="background" args={["#0a1426"]} />
          <fog attach="fog" args={["#0a1426", 18, 45]} />
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[6, 10, 5]}
            intensity={1.6}
            castShadow={!mobile}
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-6, 4, -4]} intensity={0.5} color="#7dd3fc" />
          <Environment resolution={128} frames={1}>
            <Lightformer intensity={2} position={[0, 5, -6]} scale={[10, 3, 1]} />
            <Lightformer intensity={1} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
            <Lightformer intensity={0.8} color="#22d3ee" position={[6, 1, 2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
          </Environment>
          <Suspense fallback={null}>{children}</Suspense>
          <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]} receiveShadow>
            <circleGeometry args={[14, 64]} />
            <meshStandardMaterial color="#0f1e36" roughness={0.95} />
          </mesh>
          <gridHelper args={[28, 28, "#1f3760", "#132a4a"]} position={[0, 0.002, 0]} />
          <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={14} blur={2.4} far={4} frames={1} />
          <OrbitControls
            ref={controls}
            target={target}
            enableDamping
            minDistance={3}
            maxDistance={18}
            maxPolarAngle={Math.PI / 2.05}
            makeDefault
          />
        </Canvas>
      </div>
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          Preparando escena 3D…
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto">{overlay}</div>
        <button
          type="button"
          onClick={() => controls.current?.reset()}
          className="pointer-events-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-navy-950/80 px-2.5 text-xs text-slate-300 hover:bg-navy-800"
          title="Recolocar la cámara"
        >
          <Crosshair size={14} /> Vista inicial
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-slate-500">
        Arrastre para girar · rueda o pellizco para acercar
      </div>
    </SceneErrorBoundary>
  );
}
