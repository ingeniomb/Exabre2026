"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Box, Eye, Flame, Timer } from "lucide-react";
import { ProjectShell } from "@/components/layout/ProjectShell";
import { Button, RunControls, Section, Slider, StatTile, Tabs } from "@/components/ui/controls";
import { MultiSeriesChart } from "@/components/charts/Charts";
import { useSimulationLoop } from "@/lib/useSimulationLoop";
import { useTostadora } from "./store";
import { colorGrano, EQUIPO, ETAPAS, etapaDe, factorMezcla, nivelTueste, objetivoTambor } from "./simulation";
import { contenidoTostadora } from "./content";

const TostadoraScene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">Cargando escena 3D…</div>,
});

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const rgb = ([r, g, b]: [number, number, number]) => `rgb(${(r * 255) | 0}, ${(g * 255) | 0}, ${(b * 255) | 0})`;

export default function TostadoraView() {
  const st = useTostadora();
  const corriendo = st.status === "ejecutando";
  useSimulationLoop(corriendo, st.step, st.sample, { fixedDt: 1 / 60 });
  useEffect(() => () => useTostadora.getState().pause(), []);

  const etapa = etapaDe(st.tGrano, st.fase);
  const mezcla = factorMezcla(st.params.rpm);
  const nc = EQUIPO.rpmCritica;
  const enProceso = st.fase === "tostando";
  const restante = Math.max(0, st.params.tiempoObjetivo * 60 - st.t);
  const insuficiente = objetivoTambor(st.params.intensidad) < 200;

  return (
    <ProjectShell
      id="tostadora"
      onToggleRun={st.toggle}
      onReset={st.reset}
      scene={<TostadoraScene />}
      side={
        <>
          <Section title="Control del proceso">
            <RunControls status={st.status} onStart={st.start} onPause={st.pause} onReset={st.reset} onDefaults={st.defaults} />
            {st.fase === "listo" ? (
              <p className="mt-2 text-xs text-slate-400">«Iniciar» carga el grano verde en el tambor precalentado y comienza la tostión.</p>
            ) : null}
            <div className="mt-4 space-y-4">
              <Slider label="Velocidad del tambor" value={st.params.rpm} min={20} max={90} unit="RPM" onChange={(v) => st.setParam("rpm", v)} />
              <div className="-mt-2 text-[11px] text-slate-400">
                Velocidad crítica ≈ {nc.toFixed(0)} RPM. Mezcla: {(mezcla * 100).toFixed(0)} %
                {st.params.rpm >= nc ? <span className="ml-1 text-orange-300">· los granos se centrifugan y no se mezclan</span> : null}
              </div>
              <Slider
                label="Intensidad del calentamiento"
                value={st.params.intensidad}
                min={0}
                max={100}
                unit="%"
                onChange={(v) => st.setParam("intensidad", v)}
              />
              {insuficiente ? <div className="-mt-2 text-[11px] text-orange-300">Calor insuficiente para llegar al primer crack.</div> : null}
              <Slider
                label="Tiempo de tostado"
                value={st.params.tiempoObjetivo}
                min={8}
                max={20}
                unit="min"
                onChange={(v) => st.setParam("tiempoObjetivo", v)}
                disabled={st.fase === "enfriando" || st.fase === "terminado"}
              />
              <div>
                <div className="mb-1.5 text-sm text-slate-300">Aceleración del tiempo</div>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 30, 60].map((e) => (
                    <Button key={e} active={st.params.escala === e} tone={st.params.escala === e ? "accent" : "neutral"} onClick={() => st.setParam("escala", e)}>
                      ×{e}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-sm text-slate-300">Vista</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button active={st.vista === "exterior"} tone={st.vista === "exterior" ? "accent" : "neutral"} onClick={() => st.setVista("exterior")}>
                    <Box size={16} /> Exterior
                  </Button>
                  <Button active={st.vista === "corte"} tone={st.vista === "corte" ? "accent" : "neutral"} onClick={() => st.setVista("corte")}>
                    <Eye size={16} /> Corte
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Indicadores">
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Tiempo simulado" value={mmss(st.t)} unit="min" hint={enProceso ? `Faltan ${mmss(restante)}` : `Escala ×${st.params.escala}`} />
              <StatTile label="Temp. del grano" value={st.tGrano.toFixed(0)} unit="°C" tone="heat" hint={`Máx.: ${st.tMax.toFixed(0)} °C`} />
              <StatTile label="Temp. del tambor" value={st.tTambor.toFixed(0)} unit="°C" tone="neutral" />
              <StatTile label="Tasa de aumento" value={enProceso ? st.ror.toFixed(1) : "—"} unit="°C/min" hint="RoR del grano" />
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/8 bg-navy-950/60 p-3">
              <span className="h-10 w-10 shrink-0 rounded-full border border-white/20" style={{ background: rgb(colorGrano(st.tMax)) }} />
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Etapa actual</div>
                <div className="font-semibold" style={{ color: "#fdba74" }}>
                  {etapa.nombre}
                </div>
                <div className="text-xs text-slate-400">{etapa.descripcion}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-300">
              Nivel de tueste: <span className="font-semibold text-slate-100">{st.fase === "listo" ? "—" : nivelTueste(st.tMax)}</span>
              {st.dispersion > 0.35 && st.fase !== "listo" ? <span className="ml-1 text-xs text-orange-300">(tueste disparejo por mala mezcla)</span> : null}
            </div>
          </Section>
        </>
      }
      bottom={
        <>
          <section className="panel p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Etapas de la tostión (por temperatura del grano)</h3>
            <div className="flex overflow-hidden rounded-lg border border-white/10">
              {ETAPAS.slice(1, 6).map((e) => {
                const activa = etapa.id === e.id;
                return (
                  <div
                    key={e.id}
                    className={`flex-1 px-2 py-2 text-center text-xs transition ${activa ? "text-white" : "text-slate-400"}`}
                    style={{ background: activa ? e.color : `${e.color}33`, boxShadow: activa ? "inset 0 0 0 2px #fdba74" : undefined }}
                  >
                    <div className="font-semibold">{e.nombre}</div>
                    <div className="tabular opacity-80">
                      {e.desde}–{e.hasta} °C
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Rangos de temperatura aproximados y orientativos; dependen del grano, el equipo y la sonda.</p>
          </section>
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <Section title="Curva temperatura–tiempo" right={<Flame size={16} className="text-orange-300" />}>
              <MultiSeriesChart
                data={st.historial}
                xKey="min"
                xUnit="min"
                xDecimals={1}
                unit="°C"
                yDomain={[0, 320]}
                series={[
                  { key: "grano", name: "Grano", color: "#f97316" },
                  { key: "tambor", name: "Tambor", color: "#94a3b8", dashed: true },
                ]}
                bandas={[
                  { y1: 100, y2: 150, label: "Secado", color: "#65a30d" },
                  { y1: 150, y2: 165, label: "", color: "#ca8a04" },
                  { y1: 165, y2: 196, label: "Maillard", color: "#b45309" },
                ]}
                refs={[{ value: 196, label: "Primer crack ≈ 196 °C", color: "#ef4444" }]}
                height={260}
              />
              <p className="mt-2 rounded-md border border-heat/30 bg-heat/10 p-2 text-[11px] text-orange-200">
                Curva ilustrativa generada por un modelo simplificado; no sustituye un perfil de tostión real medido.
              </p>
            </Section>
            <Tabs tabs={contenidoTostadora} />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Timer size={14} /> El tiempo del proceso está acelerado ×{st.params.escala} para la exposición.
          </div>
        </>
      }
    />
  );
}
