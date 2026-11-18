// Interfaz para conectar en el futuro un modelo de visión REAL y validado (por ejemplo, con TensorFlow.js).
// La implementación actual es DEMOSTRATIVA: devuelve la categoría asociada a cada ilustración de ejemplo
// con una confianza ficticia. No existe un modelo entrenado en esta versión.

import type { Muestra } from "./muestras";

export interface ResultadoClasificacion {
  categoria: string;
  confianza: number; // 0 – 1, SIMULADA
  alerta: boolean;
}

export interface ImageClassifier {
  nombre: string;
  esDemostrativo: boolean;
  clasificar(muestra: Muestra): ResultadoClasificacion;
}

export const clasificadorDemostrativo: ImageClassifier = {
  nombre: "Clasificador demostrativo (sin modelo entrenado)",
  esDemostrativo: true,
  clasificar(m) {
    const ruido = (Math.random() - 0.5) * 0.06;
    return { categoria: m.categoria, confianza: Math.min(0.99, Math.max(0.5, m.confianzaBase + ruido)), alerta: m.alerta };
  },
};
