export type ProyectoId = "motor" | "tostadora" | "recirculacion" | "vision-avicola";

export interface ProyectoInfo {
  id: ProyectoId;
  numero: number;
  titulo: string;
  resumen: string;
  ruta: string;
  etiquetas: string[];
  disponible: boolean;
}

export const proyectos: ProyectoInfo[] = [
  {
    id: "motor",
    numero: 1,
    titulo: "Monitoreo inteligente de un motor eléctrico",
    resumen:
      "Sensores de vibración, temperatura y corriente conectados a un ESP32 que clasifica ventanas de datos con TinyML.",
    ruta: "/proyectos/motor",
    etiquetas: ["ESP32", "TinyML", "FFT", "Mantenimiento predictivo"],
    disponible: true,
  },
  {
    id: "tostadora",
    numero: 2,
    titulo: "Tostadora de café con tambor giratorio",
    resumen:
      "Cilindro metálico horizontal motorizado sobre una estufa de gas que mezcla y tuesta los granos.",
    ruta: "/proyectos/tostadora",
    etiquetas: ["Transferencia de calor", "Mecanismos", "Control de proceso"],
    disponible: true,
  },
  {
    id: "recirculacion",
    numero: 3,
    titulo: "Recirculación de agua para peladora de pollos",
    resumen:
      "Recolección, separación de sólidos, tratamiento conceptual y retorno controlado del agua de proceso.",
    ruta: "/proyectos/recirculacion",
    etiquetas: ["Hidráulica", "Bombas", "Uso eficiente del agua"],
    disponible: true,
  },
  {
    id: "vision-avicola",
    numero: 4,
    titulo: "Reconocimiento de imágenes de excrementos de gallinas",
    resumen:
      "Cámara y modelo de visión artificial como herramienta de apoyo para la vigilancia sanitaria avícola.",
    ruta: "/proyectos/vision-avicola",
    etiquetas: ["Visión artificial", "Clasificación", "Sistemas embebidos"],
    disponible: true,
  },
];
