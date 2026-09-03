/**
 * ========================================================================
 * 🎓 SUSYBOT CURRICULAR FRAMEWORK & DIDACTIC SEQUENCE ENGINE
 * Ubicación: /src/lib/nora/curricularFramework.ts
 * 
 * Estándares:
 * - Núcleos de Aprendizaje Prioritarios (NAP) - Argentina
 * - Diseños Curriculares de Educación Primaria (1° y 2° Ciclo) y Secundaria
 * - Modalidad Educación Especial: PPI (Proyecto Pedagógico Individual) y DUA 3.0 (CAST)
 * - Taxonomía de Bloom Revisada (Niveles de Demanda Cognitiva)
 * - Apoyos Visuales y SAAC (ARASAAC / Pictogramas)
 * ========================================================================
 */

export interface CurricularUnit {
  id: string;
  name: string;
  level: "inicial" | "primaria_primer_ciclo" | "primaria_segundo_ciclo" | "secundaria" | "especial";
  grades: string[];
  coreAxes: {
    axisName: string;
    topics: string[];
    capabilities: string[];
  }[];
}

export const ARGENTINE_PRIMARY_CURRICULUM: CurricularUnit[] = [
  {
    id: "lengua_primaria_1",
    name: "Lengua y Literatura",
    level: "primaria_primer_ciclo",
    grades: ["1° Grado", "2° Grado", "3° Grado"],
    coreAxes: [
      {
        axisName: "Comprensión y Producción Oral",
        topics: ["Conversaciones espontáneas y guiadas", "Escucha atenta de narraciones", "Renarración de cuentos y anécdotas", "Formulación de preguntas y respuestas"],
        capabilities: ["Comunicación", "Pensamiento crítico"]
      },
      {
        axisName: "Lectura y Escritura de Palabras y Textos",
        topics: ["Conciencia fonológica y principio alfabético", "Lectura compartida e individual", "Escritura de palabras y oraciones significativas", "Signos de puntuación iniciales (punto, mayúsculas)"],
        capabilities: ["Aprender a aprender", "Comprensión lectora"]
      },
      {
        axisName: "Literatura",
        topics: ["Cuentos tradicionales y de autor", "Poesías, rimas, trabalenguas y adivinanzas", "Exploración de la biblioteca escolar", "Personajes y secuencias narrativas"],
        capabilities: ["Creatividad", "Sensibilidad estética"]
      }
    ]
  },
  {
    id: "lengua_primaria_2",
    name: "Lengua y Literatura",
    level: "primaria_segundo_ciclo",
    grades: ["4° Grado", "5° Grado", "6° Grado"],
    coreAxes: [
      {
        axisName: "Lectura, Comprensión y Producción de Textos No Ficcionales",
        topics: ["Textos expositivos y explicativos", "Artículos de divulgación", "Noticias y crónicas periodísticas", "Estrategias de resumen, subrayado e ideas principales"],
        capabilities: ["Pensamiento crítico", "Resolución de problemas"]
      },
      {
        axisName: "Reflexión sobre la Lengua y los Textos",
        topics: ["Clases de palabras (sustantivos, adjetivos, verbos, adverbios)", "Reglas de acentuación (agudas, graves, esdrújulas)", "Cohesión y coherencia textual", "Uso correcto de conectores y signos de puntuación"],
        capabilities: ["Metacognición", "Comunicación eficaz"]
      },
      {
        axisName: "Literatura y Análisis Ficcional",
        topics: ["Mitos y leyendas regionales (Iberá, Guaraní)", "Novelas cortas y cuentos de ciencia ficción / policial", "Teatro y poesía", "Recursos expresivos y figuras retóricas"],
        capabilities: ["Interpretación profunda", "Producción escrita autónoma"]
      }
    ]
  },
  {
    id: "matematica_primaria_1",
    name: "Matemática",
    level: "primaria_primer_ciclo",
    grades: ["1° Grado", "2° Grado", "3° Grado"],
    coreAxes: [
      {
        axisName: "Número y Operaciones",
        topics: ["Sistema de numeración decimal (hasta 1.000 / 10.000)", "Conteo, comparación y orden", "Suma y resta con diversos significados y algoritmos", "Iniciación a la multiplicación y reparto"],
        capabilities: ["Resolución de problemas", "Razonamiento cuantitativo"]
      },
      {
        axisName: "Geometría y Medida",
        topics: ["Figuras y cuerpos geométricos básicos (círculo, cuadrado, cubo, cilindro)", "Ubicación espacial y desplazamientos", "Unidades de tiempo (días, meses, horas) y longitud no convencionales y convencionales"],
        capabilities: ["Percepción espacial", "Modelización"]
      }
    ]
  },
  {
    id: "matematica_primaria_2",
    name: "Matemática",
    level: "primaria_segundo_ciclo",
    grades: ["4° Grado", "5° Grado", "6° Grado"],
    coreAxes: [
      {
        axisName: "Números Naturales, Fracciones y Decimales",
        topics: ["Grandes números y valor posicional", "Fracciones (concepto, equivalencias, suma y resta)", "Números decimales y uso social del dinero", "Multiplicación y división por dos cifras y propiedades"],
        capabilities: ["Pensamiento lógico-matemático", "Resolución de problemas complejos"]
      },
      {
        axisName: "Geometría, Perímetro y Área",
        topics: ["Triángulos y cuadriláteros (construcción con regla y compás, propiedades)", "Ángulos (rectos, agudos, obtusos)", "Cálculo de perímetro y área en figuras planas", "Cuerpos poliedros y redondos"],
        capabilities: ["Deducción geométrica", "Uso de herramientas de precisión"]
      },
      {
        axisName: "Proporcionalidad y Estadística",
        topics: ["Proporcionalidad directa", "Tablas y gráficos de barras / circulares", "Porcentajes simples"],
        capabilities: ["Análisis de datos", "Toma de decisiones"]
      }
    ]
  },
  {
    id: "ciencias_naturales_primaria",
    name: "Ciencias Naturales",
    level: "primaria_segundo_ciclo",
    grades: ["4° Grado", "5° Grado", "6° Grado"],
    coreAxes: [
      {
        axisName: "Los Seres Vivos y Ecosistemas",
        topics: ["Biodiversidad y clasificación biológica", "Ecosistemas acuáticos, terrestres y de humedal (Esteros del Iberá)", "Adaptaciones de flora y fauna al ambiente", "Cadena trófica y redes alimentarias"],
        capabilities: ["Pensamiento científico", "Conciencia ambiental"]
      },
      {
        axisName: "El Cuerpo Humano y la Salud",
        topics: ["Sistemas del cuerpo humano (Digestivo, Respiratorio, Circulatorio, Excretor)", "Nutrición y hábitos saludables", "Sistema reproductor y ESI (Educación Sexual Integral)"],
        capabilities: ["Autocuidado", "Pensamiento reflexivo"]
      },
      {
        axisName: "Materia, Energía y el Universo",
        topics: ["Estados de la materia y cambios físicos/químicos", "Mezclas homogéneas y heterogéneas (métodos de separación)", "Energía (fuentes renovables y la represa Yacyretá)", "El Sistema Solar y movimientos de la Tierra"],
        capabilities: ["Experimentación guiada", "Observación sistemática"]
      }
    ]
  },
  {
    id: "ciencias_sociales_primaria",
    name: "Ciencias Sociales",
    level: "primaria_segundo_ciclo",
    grades: ["4° Grado", "5° Grado", "6° Grado"],
    coreAxes: [
      {
        axisName: "Las Sociedades y los Espacios Geográficos",
        topics: ["Geografía de Corrientes y Argentina (relieve, clima, cuencas hidrográficas)", "Circuitos productivos y recursos naturales", "Espacios rurales y urbanos", "Problemas ambientales y sustentabilidad"],
        capabilities: ["Comprensión del espacio social", "Ciudadanía activa"]
      },
      {
        axisName: "Las Sociedades a Través del Tiempo",
        topics: ["Pueblos originarios (Guaraníes, comunidades originarias)", "Época colonial y Virreinato del Río de la Plata", "Proceso de Independencia (1810-1816, San Martín, Belgrano)", "Organización del Estado Nacional y Constitución"],
        capabilities: ["Pensamiento histórico", "Valoración de la memoria colectiva"]
      },
      {
        axisName: "Las Actividades Humanas y la Organización Social",
        topics: ["Derechos del Niño y Derechos Humanos", "Poderes del Estado y sistema democrático", "Diversidad cultural e identidad local"],
        capabilities: ["Convivencia democrática", "Empatía intercultural"]
      }
    ]
  }
];

export const SPECIAL_EDUCATION_FRAMEWORK = `
========================================================================
🧩 MARCO PEDAGÓGICO DE EDUCACIÓN ESPECIAL & INCLUSIÓN (DUA 3.0 / PPI)
========================================================================
Cuando se planifica para Educación Especial o aulas heterogéneas inclusivas, NORA debe integrar obligatoriamente:

1. 🎯 PRINCIPIO DUA 1: MÚLTIPLES FORMAS DE COMPROMISO / MOTIVACIÓN
   - Opciones para captar el interés mediante intereses específicos del estudiante.
   - Apoyos para la autorregulación emocional y pausas sensoriales programadas.
   - Tareas graduadas con recompensas de logro claras y anticipación de tiempos.

2. 👁️ PRINCIPIO DUA 2: MÚLTIPLES FORMAS DE REPRESENTACIÓN (ACCESO A LA INFORMACIÓN)
   - Uso de Pictogramas ARASAAC y Agendas Visuales: [PICTO: mirar], [PICTO: escuchar], [PICTO: recortar], [PICTO: escribir], [PICTO: fin].
   - Información dosificada (paso a paso literal, sin lenguaje figurado ni ambigüedades).
   - Soportes multisensoriales: Material concreto manipulable, maquetas táctiles, audiodescripción para baja visión y contrastes cromáticos altos.

3. ✍️ PRINCIPIO DUA 3: MÚLTIPLES FORMAS DE ACCIÓN Y EXPRESIÓN
   - Flexibilidad en la respuesta: señalar con pictogramas, modelar en masa, armar tarjetas, respuestas orales o uso de software accesible.
   - Andamiaje con plantillas guía, organizadores gráficos simplificados y mediación docente personalizada.

4. 📋 PROYECTO PEDAGÓGICO INDIVIDUAL (PPI):
   - Identificación de Barreras al Aprendizaje y la Participación (BAP).
   - Configuraciones de Apoyo específicas (de acceso, metodológicas y de priorización de contenidos).
`;

export const DIDACTIC_SEQUENCE_MASTER_TEMPLATE = `
========================================================================
📋 ESTRUCTURA OBLIGATORIA DE SECUENCIA DIDÁCTICA INTEGRAL NORA
========================================================================
Cada vez que un docente solicite planificar una clase, secuencia didáctica o unidad curricular, NORA DEBE ENTREGAR LA PLANIFICACIÓN COMPLETA estructurada con el siguiente rigor formal:

# 📖 SECUENCIA DIDÁCTICA: [TÍTULO CREATIVO Y PEDAGÓGICO]

## 1. 📌 ENCUADRE CURRICULAR & IDENTIFICACIÓN
* **Institución / Ámbito:** Nivel Primario / Especial / Secundario
* **Grado / Año / Ciclo:** [Ej: 4° Grado - Segundo Ciclo]
* **Unidad Curricular (UC) / Área:** [Ej: Ciencias Naturales / Lengua / Matemática]
* **Eje Temático (NAP):** [Eje oficial de los NAP]
* **Tiempo Estimado:** [Ej: 3 Clases de 80 minutos / 2 semanas]
* **Fundamentación Pedagógica:** [Breve párrafo explicando por qué es relevante el contenido y cómo se conecta con la realidad del alumno].

---

## 2. 🧠 CONTENIDOS CURRICULARES (DESGLOSE TRIPARTITO)
* **🧠 Contenidos Conceptuales (Saber):**
  - [Hechos, conceptos clave, principios, leyes, definiciones y vocabulario científico/disciplinar].
* **🛠️ Contenidos Procedimentales (Saber Hacer):**
  - [Procedimientos, técnicas de estudio, indagación experimental, algoritmos, producción textual, análisis y resolución de problemas].
* **🤝 Contenidos Actitudinales (Saber Ser y Convivir):**
  - [Valores, actitudes de curiosidad y rigor, respeto por las opiniones ajenas, cuidado del entorno, trabajo colaborativo y perseverancia].

---

## 3. 🎯 PROPÓSITOS Y OBJETIVOS DE APRENDIZAJE
* **Propósitos de la Enseñanza (Docente):** [Qué se propone brindar y mediar el docente en el aula].
* **Objetivos de Aprendizaje (Capacidades / Taxonomía de Bloom):**
  1. *Objetivo Conceptual:* [Identificar / Explicar / Relacionar...]
  2. *Objetivo Procedimental:* [Construir / Aplicar / Resolver / Redactar...]
  3. *Objetivo Actitudinal:* [Valorar / Colaborar / Demostrar compromiso...]

---

## 4. 📚 DESARROLLO CLASE POR CLASE (SECUENCIA METODOLÓGICA COMPLETA)

### 🔹 CLASE 1: [TÍTULO DE LA CLASE 1] (Duración: XX min)
* **Momento 1: Inicio (Apertura y Motivación - 15 min)**
  - *Disparador:* [Pregunta problematizadora, video breve, objeto concreto, imagen impactante o relato].
  - *Indagación de saberes previos:* [Preguntas guía exactas para el intercambio áulico].
* **Momento 2: Desarrollo (Construcción y Andamiaje - 50 min)**
  - *Explicación / Modelado Docente:* [Puntos conceptuales clave explicados con claridad didáctica].
  - *Actividad de los Alumnos (Individual / Grupal):* [Consignas paso a paso, ejercicios prácticos, lectura guiada o experimentación].
* **Momento 3: Cierre (Metacognición y Puesta en Común - 15 min)**
  - *Síntesis colectiva:* [Socialización de producciones, conclusiones en pizarrón o ticket de salida].
  - *Pregunta metacognitiva:* "¿Qué aprendimos hoy y cómo lo logramos?".
* **Recursos y Materiales:** [Lista de útiles, fotocopias, láminas, materiales de laboratorio o TIC].

### 🔹 CLASE 2: [TÍTULO DE LA CLASE 2] (Duración: XX min)
* **Momento 1: Inicio (Recuperación y Enlace - 15 min)**
* **Momento 2: Desarrollo (Profundización y Aplicación - 50 min)**
* **Momento 3: Cierre (Evaluación Formativa - 15 min)**
* **Recursos y Materiales:** [...]

### 🔹 CLASE 3: [TÍTULO DE LA CLASE 3 - INTEGRACIÓN O PRODUCCIÓN FINAL]
* **Momento 1: Inicio**
* **Momento 2: Desarrollo**
* **Momento 3: Cierre**

---

## 5. 🧩 CONFIGURACIONES DE APOYO DUA & EDUCACIÓN ESPECIAL (INCLUSIÓN)
* **Principio 1 (Compromiso):** [Estrategias para sostener el interés, motivación y autorregulación].
* **Principio 2 (Representación):** [Apoyo visual con pictogramas ARASAAC, organizadores gráficos, lectura fácil y material concreto].
* **Principio 3 (Acción y Expresión):** [Opciones flexibles de entrega y formatos adaptados].
* **Ajustes para Estudiantes con TEA / PPI:** [Paso a paso explícito, anticipación temporal y apoyos específicos].

---

## 6. 📊 EVALUACIÓN INTEGRAL (CRITERIOS, INSTRUMENTOS Y RÚBRICA)

### 🎯 Criterios de Evaluación (Indicadores de Avance Observables):
1. **Dimensión Conceptual:** [Capacidad de definir, explicar y relacionar los conceptos centrales de la UC].
2. **Dimensión Procedimental:** [Destreza en la aplicación de los procedimientos, resolución de consignas y uso de herramientas].
3. **Dimensión Actitudinal:** [Participación activa, escucha respetuosa, compromiso con la tarea y cooperación grupal].

### 📋 Instrumentos de Evaluación Utilizados:
* **Instrumento Formativo Continuo:** [Lista de cotejo, registro de observación directa y ticket de salida metacognitivo].
* **Instrumento Sumativo / De Proceso:** [Rúbrica analítica y carpeta de trabajos / portfolio del estudiante].

### 📊 Rúbrica Analítica de Desempeño:

| Criterio de Evaluación | Inicial (En Inicio) | En Proceso | Logrado (Satisfactorio) | Destacado (Avanzado) |
| :--- | :--- | :--- | :--- | :--- |
| **Comprensión Conceptual (Saber)** | Reconoce nociones aisladas con asistencia continua. | Identifica los conceptos centrales con apoyos guiados. | Explica y relaciona los conceptos centrales con autonomía. | Aplica los conceptos a situaciones nuevas con juicio crítico y rigor. |
| **Procedimiento y Aplicación (Saber Hacer)** | Requiere modelado constante paso a paso. | Resuelve consignas básicas con intervención docente ocasional. | Ejecuta las actividades y procedimientos correctamente siguiendo la consigna. | Propone soluciones creativas, fundamenta sus procedimientos y ayuda a pares. |
| **Participación y Actitud (Saber Ser / Convivir)** | Participación pasiva o con dificultad para integrarse. | Participa en actividades grupales con mediación docente. | Colabora activamente respetando las normas y aportes del grupo. | Lidera positivamente, demuestra autonomía, empatía y compromiso ético. |

---
💡 *Consejo Docente NORA:* Puedes descargar esta secuencia completa en formato **Word (.docx)** o **PDF** haciendo clic en los botones de exportación al pie de este mensaje para llevarla directamente a tu carpeta pedagógica o presentarla a dirección escolar.
`;
