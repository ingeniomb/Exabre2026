"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { AlertTriangle, Droplets, Power, PowerOff, Route, Sparkles, Wrench } from "lucide-react";
import { ProjectShell } from "@/components/layout/ProjectShell";
import { Badge, Button, RunControls, Section, StatTile, Tabs } from "@/components/ui/controls";
import { MultiSeriesChart, TimeSeriesChart } from "@/components/charts/Charts";
import { useSimulationLoop } from "@/lib/useSimulationLoop";
import { useRecirculacion } from "./store";
import { estadoFiltro, PARAMS, VALVULAS, type ValvulaId } from "./simulation";
import { contenidoRecirculacion } from "./content";

const RecirculacionScene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">Cargando escena 3D…</div>,
});

const RUTA = [
  "Agua nueva entra a la aspersión",
  "El agua utilizada sale de la peladora",
  "El tamiz separa plumas y sólidos",
  "El agua llega al depósito",
  "La bomba la impulsa al tratamiento",
  "Sedimentación de partículas",
  "Filtración y desinfección",
  "Retorno controlado a la peladora",
];

export default function RecirculacionView() {
  const st = useRecirculacion();
  const corriendo = st.status === "ejecutando";
  useSimulationLoop(corriendo, st.step, st.sample, { fixedDt: 1 / 60 });
  useEffect(() => () => useRecirculacion.getState().pause(), []);

  const filtro = estadoFiltro(st.colmatacion);
  const estadoBomba = !st.bombaOrden
    ? { t: "Apagada", tono: "neutral" as const }
    : st.bombaProteccion
      ? { t: "Protección: nivel bajo", tono: "warn" as const }
      : st.qBomba > 0
        ? { t: "En marcha", tono: "ok" as const }
        : { t: "Sin caudal (válvula cerrada)", tono: "bad" as const };

  const alertas: string[] = [];
  if (!st.valvulas.v1 && st.peladora) alertas.push("V1 cerrada: el agua no sale de la peladora (riesgo de rebose).");
  if (st.bombaOrden && (!st.valvulas.v2 || !st.valvulas.v3)) alertas.push("Bomba encendida con V2 o V3 cerrada: no hay caudal.");
  if (st.bombaProteccion && st.bombaOrden) alertas.push("Bomba detenida por nivel bajo del depósito (protección contra funcionamiento en seco).");
  if (st.colmatacion >= 0.65) alertas.push("Filtro colmatado: active la vista de mantenimiento y límpielo.");
  if (st.qRebose > 0.5) alertas.push("Depósito lleno: el exceso se descarga por rebose al drenaje.");
  if (!st.valvulas.v0 && st.qAspersion < PARAMS.demanda - 1 && st.peladora) alertas.push("V0 cerrada: la peladora no recibe toda el agua que necesita.");

  return (
    <ProjectShell
      id="recirculacion"
      onToggleRun={st.toggle}
      onReset={st.reset}
      scene={<RecirculacionScene />}
      side={
        <>
          <Section title="Control">
            <RunControls status={st.status} onStart={st.start} onPause={st.pause} onReset={st.reset} onDefaults={st.defaults} />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button tone="ok" onClick={() => st.bomba(true)} disabled={st.bombaOrden}>
                <Power size={16} /> Activar bomba
              </Button>
              <Button tone="bad" onClick={() => st.bomba(false)} disabled={!st.bombaOrden}>
                <PowerOff size={16} /> Detener bomba
              </Button>
              <Button active={st.ruta} tone={st.ruta ? "accent" : "neutral"} onClick={() => st.setRuta(!st.ruta)}>
                <Route size={16} /> Ruta de circulación
              </Button>
              <Button active={st.mantenimiento} tone={st.mantenimiento ? "accent" : "neutral"} onClick={() => st.setMantenimiento(!st.mantenimiento)}>
                <Wrench size={16} /> Vista de mantenimiento
              </Button>
            </div>
            {st.mantenimiento ? (
              <div className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">
                <div className="mb-2 text-slate-200">
                  Filtro de cartucho: colmatación <b>{(st.colmatacion * 100).toFixed(0)} %</b>
                </div>
                <Button tone="accent" onClick={st.limpiarFiltro} className="w-full">
                  <Sparkles size={16} /> Limpiar filtro
                </Button>
              </div>
            ) : null}
            <div className="mt-4">
              <div className="mb-1.5 text-sm text-slate-300">Válvulas (también puede hacer clic sobre ellas en la escena)</div>
              <div className="grid gap-2">
                {(Object.keys(VALVULAS) as ValvulaId[]).map((v) => (
                  <Button key={v} tone={st.valvulas[v] ? "ok" : "bad"} onClick={() => st.toggleValvula(v)} className="justify-between">
                    <span className="flex-1 text-left">
                      {VALVULAS[v].nombre}
                      <span className="block text-[11px] font-normal opacity-70">{VALVULAS[v].funcion}</span>
                    </span>
                    <span className="text-xs font-semibold">{st.valvulas[v] ? "ABIERTA" : "CERRADA"}</span>
                  </Button>
                ))}
                <Button tone={st.peladora ? "accent" : "neutral"} onClick={st.togglePeladora} className="justify-between">
                  <span className="flex-1 text-left">Peladora en operación</span>
                  <span className="text-xs font-semibold">{st.peladora ? "SÍ" : "NO"}</span>
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Indicadores">
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Caudal de la bomba" value={st.qBomba.toFixed(1)} unit="L/min" />
              <StatTile label="Agua nueva" value={st.qNueva.toFixed(1)} unit="L/min" tone="neutral" />
              <StatTile label="Nivel del depósito" value={st.nivelPct.toFixed(0)} unit="%" tone={st.nivelPct < 20 ? "warn" : "accent"} hint={`Capacidad ${PARAMS.volumenDeposito} L`} />
              <StatTile label="Recuperación de agua" value={st.recuperacion.toFixed(0)} unit="%" tone="ok" hint="Porcentaje ilustrativo" />
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estado de la bomba</span>
                <Badge tone={estadoBomba.tono}>{estadoBomba.t}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Estado del filtro</span>
                <Badge tone={filtro.tono}>
                  {filtro.texto} · {(st.colmatacion * 100).toFixed(0)} %
                </Badge>
              </div>
            </div>
            {alertas.length ? (
              <ul className="mt-3 space-y-1.5">
                {alertas.map((a) => (
                  <li key={a} className="flex gap-2 rounded-md border border-warn/40 bg-warn/10 p-2 text-xs text-yellow-100">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {a}
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>
        </>
      }
      bottom={
        <>
          <div className="flex gap-3 rounded-xl border-2 border-heat/50 bg-heat/10 p-4 text-sm text-orange-100">
            <AlertTriangle className="mt-0.5 shrink-0 text-heat" size={20} />
            <p>
              <b>Advertencia académica:</b> la reutilización de agua en el procesamiento avícola requiere tratamiento adecuado,
              validación sanitaria y cumplimiento de la normativa aplicable. Esta simulación es conceptual y no certifica que el
              agua sea apta para volver a entrar en contacto con el producto. La filtración por sí sola no elimina
              microorganismos ni garantiza potabilidad.
            </p>
          </div>

          <section className="panel p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">Ruta del agua</h3>
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {RUTA.map((r, i) => (
                <li
                  key={r}
                  className="rounded-lg border border-accent/20 bg-navy-950/60 p-2.5 text-xs text-slate-300"
                  style={st.ruta ? { animation: `pasoRuta ${RUTA.length * 1.1}s ${i * 1.1}s infinite` } : undefined}
                >
                  <div className="text-[11px] text-accent">{i + 1}</div>
                  {r}
                </li>
              ))}
            </ol>
            <style>{`@keyframes pasoRuta{0%,100%{border-color:rgba(34,211,238,.2);box-shadow:none}2%,11%{border-color:rgba(34,211,238,.95);box-shadow:0 0 16px rgba(34,211,238,.35)}}`}</style>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <Section title="Caudales" right={<Droplets size={16} className="text-accent" />}>
              <MultiSeriesChart
                data={st.historial}
                xKey="min"
                xUnit="min"
                xDecimals={1}
                unit="L/min"
                yDomain={[0, 60]}
                series={[
                  { key: "qBomba", name: "Bomba (recirculada)", color: "#22d3ee" },
                  { key: "qNueva", name: "Agua nueva", color: "#f97316", dashed: true },
                ]}
                height={200}
              />
            </Section>
            <Section title="Nivel del depósito">
              <TimeSeriesChart
                data={st.historial}
                xKey="min"
                yKey="nivel"
                name="Nivel"
                unit="%"
                xUnit="min"
                xDecimals={1}
                yDomain={[0, 100]}
                refs={[{ value: PARAMS.nivelParo, label: "Paro por nivel bajo", color: "#ef4444" }]}
              />
            </Section>
            <Section title="Colmatación del filtro">
              <TimeSeriesChart
                data={st.historial}
                xKey="min"
                yKey="colmatacion"
                name="Colmatación"
                unit="%"
                xUnit="min"
                xDecimals={1}
                color="#f97316"
                yDomain={[0, 100]}
                refs={[{ value: 65, label: "Limpieza", color: "#ef4444" }]}
              />
            </Section>
          </div>
          <p className="text-xs text-slate-500">Tiempo acelerado ×{PARAMS.escala}. Los caudales y volúmenes son valores de referencia para la simulación.</p>
          <Tabs tabs={contenidoRecirculacion} />
        </>
      }
    />
  );
}
