# ExpoIngeniería Interactiva – Exabre 2026 · Universidad CESMAG

Aplicación web con simulaciones técnicas animadas de cuatro proyectos de ingeniería. Está hecha con Next.js, TypeScript, Tailwind CSS, React Three Fiber y Recharts.

> Todos los valores que muestra la aplicación son **simulados** con fines educativos.

## Estado actual (fase 1)

| Proyecto | Estado |
|---|---|
| 1. Monitoreo inteligente de un motor eléctrico | Completo |
| 2. Tostadora de café con tambor giratorio | Siguiente fase |
| 3. Recirculación de agua para peladora de pollos | Siguiente fase |
| 4. Reconocimiento de imágenes de excrementos de gallinas | Siguiente fase |

## Requisitos

- Node.js 20.9 o superior (se recomienda la versión LTS)
- npm (se instala con Node.js)

## Ejecutar en el computador

```bash
npm install
npm run dev
```

Luego abra http://localhost:3000 en el navegador.

Para comprobar que compila como en Vercel:

```bash
npm run build
npm start
```

## Publicar en Vercel

### Opción A: desde GitHub (recomendada)

1. Cree un repositorio vacío en GitHub y suba esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "ExpoIngeniería fase 1"
   git branch -M main
   git remote add origin https://github.com/SU_USUARIO/expoingenieria.git
   git push -u origin main
   ```
2. Entre a https://vercel.com con su cuenta de GitHub (el plan gratuito Hobby es suficiente).
3. Elija **Add New → Project**, seleccione el repositorio y pulse **Deploy**. No hace falta cambiar ninguna configuración.
4. Cada vez que suba cambios a GitHub (`git push`), Vercel vuelve a publicar la aplicación automáticamente.

### Opción B: con la terminal

```bash
npm i -g vercel
vercel        # vista previa
vercel --prod # producción
```

## Uso durante la exposición

| Tecla | Acción |
|---|---|
| Espacio | Iniciar o pausar |
| R | Reiniciar el proceso |
| F | Pantalla completa |
| L | Mostrar u ocultar etiquetas 3D |
| 1 – 4 | Ir al proyecto |
| ? | Ayuda |

El botón **T** de la barra superior amplía el texto para verlo mejor en el proyector.

## Dónde editar los textos

- `content/proyectos.ts`: títulos, resúmenes y etiquetas de las tarjetas del inicio.
- `features/motor/content.tsx`: textos educativos del Proyecto 1.

## Estructura

```
app/                     rutas (inicio y una página por proyecto)
components/ui            botones, deslizadores, indicadores, pestañas
components/layout        plantilla común de cada proyecto (ProjectShell)
components/three         lienzo 3D común y etiquetas
components/charts        gráficas (Recharts)
components/previews      animaciones SVG de las tarjetas del inicio
features/motor           Proyecto 1: simulación, clasificador, escena 3D y vista
lib/                     FFT, bucle de simulación, utilidades
```

Cada proyecto separa tres cosas:

1. **Modelo físico** (`simulation.ts`): funciones puras en TypeScript con paso de tiempo fijo.
2. **Estado** (`store.ts`, con Zustand): controles, historial para las gráficas y botones.
3. **Dibujo** (`Scene.tsx`): lee el modelo cuadro a cuadro sin volver a renderizar React.

## Proyecto 1: modelo usado

- Velocidad: rampa de primer orden del variador de frecuencia.
- Corriente: corriente de vacío más un término proporcional a la carga y la velocidad.
- Temperatura: modelo térmico de primer orden. La constante de tiempo está acelerada a 15 s para poder verla durante la exposición, y la refrigeración empeora a baja velocidad.
- Vibración a 1 kHz: componente 1× (desbalance), 2× (desalineación), una componente de alta frecuencia modulada (patrón tipo rodamiento) y ruido.
- FFT propia (`lib/fft.ts`) sobre ventanas de 512 muestras con ventana de Hann.
- Clasificador **demostrativo** con umbrales (`features/motor/classifier.ts`). No es un modelo entrenado.

### Conectar datos reales más adelante

- **Modelo entrenado:** implemente la interfaz `Clasificador` de `features/motor/classifier.ts` (por ejemplo, con TensorFlow.js) y reemplace `clasificadorDemostrativo` en `features/motor/store.ts`.
- **ESP32 real:** sustituya la función `paso()` por lecturas recibidas mediante WebSocket o MQTT sobre WebSocket y escriba los valores en `motorSim.estado`.
