"use client";

import { Html } from "@react-three/drei";
import { useUi } from "@/lib/uiStore";

export function Label3D({
  position,
  title,
  subtitle,
}: {
  position: [number, number, number];
  title: string;
  subtitle?: string;
}) {
  const visible = useUi((s) => s.etiquetas);
  if (!visible) return null;
  return (
    <Html position={position} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className="label3d">
        {title}
        {subtitle ? <small>{subtitle}</small> : null}
      </div>
    </Html>
  );
}
