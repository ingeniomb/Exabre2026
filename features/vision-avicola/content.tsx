// Contenidos educativos del Proyecto 4. Edite los textos libremente.

const componentes: [string, string][] = [
  ["Cámara de captura", "Toma imágenes del área de observación con iluminación controlada para que los colores sean comparables."],
  ["Área de observación", "Zona demarcada donde se ubica la muestra; facilita el encuadre y el recorte automático."],
  ["Dispositivo de procesamiento", "Placa embebida (por ejemplo, ESP32-CAM o un computador de placa reducida) que preprocesa la imagen y ejecuta el modelo."],
  ["Modelo de clasificación", "Red neuronal convolucional que asigna la imagen a una categoría de características visuales."],
  ["Pantalla de resultados", "Muestra la categoría, la confianza y las alertas al personal de la granja."],
];

export const contenidoVision = [
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
        <li>Se identifica la muestra dentro del área de observación.</li>
        <li>La cámara captura la imagen.</li>
        <li>Preprocesamiento: recorte de la región de interés, redimensionamiento a 224×224 píxeles, normalización y realce.</li>
        <li>El modelo extrae características (color, textura, forma) y calcula una puntuación para cada categoría.</li>
        <li>Se presenta la categoría con mayor puntuación y su nivel de confianza.</li>
        <li>Si la categoría está asociada a una posible condición sanitaria, se genera una alerta para revisión veterinaria.</li>
      </ol>
    ),
  },
  {
    id: "niveles",
    label: "Observar, clasificar, diagnosticar",
    content: (
      <div className="space-y-2">
        <p>
          <b className="text-slate-100">Observación visual:</b> describe lo que se ve (color, consistencia, forma).
        </p>
        <p>
          <b className="text-slate-100">Clasificación algorítmica:</b> asigna una categoría con cierta confianza. Puede equivocarse y depende de los
          datos con que se entrenó el modelo.
        </p>
        <p>
          <b className="text-slate-100">Diagnóstico veterinario:</b> lo emite un profesional considerando la historia del lote, el examen clínico
          y, si es necesario, pruebas de laboratorio.
        </p>
      </div>
    ),
  },
  {
    id: "alcances",
    label: "Alcances y limitaciones",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Las imágenes son ilustraciones generadas por código y los resultados son demostrativos.</li>
        <li>Esta versión no contiene un modelo entrenado; la confianza mostrada es ficticia.</li>
        <li>La aplicación está preparada para incorporar después un modelo real, entrenado y validado con imágenes etiquetadas por expertos.</li>
        <li>Las asociaciones mencionadas son posibles y orientativas; no reemplazan la evaluación veterinaria.</li>
      </ul>
    ),
  },
];
