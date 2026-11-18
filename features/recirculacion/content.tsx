// Contenidos educativos del Proyecto 3. Edite los textos libremente.

const componentes: [string, string][] = [
  ["Peladora de tambor", "Un plato giratorio con dedos de goma voltea el ave escaldada mientras un anillo rocía agua para arrastrar las plumas."],
  ["Tamiz rotatorio", "Malla que gira y retiene plumas y sólidos gruesos antes de que el agua llegue al depósito."],
  ["Depósito de recolección", "Almacena el agua utilizada y amortigua las diferencias entre lo que entra y lo que bombea el sistema."],
  ["Bomba centrífuga", "El impulsor giratorio entrega energía al agua para llevarla por el tratamiento hasta el retorno."],
  ["Sedimentación", "El agua pierde velocidad y las partículas más pesadas se depositan en el fondo cónico para purgarlas."],
  ["Filtro de cartucho", "Retiene partículas finas. Con el uso se colmata: aumenta la pérdida de presión y baja el caudal."],
  ["Desinfección", "Etapa conceptual (por ejemplo, radiación UV o dosificación controlada). Su diseño y validación son requisitos sanitarios."],
  ["Válvulas", "Permiten aislar tramos, hacer mantenimiento y dirigir el agua."],
];

export const contenidoRecirculacion = [
  {
    id: "componentes",
    label: "Componentes",
    content: (
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {componentes.map(([t, d]) => (
          <div key={t} className="rounded-lg border border-white/5 bg-navy-950/40 p-3">
            <dt className="font-semibold text-slate-100">{t}</dt>
            <dd className="text-slate-400">{d}</dd>
          </div>
        ))}
      </dl>
    ),
  },
  {
    id: "funcionamiento",
    label: "¿Cómo funciona?",
    content: (
      <ol className="list-decimal space-y-2 pl-5">
        <li>La peladora necesita un caudal de aspersión; se abastece primero del retorno y completa con agua nueva.</li>
        <li>El agua utilizada sale por gravedad, pasa por el tamiz y cae al depósito.</li>
        <li>
          Balance del depósito: <span className="font-mono text-accent">dV/dt = Q<sub>entrada</sub> − Q<sub>bomba</sub> − Q<sub>rebose</sub></span>.
        </li>
        <li>La bomba envía el agua a sedimentación, filtración y desinfección; una parte se purga como lodos.</li>
        <li>Si el nivel baja demasiado, la bomba se protege y se detiene hasta que el depósito vuelve a llenarse.</li>
        <li>El filtro se colmata con el volumen tratado y reduce el caudal; la limpieza restablece la operación.</li>
      </ol>
    ),
  },
  {
    id: "objetivo",
    label: "Objetivo de ingeniería",
    content: (
      <div className="space-y-2">
        <p>
          Reducir el consumo de agua nueva en el proceso de desplume recuperando una fracción del agua utilizada, con
          separación de sólidos, tratamiento y retorno controlado.
        </p>
        <p>Integra hidráulica (bombas, pérdidas en filtros, balance de masa), instrumentación de nivel y caudal, y criterios sanitarios.</p>
      </div>
    ),
  },
  {
    id: "alcances",
    label: "Alcances y limitaciones",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Los caudales, volúmenes y la colmatación son valores ilustrativos de un modelo simplificado.</li>
        <li>El tratamiento se representa de forma conceptual; no se modela la calidad microbiológica del agua.</li>
        <li>El porcentaje de recuperación es ilustrativo y no corresponde a una medición.</li>
        <li>Cualquier reutilización real exige validación sanitaria y cumplimiento de la normativa aplicable.</li>
      </ul>
    ),
  },
];
