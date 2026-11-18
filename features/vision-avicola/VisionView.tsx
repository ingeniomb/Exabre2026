"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { AlertTriangle, Camera, Eye, Cpu, Stethoscope, Trash2, ScanSearch } from "lucide-react";
import { ProjectShell } from "@/components/layout/ProjectShell";
import { Button, RunControls, Section, Tabs } from "@/components/ui/controls";
import { useSimulationLoop } from "@/lib/useSimulationLoop";
import { ETAPAS_VISION, useVision } from "./store";
import { IlustracionMuestra, MUESTRAS } from "./muestras";
import { clasificadorDemostrativo } from "./classifier";
import { contenidoVision } from "./content";

const VisionScene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">Cargando escena 3D…</div>,
});

export default function VisionView() {
  const st = useVision();
  const corriendo = st.status === "ejecutando";
  useSimulationLoop(corriendo, st.step, st.sample, { fixedDt: 1 / 60, sampleHz: 15 });
  useEffect(() => () => useVision.getState().pause(), []);

  const m = MUESTRAS.find((x) => x.id === st.seleccion)!;
  const enAnalisis = st.etapa >= 1 && st.etapa <= 6;
  const mostrarResultado = st.resultado && st.etapa >= 5;

  return (
    <ProjectShell
      id="vision-avicola"
      onToggleRun={st.toggle}
      onReset={st.reset}
      scene={<VisionScene />}
      side={
        <>
          <Section title="Galería de ejemplos" right={<span className="text-[11px] text-slate-500">Ilustraciones, no fotografías</span>}>
            <div className="grid grid-cols-3 gap-2">
              {MUESTRAS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  disabled={corriendo}
                  onClick={() => st.seleccionar(x.id)}
                  className={`overflow-hidden rounded-lg border-2 transition disabled:cursor-not-allowed ${
                    st.seleccion === x.id ? "border-accent" : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  title={x.nombre}
                >
                  <IlustracionMuestra m={x} className="block aspect-square w-full" />
                  <div className="bg-navy-950/80 py-1 text-center text-[11px] text-slate-300">{x.nombre}</div>
                </button>
              ))}
            </div>
            <Button tone="accent" onClick={st.start} disabled={corriendo} className="mt-3 w-full text-base">
              <ScanSearch size={18} /> Analizar muestra
            </Button>
          </Section>

          <Section title="Control">
            <RunControls status={st.status} onStart={st.start} onPause={st.pause} onReset={st.reset} onDefaults={st.defaults} />
          </Section>

          <Section title="Secuencia de análisis">
            <ol className="space-y-1.5">
              {ETAPAS_VISION.map((e) => {
                const hecho = st.etapa > e.id || (st.etapa === 7 && e.id !== 6) || (st.etapa === 7 && e.id === 6 && st.resultado?.alerta);
                const activo = st.etapa === e.id;
                const omitido = e.id === 6 && st.etapa === 7 && !st.resultado?.alerta;
                return (
                  <li key={e.id} className={`rounded-md border px-3 py-1.5 text-sm ${activo ? "border-accent/70 bg-accent/10 text-slate-100" : "border-white/5 text-slate-400"}`}>
                    <div className="flex items-center justify-between">
                      <span>
                        <span className="mr-2 text-accent">{e.id}.</span>
                        {e.nombre}
                      </span>
                      <span className="text-xs">{activo ? "…" : omitido ? "No requerida" : hecho ? "✓" : ""}</span>
                    </div>
                    {activo ? (
                      <div className="mt-1 h-1 overflow-hidden rounded bg-navy-700">
                        <div className="h-full bg-accent" style={{ width: `${st.progreso * 100}%` }} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </Section>
        </>
      }
      bottom={
        <>
          <div className="flex gap-3 rounded-xl border-2 border-heat/50 bg-heat/10 p-4 text-sm text-orange-100">
            <Stethoscope className="mt-0.5 shrink-0 text-heat" size={20} />
            <p>
              El análisis de imágenes es una <b>herramienta de apoyo</b>, no un diagnóstico veterinario. Las imágenes son
              ilustraciones de ejemplo, y la categoría y la confianza mostradas son <b>simuladas</b>: esta versión no contiene un
              modelo entrenado.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Captura y preprocesamiento" right={<Camera size={16} className="text-accent" />}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { t: "1. Imagen capturada", f: undefined, desde: 2, extra: "" },
                  { t: "2. Recorte (ROI)", f: undefined, desde: 3, extra: "scale-[1.35]" },
                  { t: "3. Escala de grises 224×224", f: "grayscale(1)", desde: 3, extra: "scale-[1.35]" },
                  { t: "4. Normalización y realce", f: "grayscale(1) contrast(1.8) brightness(1.1)", desde: 3, extra: "scale-[1.35]" },
                ].map((p, i) => {
                  const visible = st.etapa > p.desde || (st.etapa === p.desde && (p.desde !== 3 || st.progreso > i * 0.25)) || st.etapa === 7;
                  return (
                    <figure key={p.t} className="text-center">
                      <div className="relative aspect-square overflow-hidden rounded-md border border-white/10 bg-navy-950">
                        {visible ? (
                          <>
                            <div className={`h-full w-full ${p.extra}`}>
                              <IlustracionMuestra m={m} className="h-full w-full" filtro={p.f} />
                            </div>
                            {i >= 2 ? (
                              <div
                                className="pointer-events-none absolute inset-0"
                                style={{
                                  backgroundImage:
                                    "linear-gradient(rgba(34,211,238,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.25) 1px, transparent 1px)",
                                  backgroundSize: "14px 14px",
                                }}
                              />
                            ) : null}
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center text-[11px] text-slate-600">—</div>
                        )}
                      </div>
                      <figcaption className="mt-1 text-[11px] text-slate-400">{p.t}</figcaption>
                    </figure>
                  );
                })}
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-400">
                  <Cpu size={14} /> Red de clasificación (representación esquemática)
                </div>
                <div className="flex h-20 items-end gap-1.5">
                  {Array.from({ length: 12 }, (_, i) => {
                    const on = st.etapa > 4 || (st.etapa === 4 && st.progreso * 12 > i);
                    const h = [90, 80, 72, 64, 56, 48, 40, 34, 28, 22, 18, 14][i];
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-colors duration-200"
                        style={{ height: `${h}%`, background: on ? "#22d3ee" : "#16294a", boxShadow: on && st.etapa === 4 ? "0 0 10px rgba(34,211,238,.6)" : undefined }}
                      />
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                  <span>Entrada 224×224</span>
                  <span>Capas de características</span>
                  <span>Salida</span>
                </div>
              </div>
            </Section>

            <Section title="Resultado" right={<span className="text-[11px] text-slate-500">{clasificadorDemostrativo.nombre}</span>}>
              <div className="space-y-3">
                <Nivel icono={<Eye size={16} />} titulo="1. Observación visual" color="border-sky-500/40">
                  {st.etapa >= 2 || st.etapa === 7 ? m.observacion : <span className="text-slate-500">Pendiente de captura.</span>}
                </Nivel>
                <Nivel icono={<Cpu size={16} />} titulo="2. Clasificación algorítmica (simulada)" color="border-accent/50">
                  {mostrarResultado ? (
                    <div>
                      <div className="text-base font-semibold text-slate-100">{st.resultado!.categoria}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-700">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${st.resultado!.confianza * 100}%` }} />
                        </div>
                        <span className="tabular text-slate-300">{(st.resultado!.confianza * 100).toFixed(0)} %</span>
                      </div>
                      <div className="mt-1 text-[11px] text-orange-200">Confianza ficticia, generada para la demostración.</div>
                      <p className="mt-2 text-xs text-slate-400">{m.nota}</p>
                    </div>
                  ) : (
                    <span className="text-slate-500">{enAnalisis ? "Procesando…" : "Seleccione un ejemplo y pulse «Analizar muestra»."}</span>
                  )}
                </Nivel>
                <Nivel icono={<Stethoscope size={16} />} titulo="3. Diagnóstico veterinario" color="border-heat/50">
                  <span className="text-orange-100">No lo emite este sistema. Consulte a un médico veterinario.</span>
                </Nivel>
                {mostrarResultado && st.resultado!.alerta && st.etapa >= 6 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-bad/60 bg-bad/15 p-3 text-sm text-red-200">
                    <AlertTriangle size={18} /> Alerta generada: se recomienda revisión por parte de un profesional veterinario.
                  </div>
                ) : null}
              </div>
            </Section>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Section
              title="Historial demostrativo"
              right={
                <Button onClick={st.borrarHistorial} disabled={!st.historial.length} className="min-h-8 px-2 py-1 text-xs">
                  <Trash2 size={14} /> Borrar
                </Button>
              }
            >
              {st.historial.length === 0 ? (
                <p className="text-sm text-slate-500">Aún no hay muestras analizadas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="py-1 pr-2">#</th>
                        <th className="py-1 pr-2">Hora</th>
                        <th className="py-1 pr-2">Muestra</th>
                        <th className="py-1 pr-2">Categoría</th>
                        <th className="py-1 pr-2 text-right">Conf. simulada</th>
                        <th className="py-1">Alerta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {st.historial.map((h) => {
                        const mm = MUESTRAS.find((x) => x.id === h.muestraId)!;
                        return (
                          <tr key={h.n} className="border-t border-white/5">
                            <td className="py-1.5 pr-2 text-slate-500">{h.n}</td>
                            <td className="tabular py-1.5 pr-2 text-slate-400">{h.hora}</td>
                            <td className="py-1.5 pr-2">
                              <div className="flex items-center gap-2">
                                <IlustracionMuestra m={mm} className="h-7 w-7 rounded" />
                                <span className="text-slate-300">{mm.nombre}</span>
                              </div>
                            </td>
                            <td className="py-1.5 pr-2 text-slate-200">{h.categoria}</td>
                            <td className="tabular py-1.5 pr-2 text-right text-slate-300">{(h.confianza * 100).toFixed(0)} %</td>
                            <td className="py-1.5">{h.alerta ? <span className="text-red-300">Sí</span> : <span className="text-slate-500">No</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
            <Tabs tabs={contenidoVision} />
          </div>
        </>
      }
    />
  );
}

function Nivel({ icono, titulo, color, children }: { icono: React.ReactNode; titulo: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border-l-4 bg-navy-950/60 p-3 ${color}`}>
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icono} {titulo}
      </div>
      <div className="text-sm text-slate-300">{children}</div>
    </div>
  );
}
