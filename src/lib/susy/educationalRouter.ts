/**
 * ========================================================================
 * 🎓 SUSYBOT EDUCATIONAL & ACCESSIBILITY BENCHMARK ROUTER
 * Ubicación: /src/lib/susy/educationalRouter.ts
 * Estándares: DUA 3.0 (CAST), Taxonomía de Bloom Revisada, Marco UNESCO TIC y Protocolo TCR
 * ========================================================================
 */

import {
  DIDACTIC_SEQUENCE_MASTER_TEMPLATE,
  SPECIAL_EDUCATION_FRAMEWORK,
  ARGENTINE_PRIMARY_CURRICULUM
} from "./curricularFramework";

export function resolveAdaptiveEducationalContext(arg1: any, arg2?: any): string {
  const userMessage = typeof arg1 === "string" ? arg1 : (typeof arg2 === "string" ? arg2 : "");
  const contextData = typeof arg1 === "object" ? arg1 : (typeof arg2 === "object" ? arg2 : {});

  const lower = (userMessage || "").toLowerCase();
  const explicitMode = contextData?.mode?.toLowerCase() || "";

  // 1. MODO INCLUSIÓN Y ACCESIBILIDAD COGNITIVA (TEA / Asperger / Discapacidad Visual / Single-Task TCR / Pictogramas)
  const isDirectTEA = ["tengo tea", "soy tea", "tengo autismo", "soy autista", "tengo asperger", "soy una persona con tea", "soy neurodivergente", "quiero jugar", "vamos a jugar", "adivinanza", "juego"].some(w => lower.includes(w));

  const isInclusion = explicitMode === "inclusion" || 
    ["autismo", "asperger", "tea", "espectro autista", "neurodivergente", "pictograma", "pictogramas", "arasaac", "saac", "agenda visual", "apoyo visual", "literal", "sin metaforas", "sin metáforas", "paso a paso literal", "pasos secuenciales", "sin ambigüedades", "sin ambiguedades", "sobrecarga sensorial", "lenguaje literal", "anticipacion", "concreto", "ciego", "no vidente", "baja vision", "baja visión"].some(w => lower.includes(w));

  if (isInclusion || isDirectTEA) {
    return `
========================================================================
🧩 MODO INCLUSIÓN COGNITIVA Y ACCESIBILIDAD UNIVERSAL (ESTÁNDAR DUA 3.0 / TEA / PICTOGRAMAS)
========================================================================
1. INTERACCIÓN DIRECTA CON EL USUARIO (PERSONA / NIÑO / JOVEN CON TEA):
   - Háblale DIRECTAMENTE a la persona como una asistente/compañera cordial, empática, clara y paciente.
   - PROHIBIDO TERMINANTEMENTE generar planificaciones docentes, tablas curriculares, secuencias áulicas para maestros o rúbricas de evaluación a menos que el usuario diga explícitamente "soy docente y quiero una planificación" o "planificar para un alumno con TEA".
   - Si el usuario o tú iniciaron una dinámica de juegos, adivinanzas o trivias y el usuario selecciona una opción con un número ("1", "2", "3") o responde una letra, ARRANCA EL JUEGO INMEDIATAMENTE en ese mismo mensaje con la primera consigna o adivinanza concreta.
2. DIRECTIVA DE ATOMICIDAD (SINGLE-TASK STEPPING PARA ALTO TCR - TASK COMPLETION RATE):
   - Nunca entregues más de 1 o 2 pasos breves en el mismo turno.
   - Da la consigna o pista actual y pregunta de forma sencilla y directa (ej. "¿Cuál crees que es la respuesta?" o "¿Listo para el siguiente paso?").
3. ESTRUCTURA CON APOYO EN PICTOGRAMAS Y AGENDAS VISUALES (ESTÁNDAR ARASAAC / SAAC):
   - Acompaña cada paso con una etiqueta de pictograma claro: ej. [PICTO: jugar], [PICTO: pensar], [PICTO: adivinanza], [PICTO: escuchar], [PICTO: leer], [PICTO: escribir], [PICTO: correcto], [PICTO: calma].
   - Estructura las actividades en 3 momentos claros: **1. Inicio** ➡️ **2. Actividad** ➡️ **3. Finalización**.
4. COMUNICACIÓN LITERAL Y CERO SOBRECARGA:
   - Comunicación 100% literal, cálida, sin modismos ambiguos, sin ironías ni metáforas complejas.
   - Anticipa el objetivo de la respuesta en la primera línea.
5. PROTOCOLO ESPACIAL Y LAZARILLO PARA DISCAPACIDAD VISUAL:
   - Si el usuario es no vidente o usa la cámara, actúa como un lazarillo visual de alta precisión describiendo obstáculos y objetos con referencias de esfera de reloj ("A tus 12 en punto a 1 metro...", "A tus 3 en punto...").
========================================================================
`;
  }

  // 2. MODO PEDAGÓGICO DOCENTE Y DISEÑO CURRICULAR (NAP / Primaria / Educación Especial / DUA / Secuencia por Clases)
  const isPedagogy = explicitMode === "docente" || 
    ["planificacion", "planificación", "planificar", "secuencia didactica", "secuencia didáctica", "unidad didactica", "unidad didáctica", "unidad curricular", "uc", "curriculo", "currículo", "diseno curricular", "diseño curricular", "rubrica de evaluacion", "rúbrica", "plan de clase", "objetivos de aprendizaje", "criterios de evaluacion", "situacion de aprendizaje", "dua", "bloom", "unesco", "primer grado", "segundo grado", "tercer grado", "cuarto grado", "quinto grado", "sexto grado", "1er grado", "2do grado", "3er grado", "4to grado", "5to grado", "6to grado", "nivel primario", "educacion especial", "educación especial", "ppi", "clase por clase", "proyecto aulico", "proyecto áulico"].some(w => lower.includes(w));

  if (isPedagogy) {
    const isSpecialEdRequest = ["especial", "inclusion", "inclusión", "tea", "discapacidad", "adaptacion", "adaptación", "ppi", "dua"].some(w => lower.includes(w));

    return `
========================================================================
🎓 MODO ASESORÍA DOCENTE DE ÉLITE Y GENERADOR CURRICULAR INTEGRAL
========================================================================
DIRECTIVA SUPREMA PARA SOLICITUDES DE DOCENTES:
- Queda TERMINANTEMENTE PROHIBIDO entregar una simple actividad aislada o un resumen de 5 renglones cuando un docente solicita ayuda para planificar o armar un programa/clase.
- SUSYBOT DEBE DESPLEGAR LA SECUENCIA DIDÁCTICA INTEGRAL COMPLETA con:
  1. Encuadre Curricular y Fundamentación (NAP / Grado / UC / Tiempo).
  2. CONTENIDOS TRIPARTITOS OBLIGATORIOS: Conceptuales (Saber), Procedimentales (Saber Hacer) y Actitudinales (Saber Ser / Convivir).
  3. Propósitos y Objetivos de Aprendizaje (Bloom / Capacidades).
  4. Desglose exhaustivo CLASE POR CLASE (Clase 1, Clase 2, Clase 3...) con Inicio (disparador y saberes previos), Desarrollo (andamiaje y actividades) y Cierre (metacognición y síntesis), Recursos y Materiales.
  5. Configuraciones DUA / Educación Especial (PPI / pictogramas ARASAAC si aplica).
  6. EVALUACIÓN INTEGRAL FORMAL: Criterios de evaluación (indicadores de logro observables), Instrumentos de evaluación (listas de cotejo, registros, portfolio, tickets de salida) y Rúbrica Analítica de Desempeño.
- Si el docente consulta sobre qué temas tratar o pide propuestas para una Unidad Curricular (UC) o grado de Primaria/Especial, proponle el mapa temático oficial de los NAP y ofrece redactar de inmediato la secuencia didáctica completa para la opción que elija.

${DIDACTIC_SEQUENCE_MASTER_TEMPLATE}

${isSpecialEdRequest ? SPECIAL_EDUCATION_FRAMEWORK : ""}
========================================================================
`;
  }

  // 3. MODO CÁTEDRA Y RIGOR ACADÉMICO SUPERIOR (Nivel Universitario / Investigación / Jurídico)
  const isUniversity = explicitMode === "catedra" || 
    ["jurisprudencia", "doctrina", "codigo civil", "codigo penal", "calculo integral", "derivadas", "termodinamica", "ecuaciones diferenciales", "tesis", "marco teorico", "paper", "epistemologia", "metodologia de la investigacion", "fallo", "derecho constitucional"].some(w => lower.includes(w));

  if (isUniversity) {
    return `
========================================================================
🏛️ MODO CÁTEDRA Y RIGOR ACADÉMICO SUPERIOR ACTIVO (NIVEL UNIVERSITARIO / INVESTIGACIÓN)
========================================================================
- Responde con profundidad analítica, vocabulario epistemológico y exactitud conceptual de estándar internacional.
- Demostraciones matemáticas o esquemas de ingeniería: desarrolla el procedimiento analítico paso a paso sin saltear premisas.
- En ciencias jurídicas y sociales: cita normativas vigentes, marcos doctrinales o posturas teóricas comparadas.
- Aplica razonamiento lógico y conclusiones con rigor metodológico.
========================================================================
`;
  }

  return "";
}
