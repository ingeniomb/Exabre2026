import Link from "next/link";
import type { ProyectoId } from "@/content/proyectos";
import { proyectos } from "@/content/proyectos";
import { Preview } from "@/components/previews/Previews";

export function EnDesarrollo({ id }: { id: ProyectoId }) {
  const p = proyectos.find((x) => x.id === id)!;
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10">
      <div className="panel overflow-hidden">
        <div className="h-56 bg-navy-950/60">
          <Preview id={id} />
        </div>
        <div className="p-6">
          <p className="text-xs uppercase tracking-widest text-accent">Proyecto {p.numero}</p>
          <h1 className="mt-1 text-2xl font-semibold">{p.titulo}</h1>
          <p className="mt-2 text-slate-400">{p.resumen}</p>
          <p className="mt-4 rounded-md border border-heat/30 bg-heat/10 p-3 text-sm text-orange-200">
            La simulación completa de este proyecto se incorporará en la siguiente fase de desarrollo.
          </p>
          <Link href="/" className="mt-5 inline-block text-sm font-semibold text-accent">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
