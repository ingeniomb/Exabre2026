// Contenidos educativos del Proyecto 1. Edite los textos libremente.

const componentes: [string, string][] = [
  ["Motor de inducción trifásico", "Convierte energía eléctrica en mecánica. Su velocidad se ajusta con un variador de frecuencia (VFD)."],
  ["Acelerómetro", "Mide la aceleración de la carcasa. Sus componentes en frecuencia revelan desbalance, desalineación o daño en rodamientos."],
  ["Sensor de temperatura", "Sonda adherida a la carcasa. Una temperatura sostenida por encima del rango de diseño acelera el envejecimiento del aislamiento."],
  ["Sensor de corriente", "Pinza no invasiva sobre un conductor de fase. La corriente aumenta con la carga mecánica."],
  ["ESP32", "Microcontrolador de doble núcleo con Wi-Fi. Adquiere las señales, calcula características y ejecuta el modelo en el propio dispositivo."],
  ["Ventilador", "Montado en el eje; por eso, a baja velocidad, la refrigeración del motor disminuye."],
];

export const contenidoMotor = [
  {
    id: "componentes",
    label: "Componentes",
    content: (
      <dl className="grid gap-3 sm:grid-cols-2">
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
        <li>El acelerómetro se muestrea a 1 kHz; la temperatura y la corriente, a una tasa menor.</li>
        <li>El ESP32 agrupa 512 muestras de vibración en una ventana (≈ 0,5 s).</li>
        <li>
          Se calculan características: valor RMS, pico y, mediante la FFT, la amplitud a la frecuencia de giro (1×), al
          doble (2×) y la energía en alta frecuencia.
        </li>
        <li>Un modelo pequeño (TinyML) recibe esas características y asigna una clase a la ventana.</li>
        <li>Si la clase es Advertencia o Anomalía, se enciende un indicador y se puede enviar una notificación.</li>
        <li>
          Lectura del espectro: un pico 1× dominante suele asociarse a desbalance; un 2× alto, a desalineación; y
          componentes de alta frecuencia moduladas, a defectos de rodamiento.
        </li>
      </ol>
    ),
  },
  {
    id: "objetivo",
    label: "Objetivo de ingeniería",
    content: (
      <div className="space-y-2">
        <p>
          Pasar del mantenimiento correctivo al mantenimiento predictivo: detectar patrones anómalos antes de una
          falla, usando hardware de bajo costo y procesamiento en el borde, sin depender de la nube.
        </p>
        <p>
          El proyecto integra instrumentación (sensores y acondicionamiento), procesamiento digital de señales (FFT,
          ventanas) e inteligencia artificial embebida.
        </p>
      </div>
    ),
  },
  {
    id: "alcances",
    label: "Alcances y limitaciones",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Todas las señales son generadas por un modelo matemático simplificado; no provienen de un motor real.</li>
        <li>
          La dinámica térmica está acelerada (constante de tiempo de 15 s) para poder observarla durante la exposición;
          en un motor real son decenas de minutos.
        </li>
        <li>
          El clasificador mostrado usa reglas con umbrales. Un modelo TinyML real debe entrenarse y validarse con datos
          medidos del equipo.
        </li>
        <li>La rotación se dibuja ralentizada y la vibración de la carcasa está exagerada para que sean visibles.</li>
      </ul>
    ),
  },
];
