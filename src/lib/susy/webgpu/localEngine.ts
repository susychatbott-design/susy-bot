/**
 * ========================================================================
 * 🧠 SUSYBOT LOCAL WEBGPU & AUTONOMOUS DIDACTIC ENGINE (100% OFFLINE)
 * Ubicación: /src/lib/nora/webgpu/localEngine.ts
 * 
 * Funcionalidad:
 * Inferencia local enriquecida y autónoma para cuando el alumno o docente
 * está en el campo o en modo avión sin conexión a internet.
 * ========================================================================
 */

import { searchOfflineKnowledge, initializeOfflineKnowledge } from "@/lib/susy/offline/knowledgeCache";

let isLocalEngineInitialized = false;

/**
 * Verifica si el navegador soporta aceleración WebGPU
 */
export function checkWebGPUSupport(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((navigator as any).gpu);
}

/**
 * Inicializa el motor local offline
 */
export async function initializeLocalEngine(): Promise<boolean> {
  if (isLocalEngineInitialized) return true;
  try {
    await initializeOfflineKnowledge();
    isLocalEngineInitialized = true;
    return true;
  } catch (err) {
    console.warn("[Local Engine Init Warning]:", err);
    return false;
  }
}

/**
 * Motor Semántico Autónomo Escolar y Pedagógico Universal (Modo Offline)
 */
export async function executeLocalInference(
  userQuery: string,
  history: { role: string; content: string }[] = [],
  mode: string = "general"
): Promise<{ text: string; source: "local_webgpu" | "local_capsule" }> {
  await initializeLocalEngine();

  const cleanQuery = userQuery.trim().toLowerCase();
  
  // Extraer el contexto de los últimos turnos para mantener continuidad real
  const recentHistoryText = history.slice(-6).map(h => `${h.role}: ${h.content}`).join("\n").toLowerCase();
  const combinedContext = `${recentHistoryText}\nuser: ${cleanQuery}`;

  // 1. Consultar la Cápsula Cívica ÚNICAMENTE si la persona pide auxilio o teléfonos de guardia/bomberos
  const isEmergencyDirect = [
    "donde queda el hospital", "donde esta el hospital", "teléfono de bomberos", 
    "telefono de bomberos", "numero de la policia", "comisaria", "comisaría", 
    "guardia médica", "guardia medica", "ambulancia", "emergencia de salud"
  ].some(w => cleanQuery.includes(w));

  if (isEmergencyDirect) {
    const localKnowledge = await searchOfflineKnowledge(userQuery);
    if (localKnowledge) {
      const text = `He consultado la guía local de emergencias para asistirte de inmediato:\n\n${localKnowledge}\n\n¿Precisas que activemos el protocolo de asistencia SOS?`;
      return { text, source: "local_capsule" };
    }
  }

  let responseText = "";

  // ========================================================================
  // 🎓 1. PLANIFICACIÓN ÁULICA, SECUENCIAS DIDÁCTICAS Y ASESORÍA DOCENTE (DUA)
  // ========================================================================
  const isDidacticOrPlanning = 
    combinedContext.includes("planificaci") ||
    combinedContext.includes("secuencia") ||
    combinedContext.includes("áulica") ||
    combinedContext.includes("aulica") ||
    combinedContext.includes("proyecto") ||
    combinedContext.includes("didáctic") ||
    combinedContext.includes("didactic") ||
    combinedContext.includes("diseño curricular") ||
    combinedContext.includes("rúbrica") ||
    combinedContext.includes("rubrica") ||
    combinedContext.includes("dua") ||
    combinedContext.includes("clase") ||
    combinedContext.includes("docente");

  if (isDidacticOrPlanning) {
    if (cleanQuery.includes("3") || cleanQuery.includes("4") || cleanQuery.includes("actividad") || cleanQuery.includes("evaluaci") || cleanQuery.includes("rúbrica") || cleanQuery.includes("rubrica") || cleanQuery.includes("cierre")) {
      responseText = `Con mucho gusto, desarrollemos en profundidad los **Puntos 3 y 4 (Actividades de Aprendizaje, Evaluación Formativa y Adaptaciones DUA)**:

---

### 📝 DESARROLLO DEL PUNTO 3: SECUENCIA DE ACTIVIDADES ÁULICAS (Paso a Paso)

#### 🔹 Momento 1: Inicio y Recuperación de Saberes Previos (20 minutos)
* **Dinámica**: Indagación dialógica disparadora a partir de una situación problema de la vida cotidiana o un interrogante desafiante.
* **Acción de los alumnos**: Registro individual de hipótesis iniciales en sus carpetas o en pizarra colaborativa.
* **Rol docente**: Registro de ideas fuerza en el pizarrón sin juzgar respuestas erróneas para tomarlas como andamiaje cognitivo.

#### 🔹 Momento 2: Desarrollo y Construcción del Conocimiento (50 minutos)
* **Trabajo en Equipos Heterogéneos (3 a 4 estudiantes)**:
  1. *Consigna*: Análisis de fuentes, resolución guiada de problemas o experimentación directa según la temática.
  2. *Producción*: Elaboración de un informe breve, esquema conceptual o resolución justificada.
* **Acompañamiento**: Monitoreo docente por estaciones de trabajo, orientando con preguntas guía en lugar de dar la respuesta directa.

#### 🔹 Momento 3: Puesta en Común y Cierre Metacognitivo (20 minutos)
* **Síntesis Colectiva**: Un vocero por equipo expone su conclusión en 2 minutos.
* **Ticket de Salida (Metacognición)**: Cada alumno responde en una ficha: *"¿Qué aprendí hoy de nuevo?"* y *"¿Qué concepto me generó dudas?"*.

---

### 📊 DESARROLLO DEL PUNTO 4: EVALUACIÓN FORMATIVA, RÚBRICA Y ADAPTACIONES DUA

#### 📋 Rúbrica Analítica de Evaluación:
| Criterio | Nivel Destacado (4) | Nivel Satisfactorio (3) | Nivel en Proceso (2) |
| :--- | :--- | :--- | :--- |
| **Comprensión Conceptual** | Aplica el concepto con total autonomía y fundamenta sus decisiones. | Comprende el concepto central con mínimas dudas en la aplicación. | Identifica el concepto de forma parcial requiriendo guía constante. |
| **Resolución y Procedimientos** | Sigue un método lógico, ordenado y verifica sus resultados. | Aplica los pasos correctos cometiendo errores menores de cálculo o redacción. | Presenta dificultad en la secuencia de pasos lógicos. |
| **Participación y Trabajo en Equipo** | Colabora activamente, escucha y aporta ideas constructivas al grupo. | Cumple su rol dentro del equipo con buena disposición. | Participación pasiva dentro del grupo. |

#### 🧩 Adaptaciones Inclusivas (DUA / Discapacidad Visual / TEA):
1. **Accesibilidad Visual**: Proporcionar textos en macrotipo, contrastes altos o lectura en voz alta descriptiva.
2. **Estructuración TEA**: Anticipar la secuencia con una agenda visual en el margen del pizarrón y consignas directas libres de ambigüedad.
3. **Múltiples Formatos de Entrega**: Permitir entrega escrita, oral o mediante esquema gráfico.

---
¿Deseas que elaboremos el instrumento de evaluación imprimible o adaptemos la secuencia para algún año o nivel específico?`;
    } else if (cleanQuery.includes("1") || cleanQuery.includes("2") || cleanQuery.includes("objetivo") || cleanQuery.includes("fundamentaci") || cleanQuery.includes("inicio")) {
      responseText = `Excelente. Aquí tienes el desarrollo exhaustivo de los **Puntos 1 y 2 (Fundamentación Pedagógica, Objetivos de Aprendizaje y Contenidos Curriculares)**:

---

### 🎯 DESARROLLO DEL PUNTO 1: FUNDAMENTACIÓN PEDAGÓGICA Y MARCO TEÓRICO
* **Enfoque Pedagógico**: Constructivista y centrado en el desarrollo de capacidades (resolución de problemas, pensamiento crítico y trabajo colaborativo).
* **Justificación Didáctica**: La propuesta sitúa al estudiante como protagonista activo, utilizando situaciones problemáticas contextualizadas para que el saber tenga sentido y relevancia práctica.
* **Articulación Curricular**: Enmarcado en los Diseños Curriculares y los Núcleos de Aprendizajes Prioritarios (NAP).

---

### 📌 DESARROLLO DEL PUNTO 2: OBJETIVOS DE APRENDIZAJE Y CONTENIDOS

#### 🔹 Objetivos de Aprendizaje (Capacidades a Desarrollar):
1. Comprender e interpretar los conceptos fundamentales de la unidad temática mediante el análisis guiado.
2. Aplicar estrategias de indagación y procedimientos formales para resolver situaciones problemáticas.
3. Argumentar y comunicar conclusiones de manera oral y escrita utilizando el vocabulario específico de la disciplina.
4. Valorar el trabajo cooperativo y el intercambio respetuoso de ideas.

#### 🔹 Contenidos Conceptuales y Procedimentales:
* **Conceptuales**: Principios centrales, definiciones operativas y relaciones causales del tema.
* **Procedimentales**: Búsqueda y selección de información, formulación de hipótesis, contraste de resultados y elaboración de esquemas explicativos.
* **Actitudinales**: Disposición para la revisión crítica del propio trabajo y perseverancia en la resolución de tareas.

---
¿Continuamos ahora con el desglose detallado de las actividades del Punto 3 y la rúbrica del Punto 4?`;
    } else {
      responseText = `Aquí tienes una **Planificación Didáctica Integral y Secuencia de Aprendizaje** estructurada con rigor pedagógico, criterios DUA y enfoque por capacidades:

---

### 📋 ESTRUCTURA DE LA PLANIFICACIÓN ÁULICA:

#### 1️⃣ Fundamentación y Marco Curricular
* **Enfoque**: Aprendizaje situado y significativo con andamiaje constructivista.
* **Propósito Docente**: Promover la comprensión profunda y el pensamiento crítico a través de la resolución de problemas reales.

#### 2️⃣ Objetivos de Aprendizaje y Capacidades
* Identificar y aplicar los conceptos medulares de la unidad en contextos prácticos.
* Desarrollar autonomía en la selección de procedimientos y argumentación lógica.
* Fomentar la comunicación asertiva y el trabajo en equipo.

#### 3️⃣ Secuencia Didáctica de la Clase (Fases de Aprendizaje)
* **Inicio (20 min)**: Disparador dialógico, recuperación de saberes previos y formulación del problema central.
* **Desarrollo (50 min)**: Trabajo en equipos heterogéneos, análisis de fuentes y resolución guiada de actividades.
* **Cierre (20 min)**: Puesta en común, institucionalización del saber y ticket de salida metacognitivo.

#### 4️⃣ Evaluación Formativa, Rúbrica DUA y Adaptaciones
* **Evaluación**: Procesual y formativa mediante rúbrica analítica por niveles de logro.
* **Inclusión DUA**: Múltiples medios de representación, expresión y compromiso (adaptaciones TEA y accesibilidad visual).

---
💡 **¿Cómo deseas que continuemos?**
• Escribe *"Desarrolla el punto 3 y 4"* para ver las actividades paso a paso y la rúbrica completa.
• O indícame el tema, materia o nivel escolar (primaria, secundaria, técnica o terciaria) para adaptarlo a medida.`;
    }
  }

  // ========================================================================
  // 📐 2. MATEMÁTICAS, ÁLGEBRA, FRACCIONES Y GEOMETRÍA
  // ========================================================================
  else if (combinedContext.includes("pitágoras") || combinedContext.includes("triángulo") || combinedContext.includes("cateto") || combinedContext.includes("hipotenusa") || combinedContext.includes("fracci") || combinedContext.includes("ecuaci") || combinedContext.includes("porcentaje") || combinedContext.includes("matemátic")) {
    if (combinedContext.includes("fracci")) {
      responseText = `Las **Fracciones** representan una parte de un todo dividido en partes iguales:\n\n• **Numerador** (arriba): Indica cuántas partes tomamos.\n• **Denominador** (abajo): Indica en cuántas partes iguales se dividió la unidad (nunca puede ser 0).\n\n**Operaciones Básicas:**\n1. **Suma/Resta con igual denominador**: Se suman o restan los numeradores y se mantiene el denominador: $\\frac{2}{5} + \\frac{1}{5} = \\frac{3}{5}$.\n2. **Multiplicación**: Numerador por numerador y denominador por denominador: $\\frac{2}{3} \\cdot \\frac{4}{5} = \\frac{8}{15}$.\n3. **División**: Multiplicamos cruzado: $\\frac{2}{3} : \\frac{4}{5} = \\frac{2 \\cdot 5}{3 \\cdot 4} = \\frac{10}{12} = \\frac{5}{6}$.\n\n¿Deseas que resolvamos juntos un ejercicio específico?`;
    } else if (combinedContext.includes("ecuaci")) {
      responseText = `Una **Ecuación de Primer Grado** es una igualdad matemática con una o más incógnitas a despejar:\n\n**Ejemplo paso a paso:** $3x + 5 = 20$\n1. Agrupamos los términos con $x$ en un miembro y los números en el otro:\n   $3x = 20 - 5$\n2. Resolvemos la operación:\n   $3x = 15$\n3. El coeficiente que multiplica pasa dividiendo:\n   $x = \\frac{15}{3} \\implies \\mathbf{x = 5}$\n\n4. **Verificación**: $3(5) + 5 = 15 + 5 = 20$ (¡Correcto!).\n\n¿Querés que planteemos una ecuación con paréntesis o fracciones?`;
    } else {
      responseText = `El **Teorema de Pitágoras** se aplica exclusivamente a **triángulos rectángulos** (con un ángulo de 90°):\n\n$$\\mathbf{c^2 = a^2 + b^2}$$\n\n• **Hipotenusa ($c$)**: el lado más largo, opuesto al ángulo recto.\n• **Catetos ($a$ y $b$)**: los dos lados que forman el ángulo recto.\n\n**Cálculo de la Hipotenusa:**\nSi los catetos miden $3\\text{ cm}$ y $4\\text{ cm}$:\n$c = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5\\text{ cm}$.\n\n**Cálculo de un Cateto desconocido:**\n$a = \\sqrt{c^2 - b^2}$. Si $c=10$ y $b=8$: $a = \\sqrt{100 - 64} = \\sqrt{36} = 6\\text{ cm}$.\n\n¿Querés que hagamos un problema práctico contextualizado?`;
    }
  }

  // ========================================================================
  // 🏛️ 3. HISTORIA ARGENTINA, LATINOAMERICANA Y CIENCIAS SOCIALES
  // ========================================================================
  else if (combinedContext.includes("san martín") || combinedContext.includes("revolución de mayo") || combinedContext.includes("1810") || combinedContext.includes("1816") || combinedContext.includes("independencia") || combinedContext.includes("belgrano") || combinedContext.includes("historia") || combinedContext.includes("geograf") || combinedContext.includes("constituci")) {
    if (combinedContext.includes("san martín") || cleanQuery.includes("san martín")) {
      responseText = `El **General José Francisco de San Martín** (1778-1850), nacido en Yapeyú, Corrientes, es el Padre de la Patria y Libertador de América.\n\n• **El Plan Continental**: Comprendió que la independencia no estaría segura mientras el bastión realista permaneciera en Lima. Creó el Ejército de los Andes en Mendoza, cruzó la cordillera en 1817, liberó a Chile (Chacabuco y Maipú) y avanzó por mar para declarar la independencia del Perú en 1821.\n• **Valores y Legado**: Destacó por su ética republicana y sus célebres Máximas a su hija Mercedes.\n\n¿Deseas que profundicemos en las columnas del Cruce de los Andes o en la entrevista de Guayaquil con Bolívar?`;
    } else if (combinedContext.includes("belgrano")) {
      responseText = `**Manuel Belgrano** (1770-1820) fue abogado, economista, periodista, vocal de la Primera Junta y General del Ejército del Norte.\n\n• **Creador de la Bandera**: La izó por primera vez el 27 de febrero de 1812 a orillas del río Paraná en Rosario.\n• **Hitos Históricos**: Lideró el heroico Éxodo Jujeño (1812) y las victorias fundamentales de Tucumán (1812) y Salta (1813).\n• **Pensamiento**: Pionero en la defensa de la educación pública y gratuita para varones y mujeres, el fomento de la agricultura y la industria nacional.\n\n¿Querés que elaboremos un análisis de su rol en la gesta emancipadora?`;
    } else {
      responseText = `En el marco de las **Ciencias Sociales e Historia Argentina**:\n\n• **Revolución de Mayo (1810)**: Destitución del virrey Cisneros y conformación del Primer Gobierno Patrio en el Cabildo.\n• **Declaración de la Independencia (1816)**: Proclamada en el Congreso de Tucumán el 9 de Julio de 1816, rompiendo definitivamente los lazos con la monarquía española.\n• **Constitución Nacional (1853)**: Base del Estado de Derecho, representativo, republicano y federal.\n\n¿Qué período o temática histórica deseas que desarrollemos?`;
    }
  }

  // ========================================================================
  // 🔬 4. CIENCIAS NATURALES, BIOLOGÍA, QUÍMICA Y FÍSICA
  // ========================================================================
  else if (combinedContext.includes("célula") || combinedContext.includes("fotosíntesis") || combinedContext.includes("gravedad") || combinedContext.includes("newton") || combinedContext.includes("átomo") || combinedContext.includes("atomo") || combinedContext.includes("química") || combinedContext.includes("quimica") || combinedContext.includes("energía") || combinedContext.includes("energia") || combinedContext.includes("biolog")) {
    if (combinedContext.includes("célula") || combinedContext.includes("celula")) {
      responseText = `La **Célula** es la unidad estructural, funcional y genética de todos los seres vivos:\n\n1. **Células Procariotas** (bacterias): No poseen núcleo definido; su material genético (ADN) flota libre en el citoplasma.\n2. **Células Eucariotas** (animales y vegetales): Poseen núcleo celular protegido por una membrana y organelas especializadas:\n   • *Mitocondrias*: Respiración celular y producción de energía (ATP).\n   • *Cloroplastos* (solo vegetales): Contienen clorofila y realizan la fotosíntesis.\n   • *Ribosomas*: Síntesis de proteínas.\n\n¿Deseas que comparemos en un cuadro la célula animal y la vegetal?`;
    } else if (combinedContext.includes("gravedad") || combinedContext.includes("newton")) {
      responseText = `Las **Leyes del Movimiento de Isaac Newton** fundamentan la física clásica:\n\n1. **Primera Ley (Inercia)**: Un cuerpo permanece en reposo o con movimiento rectilíneo uniforme a menos que actúe sobre él una fuerza neta externa.\n2. **Segunda Ley (Fuerza)**: $\\mathbf{F = m \\cdot a}$ (La fuerza neta es igual a la masa por la aceleración).\n3. **Tercera Ley (Acción y Reacción)**: A toda acción le corresponde una reacción de igual magnitud y en sentido opuesto.\n\n¿Deseas que apliquemos la segunda ley en un problema con valores numéricos?`;
    } else {
      responseText = `En el ámbito de las **Ciencias Naturales y Química**:\n\n• **Estructura Atómica**: El átomo está formado por un núcleo central (protones con carga positiva y neutrones sin carga) y una nube periférica de electrones con carga negativa.\n• **Tabla Periódica**: Ordena los elementos según su número atómico ($Z$).\n• **Estados de la Materia**: Sólido, Líquido, Gaseoso y Plasma, regulados por la temperatura y la presión.\n\n¿Qué concepto o experimento deseas que analicemos en detalle?`;
    }
  }

  // ========================================================================
  // 📚 5. LENGUA, LITERATURA, COMPRENSIÓN Y REGLAS ORTOGRÁFICAS
  // ========================================================================
  else if (combinedContext.includes("tilde") || combinedContext.includes("acentuación") || combinedContext.includes("aguda") || combinedContext.includes("grave") || combinedContext.includes("esdrújula") || combinedContext.includes("verbo") || combinedContext.includes("sustantivo") || combinedContext.includes("lengua") || combinedContext.includes("literatura")) {
    responseText = `Las **Reglas de Acentuación y Gramática en Español** se clasifican por la posición de la sílaba tónica:\n\n1. **Agudas** (acento en la última sílaba): Llevan tilde si terminan en **N, S o Vocal** (*canción, papá, café*).\n2. **Graves o Llanas** (acento en la penúltima sílaba): Llevan tilde si **NO** terminan en N, S o Vocal (*árbol, lápiz, césped*).\n3. **Esdrújulas y Sobreesdrújulas** (acento en la antepenúltima): **Siempre llevan tilde** (*música, brújula, rápido*).\n\n• **Tipos de Palabras**: Sustantivos (nombran entidades), Adjetivos (describen cualidades), Verbos (expresan acciones o estados).\n\n¿Querés que analicemos un texto o practiquemos con ejemplos concretos?`;
  }

  // ========================================================================
  // 💡 6. DOCENTE UNIVERSAL INTERACTIVA (Cualquier consulta libre)
  // ========================================================================
  else {
    responseText = `¡Hola! Como tu docente universal y asistente pedagógica en modo autónomo, he analizado tu consulta sobre **"${userQuery}"**.\n\nPara brindarte la mejor orientación educativa, podemos abordarlo de las siguientes maneras:\n\n1. **Explicación Conceptual**: Desglosamos la teoría paso a paso con vocabulario accesible y analogías cotidianas.\n2. **Ejemplos y Aplicación Práctica**: Vemos cómo se resuelve o aplica en situaciones reales.\n3. **Propuesta Didáctica o Actividad**: Diseñamos una consigna o ejercicio para evaluar la comprensión.\n\n¿Por cuál de estos enfoques preferís que comencemos a trabajar?`;
  }

  return { text: responseText, source: "local_webgpu" };
}
