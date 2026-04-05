/**
 * Guías educativas para cada algoritmo de planificación de CPU.
 * Basadas en la explicación de la Práctica 2 de ISO – UNLP.
 *
 * Claves: coinciden exactamente con los IDs de ALGORITHMS en index.js
 *   fcfs | sjf | srtf | rr-variable | rr-fixed | priority-np | priority-p
 */

const guides = {
  /* ═══════════════════════════════════════════════════════════════
     FIFO / FCFS
     ═══════════════════════════════════════════════════════════════ */
  fcfs: {
    name: 'FIFO / FCFS',
    fullName: 'First Come, First Served',
    emoji: '🚶‍♂️',
    type: 'No Expulsivo',
    summary:
      'El algoritmo más simple de planificación. Los procesos se atienden estrictamente en el orden en que llegan a la cola de listos. Una vez que un proceso obtiene la CPU, la mantiene hasta que termina su ráfaga completa de CPU (Tcpu).',

    concepts: [
      { term: 'Tcpu', def: 'Tiempo total que el proceso necesita la CPU (también llamado burst de CPU).' },
      { term: 'TR (Retorno)', def: 'Tiempo desde que el proceso llega hasta que termina. Fórmula: TR = T_finalización − T_llegada.' },
      { term: 'TE (Espera)', def: 'Tiempo en el sistema sin ejecutar. Fórmula: TE = TR − Tcpu.' },
      { term: 'No Expulsivo', def: 'El proceso en CPU NO puede ser interrumpido. Conserva la CPU hasta terminar.' },
    ],

    howItWorks: [
      'Los procesos ingresan a la cola de listos (Ready Queue) según su tiempo de llegada.',
      'El planificador siempre toma el primer proceso de la cola (el que llegó antes).',
      'Ese proceso ejecuta su Tcpu completo sin interrupciones.',
      'Cuando termina, la CPU queda libre y se toma el siguiente de la cola.',
      'Si no hay procesos listos, la CPU queda idle (ociosa) hasta que llegue uno.',
    ],

    tieBreaking:
      'Si dos procesos llegan al mismo tiempo, se desempata por menor PID.',

    advantages: [
      'El más simple de implementar y entender — ideal para sistemas batch.',
      'Sin overhead: no hay cambios de contexto durante la ejecución de un proceso.',
      'Justo en sentido estricto: respeta el orden de llegada siempre.',
      'Predecible: podés calcular exactamente cuándo va a ejecutar cada proceso.',
    ],

    disadvantages: [
      'Efecto Convoy: procesos cortos quedan "atrapados" detrás de procesos largos, inflando el TE de todos.',
      'Tiempo de espera promedio (TPE) generalmente alto si los Tcpu son muy distintos.',
      'No apto para sistemas interactivos ni de tiempo compartido.',
      'No considera la prioridad ni la urgencia de los procesos.',
    ],

    example: {
      processes: 'P1(Ll=0, Tcpu=6), P2(Ll=2, Tcpu=2), P3(Ll=3, Tcpu=1)',
      execution: 'P1 ejecuta de 0 a 6 → P2 de 6 a 8 → P3 de 8 a 9',
      analysis:
        'P2 llegó en t=2 y esperó 4 unidades (de t=2 a t=6) para ejecutar solo 2. P3 llegó en t=3 y esperó 5 unidades para ejecutar solo 1. El TPE es (0+4+5)/3 = 3. Con SJF sería mucho menor porque los procesos cortos irían primero.',
    },

    examTips: [
      'FCFS suele ser el "caso base" en parciales: te piden comparar su TPE con otros algoritmos para justificar cuál es mejor.',
      'El efecto convoy es un concepto que aparece seguido en preguntas teóricas. Ejemplo clásico: un proceso de Tcpu=100 seguido de 10 procesos de Tcpu=1.',
      'Si dos procesos llegan en el mismo instante, recordá desempatar por PID (menor PID primero).',
    ],

    realWorld:
      'Se usa en colas de impresión, procesamiento batch (mainframes) y cualquier sistema donde importa más respetar el orden que minimizar tiempos. No se usa en sistemas operativos modernos para procesos interactivos.',

    keyQuestion: '¿Por qué FCFS puede dar un TPE muy alto? → Por el efecto convoy: procesos cortos esperan detrás de largos innecesariamente.',
  },

  /* ═══════════════════════════════════════════════════════════════
     SJF
     ═══════════════════════════════════════════════════════════════ */
  sjf: {
    name: 'SJF',
    fullName: 'Shortest Job First (Trabajo Más Corto Primero)',
    emoji: '⚡',
    type: 'No Expulsivo',
    summary:
      'Cuando la CPU queda libre, selecciona de la cola de listos el proceso con menor Tcpu (ráfaga de CPU). Es óptimo entre los algoritmos no expulsivos en cuanto a tiempo de espera promedio (TPE). Sin embargo, el proceso que está ejecutando NO puede ser interrumpido.',

    concepts: [
      { term: 'Óptimo (NE)', def: 'SJF da el menor TPE posible entre todos los algoritmos no expulsivos.' },
      { term: 'Starvation', def: 'Un proceso largo puede esperar indefinidamente si siguen llegando procesos cortos.' },
      { term: 'Estimación de Tcpu', def: 'En un sistema real, no se conoce el Tcpu de antemano. Se estima con promedios exponenciales de ráfagas anteriores.' },
    ],

    howItWorks: [
      'Cuando la CPU se libera, se revisan todos los procesos que ya llegaron a la cola de listos.',
      'Se selecciona el que tiene MENOR Tcpu (burst de CPU).',
      'Ese proceso ejecuta su Tcpu completo sin ser interrumpido (es no expulsivo).',
      'Si mientras ejecuta llega un proceso con Tcpu menor, NO lo interrumpe — para eso está SRTF.',
      'Cuando termina, se vuelve a evaluar la cola.',
    ],

    tieBreaking:
      'Si hay empate en Tcpu: primero el de menor tiempo de llegada, luego el de menor PID.',

    advantages: [
      'Minimiza el TPE entre los algoritmos no expulsivos — es matemáticamente óptimo.',
      'Mejora significativamente el throughput respecto a FCFS cuando hay mezcla de procesos cortos y largos.',
      'Reduce el efecto convoy: los procesos cortos ya no esperan detrás de los largos.',
    ],

    disadvantages: [
      'Starvation (inanición): procesos con Tcpu alto pueden esperar para siempre si siguen llegando procesos cortos.',
      'Requiere conocer el Tcpu de antemano — en la práctica esto no es posible, solo se estima.',
      'No es justo: discrimina sistemáticamente a los procesos con mayor Tcpu.',
      'No es expulsivo: si arrancó un proceso largo, no se puede interrumpir aunque llegue uno cortísimo.',
    ],

    example: {
      processes: 'P1(Ll=0, Tcpu=7), P2(Ll=2, Tcpu=4), P3(Ll=4, Tcpu=1), P4(Ll=5, Tcpu=4)',
      execution: 'P1 ejecuta de 0-7 (estaba solo). En t=7 están listos P2(4), P3(1), P4(4). Elige P3(1) → 7-8. Luego P2(4) → 8-12. Luego P4(4) → 12-16.',
      analysis:
        'P3 (el más corto) ejecutó rápido a pesar de llegar después. TR: P1=7, P2=10, P3=4, P4=11. TE: P1=0, P2=6, P3=3, P4=7. TPE=4. Con FCFS el TPE sería 5.5.',
    },

    examTips: [
      'Pregunta clásica: "¿SJF puede causar starvation?" → SÍ. Si llegan procesos cortos constantemente, los largos nunca ejecutan.',
      'No confundas SJF con SRTF: SJF NO interrumpe al proceso en ejecución. SRTF sí.',
      'Para resolver ejercicios: cuando la CPU se libera, ORDENÁ por Tcpu entre los que ya llegaron. No compares con el que está ejecutando.',
      'SJF solo es óptimo comparado con otros NO expulsivos. SRTF (expulsivo) puede dar mejor TPE.',
    ],

    realWorld:
      'No se implementa directamente en SO modernos porque requiere conocer el Tcpu. Se usa como referencia teórica para evaluar la calidad de otros algoritmos. En la práctica, los SO estiman el próximo burst con promedios exponenciales: τ(n+1) = α·t(n) + (1−α)·τ(n).',

    keyQuestion: '¿Por qué SJF es óptimo en NE? → Porque al ejecutar primero los procesos cortos, el tiempo de espera acumulado de todos los demás es el mínimo posible.',
  },

  /* ═══════════════════════════════════════════════════════════════
     SRTF
     ═══════════════════════════════════════════════════════════════ */
  srtf: {
    name: 'SRTF',
    fullName: 'Shortest Remaining Time First (Menor Tiempo Restante)',
    emoji: '⚡',
    type: 'Expulsivo',
    summary:
      'La versión EXPULSIVA de SJF. En cada instante de tiempo, si llega un nuevo proceso cuyo Tcpu es menor que el tiempo RESTANTE del proceso actual, lo expulsa y toma la CPU. Nota: se compara con el tiempo restante, NO con el Tcpu original.',

    concepts: [
      { term: 'Expulsivo', def: 'El proceso en CPU PUEDE ser interrumpido si llega uno con menor tiempo restante.' },
      { term: 'Tiempo restante', def: 'Tcpu original − tiempo ya ejecutado. Es lo que falta para terminar, no el burst original.' },
      { term: 'Óptimo absoluto', def: 'SRTF minimiza el TPE globalmente (mejor que SJF y cualquier otro algoritmo).' },
      { term: 'Cambio de contexto', def: 'Cada vez que se expulsa un proceso, hay overhead por guardar/restaurar su estado.' },
    ],

    howItWorks: [
      'En cada tick (instante de tiempo), se evalúa si hay un nuevo proceso listo.',
      'Se compara el TIEMPO RESTANTE del proceso actual con el Tcpu de los recién llegados.',
      'Si algún proceso listo tiene menor tiempo restante → EXPULSA al actual.',
      'El proceso expulsado vuelve a la cola de listos con su tiempo restante actualizado.',
      'Se reevalúa continuamente: en cada tick puede haber un cambio.',
    ],

    tieBreaking:
      'Si hay empate en tiempo restante: menor tiempo de llegada, luego menor PID. Un proceso en ejecución NO tiene preferencia sobre uno nuevo con igual remaining.',

    advantages: [
      'Óptimo absoluto: da el menor TPE posible entre TODOS los algoritmos de planificación.',
      'Responde inmediatamente a procesos cortos que llegan: no tienen que esperar al largo.',
      'Ideal cuando los tiempos de ráfaga son muy variables.',
    ],

    disadvantages: [
      'Mayor overhead por cambios de contexto frecuentes (puede expulsar en cada tick).',
      'Starvation severa: procesos largos pueden ser infinitamente postergados.',
      'Requiere conocer (o estimar) el Tcpu restante en cada instante — más difícil que SJF.',
      'Más complejo de implementar que SJF.',
    ],

    example: {
      processes: 'P1(Ll=0, Tcpu=8), P2(Ll=1, Tcpu=4), P3(Ll=2, Tcpu=2)',
      execution: 't=0: P1 arranca (restante=8). t=1: llega P2 (Tcpu=4). Restante P1=7. Como 4<7, P2 expulsa a P1. t=2: llega P3 (Tcpu=2). Restante P2=3. Como 2<3, P3 expulsa a P2. t=4: P3 termina. Vuelve P2 (restante=3) → t=7. Vuelve P1 (restante=7) → t=14.',
      analysis:
        '¡CUIDADO! En t=1, se compara 4 (Tcpu de P2) contra 7 (RESTANTE de P1, no 8). En t=2, se compara 2 (Tcpu de P3) contra 3 (RESTANTE de P2). Siempre se usa el tiempo RESTANTE del actual.',
    },

    examTips: [
      '⚠️ ERROR MÁS COMÚN: Comparar con el Tcpu original en vez del tiempo restante. P1 empezó con Tcpu=8 pero si ya ejecutó 3 ticks, su restante es 5, NO 8.',
      'SRTF solo re-evalúa cuando LLEGA un proceso nuevo. Si no llega nadie nuevo, el actual sigue ejecutando.',
      'Pregunta de parcial: "¿Cuándo SRTF se comporta igual que SJF?" → Cuando todos los procesos llegan en t=0 (no hay llegadas intermedias que generen expulsiones).',
      'Para resolver: en cada tick donde llega un proceso, compará su Tcpu con el restante del actual. Si es menor o igual (con desempate), expulsa.',
    ],

    realWorld:
      'Es teórico — ningún SO real lo implementa puro porque requiere conocer los Tcpu futuros. Se usa como benchmark: "¿qué tan cerca está mi algoritmo del óptimo?" Si tu algoritmo tiene un TPE cercano al de SRTF, es bueno.',

    keyQuestion: '¿Cuál es la diferencia clave entre SJF y SRTF? → SJF compara Tcpu cuando la CPU se LIBERA. SRTF compara RESTANTE cuando LLEGA un proceso nuevo.',
  },

  /* ═══════════════════════════════════════════════════════════════
     ROUND ROBIN – TIMER VARIABLE
     ═══════════════════════════════════════════════════════════════ */
  'rr-variable': {
    name: 'Round Robin – Timer Variable',
    fullName: 'Round Robin con Quantum y Timer que se reinicia',
    emoji: '🔄',
    type: 'Expulsivo',
    summary:
      'Cada proceso recibe un Quantum (Q) de tiempo de CPU. Si no termina en Q unidades, se lo expulsa y va al final de la cola de listos. La clave del Timer Variable: cada vez que un proceso ENTRA a la CPU, el timer se resetea a Q. Si un proceso termina antes del quantum, el siguiente recibe un quantum COMPLETO nuevo.',

    concepts: [
      { term: 'Quantum (Q)', def: 'Cantidad máxima de unidades de tiempo que un proceso puede usar la CPU antes de ser expulsado.' },
      { term: 'Timer Variable', def: 'El timer se REINICIA cada vez que un nuevo proceso entra a la CPU. El siguiente siempre arranca con Q completo.' },
      { term: 'Context Switch', def: 'Cambio de contexto: guardar el estado del proceso actual y cargar el del siguiente. Genera overhead.' },
      { term: 'Tiempo de respuesta', def: 'Tiempo desde que un proceso llega hasta que ejecuta su primera instrucción. RR lo minimiza vs FCFS/SJF.' },
    ],

    howItWorks: [
      'Los procesos se encolan en orden de llegada (FIFO) en la Ready Queue.',
      'El primero de la cola recibe un quantum COMPLETO de Q unidades de CPU.',
      'Si el proceso TERMINA antes de Q → la CPU se libera. El siguiente proceso recibe un Q COMPLETO nuevo (el timer se reinicia).',
      'Si el proceso NO termina en Q → es expulsado y va al FINAL de la cola de listos, con su tiempo restante actualizado.',
      'Los procesos que llegan en el mismo tick que ocurre la expropiación ingresan a la cola ANTES que el proceso expropiado (el expropiado va al final).',
      'Se repite hasta que todos los procesos terminan.',
    ],

    tieBreaking:
      'Orden FIFO en la cola. Si llegan varios al mismo tick, se encolan por menor PID. El proceso expropiado va DESPUÉS de los recién llegados.',

    advantages: [
      'JUSTO: todos los procesos reciben tiempo de CPU periódicamente — no hay starvation.',
      'Buen tiempo de respuesta: ideal para sistemas interactivos y de tiempo compartido.',
      'Simple de implementar: solo necesita una cola circular y un timer.',
      'Predecible: cada proceso sabe que ejecutará al menos cada N·Q unidades (N = cantidad de procesos).',
    ],

    disadvantages: [
      'Si Q es muy grande → degenera en FCFS (pierde las ventajas de RR).',
      'Si Q es muy pequeño → demasiados cambios de contexto, mucho overhead.',
      'El TPE puede ser alto comparado con SJF/SRTF.',
      'La elección del Q es crítica y depende del tipo de carga del sistema.',
    ],

    example: {
      processes: 'P1(Ll=0, Tcpu=5), P2(Ll=1, Tcpu=3), P3(Ll=2, Tcpu=2). Q=2',
      execution: 't=0-2: P1 ejecuta 2 (restante=3), se expulsa. t=2-4: P2 ejecuta 2 (restante=1). t=4-6: P3 ejecuta 2 y TERMINA. t=6: El timer se REINICIA → P1 recibe Q=2 completo → t=6-8 (restante=1). t=8-9: P2 ejecuta 1 y TERMINA — como terminó antes de Q, el timer se reinicia. t=9-10: P1 ejecuta 1 y TERMINA.',
      analysis:
        'Fijate que cuando P3 termina en t=6, el timer se reinicia y P1 recibe un Q completo de 2. Esto es lo que lo hace "Variable": el quantum no depende de un reloj global.',
    },

    examTips: [
      '🔑 Diferencia con Timer Fijo: en Variable, si un proceso termina en la mitad del quantum, el SIGUIENTE arranca con Q completo. En Fijo, solo le queda lo que sobra del intervalo.',
      'Los procesos nuevos que llegan en el mismo tick de la expropiación entran a la cola ANTES que el expropiado.',
      'Si el enunciado dice solo "Round Robin" sin especificar, generalmente se refiere a Timer Variable.',
      'Pregunta clásica: "¿Cuál es el valor óptimo de Q?" → Depende del sistema, pero una regla empírica es que el 80% de las ráfagas de CPU deben ser menores que Q.',
    ],

    realWorld:
      'Es la base de los planificadores modernos. Linux usa CFS (Completely Fair Scheduler) que es una evolución sofisticada de Round Robin. Windows usa un algoritmo multinivel con feedback basado en RR. Los SO reales usan Q entre 10-100 milisegundos.',

    keyQuestion: '¿Qué pasa si Q → ∞? → Degenera en FCFS. ¿Y si Q → 0? → Se pasa todo el tiempo cambiando contexto y no ejecuta nada útil.',
  },

  /* ═══════════════════════════════════════════════════════════════
     ROUND ROBIN – TIMER FIJO
     ═══════════════════════════════════════════════════════════════ */
  'rr-fixed': {
    name: 'Round Robin – Timer Fijo',
    fullName: 'Round Robin con Quantum y Timer de Reloj de Pared',
    emoji: '⏰',
    type: 'Expulsivo',
    summary:
      'Similar al Round Robin estándar, PERO con una diferencia crucial: el timer funciona como un "reloj de pared" que genera interrupciones en intervalos fijos (Q, 2Q, 3Q, 4Q…) independientemente de lo que pase en la CPU. Si un proceso termina antes del intervalo, el siguiente solo usa lo que SOBRA hasta la próxima interrupción.',

    concepts: [
      { term: 'Reloj de Pared', def: 'El timer NO se reinicia al cambiar de proceso. Las interrupciones son en múltiplos fijos: t=Q, 2Q, 3Q, etc.' },
      { term: 'Intervalo de reloj', def: 'El espacio entre dos interrupciones consecutivas. Siempre es de tamaño Q, medido desde el tick 0.' },
      { term: 'Tick de interrupción', def: 'Los puntos fijos donde el reloj "suena": t=Q, t=2Q, t=3Q, etc.' },
      { term: 'Diferencia con Variable', def: 'En Variable el timer se reinicia con cada proceso. En Fijo, el timer corre independiente de la CPU.' },
    ],

    howItWorks: [
      'Se define un reloj global con interrupciones en t = Q, 2Q, 3Q, 4Q… (múltiplos del quantum).',
      'Cuando un proceso entra a la CPU, solo puede ejecutar hasta la PRÓXIMA interrupción del reloj (no necesariamente Q unidades).',
      'Si un proceso termina ANTES de la interrupción → el siguiente entra, pero solo puede usar lo que SOBRA del intervalo actual.',
      'Cuando el reloj llega al siguiente múltiplo de Q, se re-evalúa: si hay más de un proceso, el actual va al final de la cola.',
      'Esto genera "sub-quantums": un proceso puede ejecutar menos de Q si entró a mitad de un intervalo.',
    ],

    tieBreaking:
      'Misma regla: orden FIFO. Los recién llegados se encolan antes que el expropiado.',

    advantages: [
      'Más simple de implementar en hardware: el timer de interrupción es un simple contador periódico.',
      'Predecible: las interrupciones siempre son en los mismos ticks, sin importar qué proceso esté en la CPU.',
      'Más cercano a cómo funciona el hardware real (el chip PIT genera interrupciones periódicas).',
    ],

    disadvantages: [
      'Algunos procesos reciben "sub-quantums" (menos de Q) si entran a mitad de un intervalo.',
      'Generalmente da un TPE peor que Timer Variable porque se desperdician fracciones de quantum.',
      'Puede generar segmentos de ejecución muy cortos e ineficientes.',
      'Más difícil de resolver en los ejercicios de la práctica — hay que estar atento al reloj global.',
    ],

    example: {
      processes: 'P1(Ll=0, Tcpu=5), P2(Ll=0, Tcpu=3). Q=3. Interrupciones en t=3, 6, 9…',
      execution: 't=0-3: P1 ejecuta 3 (restante=2). Interrupción en t=3 → P1 va al fondo. t=3-6: P2 ejecuta 3 y TERMINA en t=6. Interrupción en t=6 → P1 vuelve. t=6-8: P1 ejecuta 2 y TERMINA en t=8.',
      analysis:
        'En este caso, ambos obtuvieron intervalos completos. Pero mirá este otro caso: P1(Tcpu=4), P2(Tcpu=3), Q=3. P1 ejecuta de 0-3 (interrupción), P2 entra de 3-6 y termina en t=6. P1 vuelve de 6-7 y termina. Todo bien. ¿Pero qué pasa si P1 tiene Tcpu=2? P1 termina en t=2. P2 entra en t=2 pero el reloj suena en t=3 → P2 solo ejecuta 1 unidad antes de la interrupción.',
    },

    examTips: [
      '⚠️ Esta es la "TRAMPA CLÁSICA" de parcial. Si dice "Timer Fijo" o "Reloj de Pared", los resultados son MUY distintos al Timer Variable.',
      'TRUCO PARA RESOLVER: Dibujá una recta numérica y marcá los ticks de interrupción (Q, 2Q, 3Q…). Después asigná procesos respetando esos puntos de corte.',
      'Si un proceso termina en t=5 y el reloj es Q=3 (interrupciones en 3, 6, 9…), el siguiente proceso solo tiene hasta t=6, es decir 1 unidad.',
      'La fórmula para calcular cuánto puede ejecutar un proceso que entra en t: puede ejecutar hasta el próximo múltiplo de Q, es decir: Q − (t mod Q) unidades.',
    ],

    realWorld:
      'Es lo más cercano a la realidad del hardware. El chip PIT (Programmable Interval Timer) del PC genera interrupciones a intervalos regulares (ej: cada 10ms). El SO no "reinicia" este timer cuando cambia de proceso — simplemente reacciona a la siguiente interrupción.',

    keyQuestion: '¿Cuánto tiempo tiene un proceso que entra a la CPU en el tick t? → Tiene Q − (t mod Q) unidades hasta la próxima interrupción del reloj.',
  },

  /* ═══════════════════════════════════════════════════════════════
     PRIORIDADES – NO EXPULSIVO
     ═══════════════════════════════════════════════════════════════ */
  'priority-np': {
    name: 'Prioridades (No Expulsivo)',
    fullName: 'Planificación por Prioridades – No Expulsivo',
    emoji: '🏆',
    type: 'No Expulsivo',
    summary:
      'Cada proceso tiene un número de prioridad. Cuando la CPU se libera, se selecciona el proceso con MAYOR prioridad (menor número, según la convención de la cátedra ISO-UNLP: prioridad 1 > prioridad 5). Una vez que el proceso obtiene la CPU, NO puede ser interrumpido aunque llegue uno más prioritario.',

    concepts: [
      { term: 'Prioridad', def: 'Número asignado a cada proceso. En ISO-UNLP: MENOR número = MAYOR prioridad (1 es más urgente que 5).' },
      { term: 'Starvation', def: 'Inanición: procesos de baja prioridad pueden esperar indefinidamente si siempre hay procesos más prioritarios.' },
      { term: 'Aging (Envejecimiento)', def: 'Solución a la starvation: aumentar gradualmente la prioridad de procesos que llevan mucho tiempo esperando.' },
      { term: 'Prioridad estática vs dinámica', def: 'Estática: no cambia. Dinámica: puede cambiar durante la ejecución (ej: con aging).' },
    ],

    howItWorks: [
      'Cada proceso tiene una prioridad numérica asignada (menor número = más prioritario).',
      'Cuando la CPU se libera, se revisan todos los procesos en la cola de listos.',
      'Se selecciona el de MENOR número de prioridad (el más urgente).',
      'Ese proceso ejecuta su Tcpu COMPLETO sin interrupciones — es no expulsivo.',
      'Aunque en medio de su ejecución llegue un proceso de prioridad 1 (máxima), NO se interrumpe al actual.',
      'Cuando el actual termina, recién ahí se reevalúa y se elige el más prioritario de los listos.',
    ],

    tieBreaking:
      'Si hay empate en prioridad: menor tiempo de llegada primero, luego menor PID.',

    advantages: [
      'Permite diferenciar procesos por importancia real del sistema.',
      'Procesos críticos (prioridad alta) son atendidos antes que los de mantenimiento.',
      'Menos overhead que la versión expulsiva (no hay cambios de contexto innecesarios).',
      'Simple de implementar: solo necesita ordenar la cola por prioridad.',
    ],

    disadvantages: [
      'Starvation (inanición): el problema más grave. Procesos de baja prioridad pueden NUNCA ejecutar.',
      'No aprovecha la llegada de procesos urgentes — si hay uno de prioridad 5 ejecutando y llega uno de prioridad 1, el de prioridad 1 tiene que esperar.',
      'Puede generar tiempos de espera impredecibles para procesos de baja prioridad.',
      'La asignación de prioridades es subjetiva y puede ser injusta.',
    ],

    example: {
      processes: 'P1(Ll=0, Tcpu=6, Prior=3), P2(Ll=1, Tcpu=3, Prior=1), P3(Ll=2, Tcpu=4, Prior=2)',
      execution: 't=0: Solo P1 (prior 3), arranca. t=1: Llega P2 (prior 1, MÁS urgente) pero NO expulsa — es no expulsivo → P2 espera. t=2: Llega P3 (prior 2). t=6: P1 termina. En cola: P2(prior 1), P3(prior 2). Elige P2 → t=6-9. Luego P3 → t=9-13.',
      analysis:
        'P2 tiene la mayor prioridad (1), pero tuvo que esperar a que P1 termine completamente. En la versión expulsiva, P2 hubiera expulsado a P1 en t=1.',
    },

    examTips: [
      'En ISO-UNLP, SIEMPRE menor número = mayor prioridad. Si el ejercicio no lo aclara, usá esta convención.',
      'Pregunta frecuente: "¿Cómo se soluciona la starvation en prioridades?" → Con envejecimiento (aging): cada X unidades de tiempo, se incrementa la prioridad de los procesos que esperan.',
      'No confundas con prioridades expulsivo: acá el proceso en CPU NUNCA se interrumpe.',
      'Si dos procesos tienen misma prioridad, funciona como FCFS entre ellos (desempate por llegada).',
    ],

    realWorld:
      'Se usa para procesos del kernel (alta prioridad) vs procesos de usuario (baja prioridad). En Unix/Linux, los procesos tienen "nice values" (-20 a +19) que determinan su prioridad. Los procesos del sistema suelen tener nice negativo (alta prioridad).',

    keyQuestion: '¿Cuál es la diferencia clave entre Prioridades NE y Prioridades Expulsivo? → En NE, un proceso de prioridad 5 que está ejecutando NO puede ser sacado por uno de prioridad 1 que llega. En Expulsivo, sí.',
  },

  /* ═══════════════════════════════════════════════════════════════
     PRIORIDADES – EXPULSIVO
     ═══════════════════════════════════════════════════════════════ */
  'priority-p': {
    name: 'Prioridades (Expulsivo)',
    fullName: 'Planificación por Prioridades – Expulsivo (Preemptive)',
    emoji: '🏆',
    type: 'Expulsivo',
    summary:
      'Igual que prioridades no expulsivo, pero con una diferencia fundamental: si en cualquier momento llega un proceso con MAYOR prioridad (menor número) que el que está ejecutando, el actual es EXPULSADO inmediatamente y el nuevo toma la CPU.',

    concepts: [
      { term: 'Expulsión por prioridad', def: 'El proceso actual es desalojado de la CPU cuando llega uno MÁS prioritario (con menor número).' },
      { term: 'Reevaluación', def: 'En cada tick donde llega un proceso nuevo, se compara su prioridad con la del actual.' },
      { term: 'Starvation', def: 'Más severa que en NE: los procesos de baja prioridad se postergan indefinidamente.' },
      { term: 'Comparación con SRTF', def: 'SRTF expulsa por tiempo RESTANTE. Prioridades Expulsivo expulsa por PRIORIDAD. Son criterios distintos.' },
    ],

    howItWorks: [
      'Cada proceso tiene una prioridad numérica (menor número = más prioritario).',
      'En cada tick donde LLEGA un proceso nuevo, se compara su prioridad con la del actual en CPU.',
      'Si el nuevo tiene MAYOR prioridad (menor número) → EXPULSA al actual inmediatamente.',
      'El proceso expulsado vuelve a la cola de listos con su tiempo restante actualizado.',
      'Si no hay llegadas nuevas, el proceso actual sigue ejecutando normalmente.',
      'Si el nuevo tiene IGUAL prioridad que el actual, NO se expulsa (el actual tiene preferencia).',
    ],

    tieBreaking:
      'Si tienen misma prioridad: el que está en CPU NO es expulsado. Entre los de la cola, desempata menor llegada → menor PID.',

    advantages: [
      'Respuesta INMEDIATA a procesos urgentes — no tienen que esperar a que termine el actual.',
      'Ideal para sistemas de tiempo real donde las prioridades son críticas (ej: sistema de frenado ABS).',
      'Maximiza la atención a procesos importantes del sistema.',
    ],

    disadvantages: [
      'Starvation SEVERA: peor que en no expulsivo. Los procesos de baja prioridad pueden no ejecutar nunca.',
      'Más cambios de contexto que la versión no expulsiva → mayor overhead.',
      'Más complejo de implementar y de resolver en ejercicios.',
      'Puede generar muchos segmentos de ejecución cortos (fragmentación temporal).',
    ],

    example: {
      processes: 'P1(Ll=0, Tcpu=6, Prior=3), P2(Ll=2, Tcpu=3, Prior=1), P3(Ll=4, Tcpu=2, Prior=2)',
      execution: 't=0-2: P1 ejecuta 2 (restante=4). t=2: Llega P2 (prior 1). Prior 1 < prior 3 → EXPULSA a P1. t=2-5: P2 ejecuta 3 y TERMINA. t=5: En cola: P1(prior 3, restante=4), P3(prior 2, llegó en t=4). P3 es más prioritario → t=5-7: P3 ejecuta y TERMINA. t=7-11: P1 retoma y ejecuta sus 4 restantes.',
      analysis:
        'P1 fue expulsado por P2 (más prioritario) y después también fue postergado por P3. El TR de P1 es 11, cuando sin expulsiones hubiera sido 6. La prioridad tiene un costo para los procesos menos urgentes.',
    },

    examTips: [
      'A diferencia de SRTF, acá se compara PRIORIDAD, no tiempo restante. Un proceso de prioridad 1 con Tcpu=100 expulsa a uno de prioridad 2 con remaining=1.',
      'Solo se reevalúa cuando LLEGA un proceso nuevo. Si no llega nadie, el actual sigue sin importar su prioridad.',
      'Si el nuevo tiene IGUAL prioridad que el actual → NO hay expulsión (el que ya está en CPU se queda).',
      'Pregunta de parcial: "¿Qué pasa si todos los procesos tienen la misma prioridad?" → Se comporta como FCFS (no expulsivo al no haber nadie con mayor prioridad para expulsar).',
      'Para comparar con NE: hacé el mismo ejercicio con ambos modos y mostrá las diferencias en TR y TE. Esto es lo que más aparece en los parciales.',
    ],

    realWorld:
      'Usado en sistemas operativos de tiempo real (RTOS) como FreeRTOS, VxWorks. Ejemplos: el sistema de control de un auto (ABS, airbags) usa prioridad máxima para tareas de seguridad. También en Linux con SCHED_FIFO o SCHED_RR para procesos de tiempo real.',

    keyQuestion: '¿Cuándo conviene Expulsivo sobre No Expulsivo? → Cuando hay procesos urgentes que NO pueden esperar (tiempo real, sistemas críticos). Si no hay urgencias, NE tiene menos overhead.',
  },
};

export default guides;
