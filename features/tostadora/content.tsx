// Contenidos educativos del Proyecto 2. Edite los textos libremente.

const componentes: [string, string][] = [
  ["Tambor metálico horizontal", "Cilindro de acero que contiene los granos. Al girar los levanta y los deja caer, mezclándolos para que se tuesten de forma pareja."],
  ["Soportes laterales", "Sostienen el eje del tambor mediante chumaceras (rodamientos) a cada lado."],
  ["Eje de rotación", "Atraviesa el tambor y transmite el giro desde la polea."],
  ["Motorreductor y correa", "El motor gira rápido y con poco par; las poleas reducen la velocidad y aumentan el par para mover el tambor cargado."],
  ["Estufa de gas", "Sus quemadores calientan la pared del tambor; la intensidad de la llama controla la energía entregada."],
  ["Paletas internas", "Láminas soldadas por dentro que ayudan a levantar y voltear los granos."],
];

export const contenidoTostadora = [
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
        <li>Se precalienta el tambor vacío con la estufa encendida.</li>
        <li>Se cargan los granos verdes por la tolva; enfrían momentáneamente el tambor.</li>
        <li>El calor pasa de la llama a la pared metálica (conducción) y de la pared a los granos por contacto y por el aire caliente (convección).</li>
        <li>
          El giro levanta los granos con la pared y las paletas hasta que caen en cascada. Si el tambor gira demasiado rápido, la
          fuerza centrífuga los pega a la pared (velocidad crítica) y la mezcla empeora.
        </li>
        <li>El grano pasa por secado, amarilleo, reacciones de Maillard, primer crack y desarrollo.</li>
        <li>Al llegar al punto deseado se descargan los granos en una bandeja de enfriamiento para detener el tueste.</li>
      </ol>
    ),
  },
  {
    id: "objetivo",
    label: "Objetivo de ingeniería",
    content: (
      <div className="space-y-2">
        <p>
          Diseñar una tostadora artesanal de bajo costo que logre un tueste uniforme y repetible controlando tres variables:
          velocidad del tambor, energía térmica y tiempo.
        </p>
        <p>
          Integra diseño mecánico (estructura, transmisión, selección del motor), transferencia de calor y control de procesos.
          La velocidad crítica n<sub>c</sub> ≈ 42,3/√D (RPM, con D en metros) orienta la elección de la velocidad de giro.
        </p>
      </div>
    ),
  },
  {
    id: "alcances",
    label: "Alcances y limitaciones",
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>Las temperaturas provienen de un modelo térmico simplificado, no de mediciones.</li>
        <li>Los rangos de cada etapa son aproximados; varían con el origen del café, la humedad y la posición de la sonda.</li>
        <li>El movimiento de los granos es un modelo cinemático ilustrativo, no una simulación de partículas.</li>
        <li>El tiempo está acelerado para la exposición.</li>
      </ul>
    ),
  },
];
