"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Home,
  Keyboard,
  Shrink,
  Tag,
  Type,
} from "lucide-react";
import { proyectos, type ProyectoId } from "@/content/proyectos";
import { useUi } from "@/lib/uiStore";
import { SimBadge } from "@/components/ui/controls";

function useFullscreen() {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const h = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, []);
  return { isFs, toggle };
}

export function ProjectShell({
  id,
  onToggleRun,
  onReset,
  scene,
  side,
  bottom,
}: {
  id: ProyectoId;
  onToggleRun: () => void;
  onReset: () => void;
  scene: ReactNode;
  side: ReactNode;
  bottom: ReactNode;
}) {
  const router = useRouter();
  const { isFs, toggle } = useFullscreen();
  const { etiquetas, toggleEtiquetas, textoGrande, toggleTextoGrande, ayuda, setAyuda } = useUi();
  const idx = proyectos.findIndex((p) => p.id === id);
  const info = proyectos[idx];
  const prev = proyectos[(idx + proyectos.length - 1) % proyectos.length];
  const next = proyectos[(idx + 1) % proyectos.length];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        if (!(t instanceof HTMLInputElement && t.type === "range")) return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === " ") {
        e.preventDefault();
        onToggleRun();
      } else if (k === "r") onReset();
      else if (k === "f") toggle();
      else if (k === "l") toggleEtiquetas();
      else if (k === "?") setAyuda(!useUi.getState().ayuda);
      else if (k === "escape") setAyuda(false);
      else if (["1", "2", "3", "4"].includes(k)) router.push(proyectos[Number(k) - 1].ruta);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onToggleRun, onReset, toggle, toggleEtiquetas, setAyuda, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-3 py-2 sm:px-5">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm text-slate-300 hover:bg-white/5"
            title="Volver al inicio"
          >
            <Home size={18} /> <span className="hidden sm:inline">Inicio</span>
          </Link>
          <div className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-widest text-accent">
              Proyecto {info.numero} de {proyectos.length}
            </div>
            <h1 className="truncate text-base font-semibold sm:text-lg">{info.titulo}</h1>
          </div>
          <SimBadge />
          <div className="flex items-center gap-1">
            <IconBtn title={`Anterior: ${prev.titulo}`} onClick={() => router.push(prev.ruta)}>
              <ChevronLeft size={18} />
            </IconBtn>
            <IconBtn title={`Siguiente: ${next.titulo}`} onClick={() => router.push(next.ruta)}>
              <ChevronRight size={18} />
            </IconBtn>
            <IconBtn title="Mostrar u ocultar etiquetas (L)" onClick={toggleEtiquetas} active={etiquetas}>
              <Tag size={18} />
            </IconBtn>
            <IconBtn title="Texto ampliado para proyector" onClick={toggleTextoGrande} active={textoGrande}>
              <Type size={18} />
            </IconBtn>
            <IconBtn title="Atajos de teclado (?)" onClick={() => setAyuda(!ayuda)}>
              <Keyboard size={18} />
            </IconBtn>
            <IconBtn title="Pantalla completa (F)" onClick={toggle}>
              {isFs ? <Shrink size={18} /> : <Expand size={18} />}
            </IconBtn>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-4 px-3 py-4 sm:px-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="panel relative h-[58vh] min-h-[340px] overflow-hidden lg:h-[calc(100vh-150px)] lg:max-h-[760px]">
            {scene}
          </div>
          <aside className="space-y-4">{side}</aside>
        </div>
        {bottom}
      </main>

      {ayuda ? <HelpOverlay onClose={() => setAyuda(false)} /> : null}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition ${
        active
          ? "border-accent/50 bg-accent/15 text-accent"
          : "border-white/10 text-slate-300 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["Espacio", "Iniciar o pausar"],
    ["R", "Reiniciar el proceso"],
    ["F", "Pantalla completa"],
    ["L", "Mostrar u ocultar etiquetas"],
    ["1 – 4", "Ir al proyecto"],
    ["?", "Mostrar esta ayuda"],
    ["Esc", "Cerrar"],
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div className="panel w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">Atajos de teclado</h2>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, d]) => (
              <tr key={k} className="border-t border-white/5">
                <td className="py-2 pr-3">
                  <kbd className="rounded border border-white/20 bg-navy-950 px-2 py-0.5 font-mono text-accent">
                    {k}
                  </kbd>
                </td>
                <td className="py-2 text-slate-300">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={onClose}
          className="mt-4 min-h-10 w-full rounded-lg border border-white/10 text-sm hover:bg-white/5"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
