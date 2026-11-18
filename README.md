# ExpoIngeniería Interactiva – Exabre 2026 · Universidad CESMAG

Aplicación web con simulaciones técnicas animadas de cuatro proyectos de ingeniería. Está hecha con Next.js, TypeScript, Tailwind CSS, React Three Fiber y Recharts.

> Todos los valores que muestra la aplicación son **simulados** con fines educativos.

## Proyectos

1. Monitoreo inteligente de un motor eléctrico
2. Tostadora de café con tambor giratorio
3. Recirculación de agua para peladora de pollos
4. Reconocimiento de imágenes de excrementos de gallinas

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
   git commit -m "ExpoIngeniería"
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
- `features/<proyecto>/content.tsx`: textos educativos de cada proyecto (pestañas Componentes, ¿Cómo funciona?, etc.).
- `features/vision-avicola/muestras.tsx`: ejemplos de la galería del Proyecto 4 (descripciones, categorías y notas).

## Estructura

```
app/                     rutas (inicio y una página por proyecto)
components/ui            botones, deslizadores, indicadores, pestañas
components/layout        plantilla común de cada proyecto (ProjectShell)
components/three         lienzo 3D común y etiquetas
components/charts        gráficas (Recharts)
components/previews      animaciones SVG de las tarjetas del inicio
features/motor           Proyecto 1: motor eléctrico
features/tostadora       Proyecto 2: tostadora de café
features/recirculacion   Proyecto 3: recirculación de agua
features/vision-avicola  Proyecto 4: visión artificial
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

## Proyecto 2: modelo usado

- Tambor precalentado; temperatura del tambor y del grano con modelos de primer orden acoplados.
- La transferencia de calor depende de la mezcla, que es máxima cerca de 0,7 veces la velocidad crítica (n_c ≈ 42,3/√D) y cae al superarla (centrifugado).
- Color del grano según la temperatura máxima alcanzada; una mezcla deficiente produce un tueste disparejo.
- Etapas aproximadas: secado, amarilleo, Maillard, primer crack (≈196 °C) y desarrollo. Al cumplirse el tiempo se descarga y enfría.
- El tiempo se acelera ×10, ×30 o ×60. La curva es ilustrativa.

## Proyecto 3: modelo usado

- Balance de masa del depósito: dV/dt = Q_entrada − Q_bomba − Q_rebose.
- La peladora toma primero el agua de retorno y completa con agua nueva.
- El filtro se colmata con el volumen tratado y reduce el caudal de la bomba; «Limpiar filtro» lo restablece.
- Protección de la bomba por nivel bajo, con histéresis. Tiempo acelerado ×20.
- Advertencia sanitaria visible: la simulación no certifica la calidad del agua.

## Proyecto 4: funcionamiento

- Galería de ilustraciones generadas por código (no fotografías).
- Secuencia animada: identificación, captura, preprocesamiento (recorte, 224×224, escala de grises, normalización), análisis, resultado y alerta.
- Resultado en tres niveles: observación visual, clasificación algorítmica (simulada) y diagnóstico veterinario (no lo emite el sistema).
- Para conectar un modelo real, implemente la interfaz `ImageClassifier` de `features/vision-avicola/classifier.ts`.
