import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { proyectos } from "@/content/proyectos";
import { Preview } from "@/components/previews/Previews";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 pb-6 pt-10 sm:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          Exabre 2026 · Universidad CESMAG
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
          ExpoIngeniería <span className="text-accent">Interactiva</span>
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Cuatro proyectos de ingeniería presentados mediante simulaciones técnicas animadas. Seleccione un
          proyecto para observar cómo funciona y modificar sus variables.
        </p>
        <p className="mt-2 text-xs text-slate-500">Todos los valores mostrados son simulados con fines educativos.</p>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-5 px-4 pb-10 md:grid-cols-2">
        {proyectos.map((p) => (
          <Link
            key={p.id}
            href={p.ruta}
            className="panel group flex flex-col overflow-hidden transition hover:border-accent/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
          >
            <div className="relative h-44 border-b border-white/5 bg-navy-950/60 sm:h-52">
              <Preview id={p.id} />
              <span className="absolute left-3 top-3 rounded-md bg-navy-950/80 px-2 py-0.5 text-xs font-semibold text-accent">
                Proyecto {p.numero}
              </span>
              {!p.disponible ? (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-heat/20 px-2 py-0.5 text-xs text-orange-200">
                  <Clock size={12} /> En desarrollo
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="text-lg font-semibold leading-snug">{p.titulo}</h2>
              <p className="mt-1.5 flex-1 text-sm text-slate-400">{p.resumen}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.etiquetas.map((e) => (
                  <span key={e} className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-slate-300">
                    {e}
                  </span>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                Abrir simulación <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </main>

    </div>
  );
}
