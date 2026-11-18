"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Activity, AlertTriangle, Flame, Gauge, Thermometer, Zap } from "lucide-react";
import { ProjectShell } from "@/components/layout/ProjectShell";
import { Button, RunControls, Section, Slider, StatTile, Tabs } from "@/components/ui/controls";
import { SpectrumChart, TimeSeriesChart } from "@/components/charts/Charts";
import { useSimulationLoop } from "@/lib/useSimulationLoop";
import { useMotor } from "./store";
import { PLACA, type Escenario } from "./simulation";
import { clasificadorDemostrativo, type Clase } from "./classifier";
import { contenidoMotor } from "./content";

const MotorScene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">Cargando escena 3D…</div>
  ),
});

const escenarios: { id: Escenario; label: string; icon: React.ReactNode; tone: "ok" | "warn" | "heat" }[] = [
  { id: "normal", label: "Funcionamiento normal", icon: <Activity size={16} />, tone: "ok" },
  { id: "vibracion", label: "Vibración anormal", icon: <AlertTriangle size={16} />, tone: "warn" },
  { id: "sobrecarga", label: "Sobrecalentamiento / sobrecorriente", icon: <Flame size={16} />, tone: "heat" },
];

const tonoClase: Record<Clase, "ok" | "warn" | "bad" | "neutral"> = {
  Normal: "ok",
  Advertencia: "warn",
  Anomalía: "bad",
  "Motor detenido": "neutral",
};

export default function MotorView() {
  const st = useMotor();
  const corriendo = st.status === "ejecutando";
  useSimulationLoop(corriendo, st.step, st.sample);

  // Al salir del proyecto se pausa la simulación
  useEffect(() => () => useMotor.getState().pause(), []);

  const f1 = st.rpm / 60;
  const tempTone = st.temperatura > PLACA.tAlarma ? "bad" : st.temperatura > 75 ? "warn" : "heat";
  const iTone = st.corriente > PLACA.corrienteNominal ? "bad" : "accent";
  const pred = st.prediccion;

  return (
    <ProjectShell
      id="motor"
      onToggleRun={st.toggle}
      onReset={st.reset}
      scene={<MotorScene />}
      side={
        <>
          <Section title="Control">
            <RunControls
              status={st.status}
              onStart={st.start}
              onPause={st.pause}
              onReset={st.reset}
              onDefaults={st.defaults}
            />
            <div className="mt-4 space-y-4">
              <Slider
                label="Velocidad de referencia (variador)"
                value={st.params.rpmObjetivo}
                min={0}
                max={3600}
                step={10}
                unit="RPM"
                onChange={(v) => st.setParam("rpmObjetivo", v)}
              />
              <Slider
                label="Carga mecánica"
                value={Math.round(st.params.carga * 100)}
                min={0}
                max={120}
                step={1}
                unit="% de la nominal"
                onChange={(v) => st.setParam("carga", v / 100)}
              />
              <div>
                <div className="mb-1.5 text-sm text-slate-300">Situación simulada</div>
                <div className="grid gap-2">
                  {escenarios.map((e) => (
                    <Button
                      key={e.id}
                      tone={st.params.escenario === e.id ? e.tone : "neutral"}
                      active={st.params.escenario === e.id}
                      onClick={() => st.setParam("escenario", e.id)}
                      className="justify-start"
                    >
                      {e.icon} {e.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Indicadores">
            <div className="grid grid-cols-2 gap-2">
              <StatTile label="Velocidad" value={st.rpm.toFixed(0)} unit="RPM" hint={`${f1.toFixed(1)} Hz de giro`} />
              <StatTile label="Temperatura" value={st.temperatura.toFixed(1)} unit="°C" tone={tempTone} hint={`Alarma: ${PLACA.tAlarma} °C`} />
              <StatTile label="Corriente" value={st.corriente.toFixed(2)} unit="A" tone={iTone} hint={`Nominal: ${PLACA.corrienteNominal} A`} />
              <StatTile
                label="Vibración RMS"
                value={(st.caracteristicas?.rms ?? 0).toFixed(2)}
                unit="m/s²"
                hint={`Pico: ${(st.caracteristicas?.pico ?? 0).toFixed(2)} m/s²`}
              />
            </div>
          </Section>

          <Section title="Clasificador en el ESP32">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm text-slate-400">Última ventana</span>
              <span
                className={`rounded-md border px-3 py-1 text-base font-bold ${
                  {
                    ok: "border-ok/60 bg-ok/15 text-green-300",
                    warn: "border-warn/60 bg-warn/15 text-yellow-200",
                    bad: "border-bad/60 bg-bad/15 text-red-300",
                    neutral: "border-white/10 bg-white/5 text-slate-300",
                  }[pred ? tonoClase[pred.clase] : "neutral"]
                }`}
              >
                {pred ? pred.clase : "Sin datos"}
              </span>
            </div>
            <Barras pred={pred?.puntuaciones} />
            <p className="mt-2 text-xs text-slate-400">{pred?.causa ?? "Inicie la simulación para generar ventanas."}</p>
            <p className="mt-3 rounded-md border border-heat/30 bg-heat/10 p-2 text-[11px] leading-snug text-orange-200">
              {clasificadorDemostrativo.nombre}. No es un modelo TinyML entrenado ni presenta mediciones
              experimentales: ilustra cómo un modelo así entregaría su resultado.
            </p>
          </Section>
        </>
      }
      bottom={
        <>
          <Pipeline activo={corriendo && st.rpm > 1} />
          <div className="grid gap-4 md:grid-cols-2">
            <Section title="Vibración en el tiempo" right={<span className="text-xs text-slate-500">últimos 300 ms · 1 kHz</span>}>
              <TimeSeriesChart data={st.onda} xKey="t" yKey="a" name="Aceleración" unit="m/s²" xUnit="ms" decimals={2} />
            </Section>
            <Section title="Espectro de vibración (FFT)" right={<span className="text-xs text-slate-500">ventana de 512 muestras · Hann</span>}>
              <SpectrumChart
                data={st.espectro}
                marks={
                  f1 > 0.5
                    ? [
                        { value: +f1.toFixed(1), label: "1×" },
                        { value: +(2 * f1).toFixed(1), label: "2×" },
                        { value: +(3.6 * f1).toFixed(1), label: "Rod.", color: "#f97316" },
                      ]
                    : []
                }
              />
            </Section>
            <Section title="Temperatura de la carcasa" right={<Thermometer size={16} className="text-orange-300" />}>
              <TimeSeriesChart
                data={st.historial}
                xKey="t"
                yKey="temperatura"
                name="Temperatura"
                unit="°C"
                color="#f97316"
                refs={[{ value: PLACA.tAlarma, label: "Alarma", color: "#ef4444" }]}
                yDomain={[20, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10)]}
              />
            </Section>
            <Section title="Corriente de fase" right={<Zap size={16} className="text-accent" />}>
              <TimeSeriesChart
                data={st.historial}
                xKey="t"
                yKey="corriente"
                name="Corriente"
                unit="A"
                refs={[{ value: PLACA.corrienteNominal, label: "Nominal" }]}
                yDomain={[0, 12]}
                decimals={2}
              />
            </Section>
          </div>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Tabs tabs={contenidoMotor} />
            <Section title="Historial de ventanas" right={<Gauge size={16} className="text-slate-400" />}>
              {st.registro.length === 0 ? (
                <p className="text-sm text-slate-500">Aún no hay ventanas clasificadas.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {st.registro.map((r) => (
                    <li key={r.id} className="flex justify-between border-b border-white/5 py-1">
                      <span className="tabular text-slate-400">
                        #{r.id} · t = {r.t.toFixed(1)} s
                      </span>
                      <span
                        className={
                          r.clase === "Anomalía" ? "text-red-300" : r.clase === "Advertencia" ? "text-yellow-200" : r.clase === "Normal" ? "text-green-300" : "text-slate-400"
                        }
                      >
                        {r.clase}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </>
      }
    />
  );
}

function Barras({ pred }: { pred?: { normal: number; advertencia: number; anomalia: number } }) {
  const filas = [
    { k: "Normal", v: pred?.normal ?? 0, c: "bg-ok" },
    { k: "Advertencia", v: pred?.advertencia ?? 0, c: "bg-warn" },
    { k: "Anomalía", v: pred?.anomalia ?? 0, c: "bg-bad" },
  ];
  return (
    <div className="space-y-1.5">
      {filas.map((f) => (
        <div key={f.k} className="grid grid-cols-[90px_1fr_44px] items-center gap-2 text-xs">
          <span className="text-slate-300">{f.k}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-navy-700">
            <div className={`h-full rounded-full ${f.c} transition-all duration-300`} style={{ width: `${f.v * 100}%` }} />
          </div>
          <span className="tabular text-right text-slate-400">{(f.v * 100).toFixed(0)} %</span>
        </div>
      ))}
      <div className="text-[10px] text-slate-500">Puntuación ilustrativa, no probabilidad de un modelo real.</div>
    </div>
  );
}

function Pipeline({ activo }: { activo: boolean }) {
  const pasos = [
    ["Sensores", "Vibración, temperatura y corriente"],
    ["Adquisición", "ESP32 muestrea a 1 kHz"],
    ["Ventana", "512 muestras ≈ 0,5 s"],
    ["Características", "RMS, pico, FFT 1× / 2× / alta frecuencia"],
    ["Clasificador", "Normal · Advertencia · Anomalía"],
    ["Alerta", "LED y notificación"],
  ];
  return (
    <section className="panel p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
        Flujo de procesamiento en el borde (edge)
      </h3>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {pasos.map(([t, d], i) => (
          <li
            key={t}
            className="relative rounded-lg border border-accent/20 bg-navy-950/60 p-3"
            style={activo ? { animation: `pulsoPaso 3s ${i * 0.5}s infinite` } : undefined}
          >
            <div className="text-[11px] text-accent">Paso {i + 1}</div>
            <div className="font-semibold text-slate-100">{t}</div>
            <div className="text-xs text-slate-400">{d}</div>
          </li>
        ))}
      </ol>
      <style>{`@keyframes pulsoPaso{0%,100%{border-color:rgba(34,211,238,.2);box-shadow:none}8%,16%{border-color:rgba(34,211,238,.9);box-shadow:0 0 18px rgba(34,211,238,.35)}}`}</style>
    </section>
  );
}
