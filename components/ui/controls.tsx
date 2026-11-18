"use client";

import { useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, SlidersHorizontal } from "lucide-react";

type Tone = "accent" | "neutral" | "heat" | "ok" | "warn" | "bad";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent/15 text-accent border-accent/50 hover:bg-accent/25",
  neutral: "bg-navy-700/70 text-slate-200 border-white/10 hover:bg-navy-600",
  heat: "bg-heat/15 text-orange-300 border-heat/50 hover:bg-heat/25",
  ok: "bg-ok/15 text-green-300 border-ok/50 hover:bg-ok/25",
  warn: "bg-warn/15 text-yellow-200 border-warn/50 hover:bg-warn/25",
  bad: "bg-bad/15 text-red-300 border-bad/50 hover:bg-bad/25",
};

export function Button({
  children,
  onClick,
  tone = "neutral",
  active = false,
  disabled = false,
  title,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: Tone;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClasses[tone]} ${
        active ? "ring-2 ring-accent/70" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  disabled,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
  format?: (v: number) => string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="tabular font-semibold text-accent">
          {format ? format(value) : value}
          {unit ? <span className="ml-1 text-xs font-normal text-slate-400">{unit}</span> : null}
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function StatTile({
  label,
  value,
  unit,
  tone = "accent",
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: Tone;
  hint?: string;
}) {
  const color: Record<Tone, string> = {
    accent: "text-accent",
    neutral: "text-slate-100",
    heat: "text-orange-300",
    ok: "text-green-300",
    warn: "text-yellow-200",
    bad: "text-red-300",
  };
  return (
    <div className="rounded-lg border border-white/8 bg-navy-950/60 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`tabular text-xl font-semibold ${color[tone]}`}>
        {value}
        {unit ? <span className="ml-1 text-xs font-normal text-slate-400">{unit}</span> : null}
      </div>
      {hint ? <div className="text-[11px] text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function Badge({ children, tone = "accent" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function SimBadge() {
  return (
    <Badge tone="heat">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-heat" /> SIMULACIÓN
    </Badge>
  );
}

export function Section({
  title,
  children,
  right,
  className = "",
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export type SimStatus = "detenido" | "ejecutando" | "pausado";

export function RunControls({
  status,
  onStart,
  onPause,
  onReset,
  onDefaults,
}: {
  status: SimStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onDefaults: () => void;
}) {
  const statusText: Record<SimStatus, string> = {
    detenido: "Detenido",
    ejecutando: "En ejecución",
    pausado: "En pausa",
  };
  const statusTone: Record<SimStatus, Tone> = {
    detenido: "neutral",
    ejecutando: "ok",
    pausado: "warn",
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">Estado de la simulación</span>
        <Badge tone={statusTone[status]}>{statusText[status]}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button tone="ok" onClick={onStart} disabled={status === "ejecutando"} title="Iniciar (Espacio)">
          <Play size={16} /> Iniciar
        </Button>
        <Button tone="warn" onClick={onPause} disabled={status !== "ejecutando"} title="Pausar (Espacio)">
          <Pause size={16} /> Pausar
        </Button>
        <Button onClick={onReset} title="Volver el proceso a t = 0 (R)">
          <RotateCcw size={16} /> Reiniciar
        </Button>
        <Button onClick={onDefaults} title="Devolver los controles a sus valores por defecto">
          <SlidersHorizontal size={16} /> Restablecer valores
        </Button>
      </div>
    </div>
  );
}

export function Tabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div className="panel">
      <div className="flex flex-wrap gap-1 border-b border-white/10 p-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === current.id}
            onClick={() => setActive(t.id)}
            className={`min-h-10 rounded-md px-3 text-sm transition ${
              t.id === current.id
                ? "bg-accent/15 text-accent"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4 text-sm leading-relaxed text-slate-300">{current.content}</div>
    </div>
  );
}
