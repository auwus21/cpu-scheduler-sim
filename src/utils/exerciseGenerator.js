/**
 * Generador de ejercicios aleatorios para el modo práctica.
 * Produce un set de procesos + algoritmo según dificultad.
 * Soporta generación de eventos I/O para dificultades media y difícil.
 */

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

const RESOURCES = ['R1', 'R2', 'R3'];

const DIFFICULTIES = {
  easy: {
    label: 'Fácil',
    count: 3,
    maxArrival: 1,
    minBurst: 2,
    maxBurst: 5,
    algorithms: ['fcfs', 'sjf'],
    ioChance: 0,       // sin I/O en nivel fácil
    maxIOEvents: 0,
  },
  medium: {
    label: 'Medio',
    count: 4,
    maxArrival: 3,
    minBurst: 3,
    maxBurst: 8,
    algorithms: ['fcfs', 'sjf', 'srtf', 'rr-variable'],
    ioChance: 0.5,      // 50% prob. por proceso
    maxIOEvents: 1,
  },
  hard: {
    label: 'Difícil',
    count: 5,
    maxArrival: 5,
    minBurst: 4,
    maxBurst: 10,
    algorithms: ['srtf', 'rr-variable', 'rr-fixed', 'priority-np', 'priority-p'],
    ioChance: 0.7,      // 70% prob. por proceso
    maxIOEvents: 2,
  },
};

/**
 * Genera eventos I/O aleatorios para un proceso específico.
 * @param {number} burst - Ráfaga de CPU total del proceso
 * @param {number} maxEvents - Límite máximo de eventos I/O a tolerar
 * @returns {Array} ioEvents [{resource, afterCpuTick, duration}]
 */
function generateIOEvents(burst, maxEvents) {
  if (burst <= 2 || maxEvents <= 0) return [];

  const events = [];
  const usedTicks = new Set();
  const numEvents = randInt(1, maxEvents);

  for (let i = 0; i < numEvents; i++) {
    // afterCpuTick debe figurar entre 1 y la ráfaga restante - 1 para prevenir colapsos terminales
    let tick;
    let attempts = 0;
    do {
      tick = randInt(1, burst - 1);
      attempts++;
    } while (usedTicks.has(tick) && attempts < 20);

    if (usedTicks.has(tick)) continue;
    usedTicks.add(tick);

    events.push({
      resource: pick(RESOURCES),
      afterCpuTick: tick,
      duration: randInt(1, 2),
    });
  }

  // Ordenado por orden de ocurrencia durante la ráfaga
  events.sort((a, b) => a.afterCpuTick - b.afterCpuTick);
  return events;
}

export function generateExercise(difficulty = 'medium') {
  const cfg = DIFFICULTIES[difficulty];
  const processes = [];

  for (let i = 0; i < cfg.count; i++) {
    const burst = randInt(cfg.minBurst, cfg.maxBurst);
    const hasIO = Math.random() < cfg.ioChance;

    processes.push({
      pid: `P${i + 1}`,
      arrival: i === 0 ? 0 : randInt(0, cfg.maxArrival),
      burst,
      priority: randInt(1, cfg.count),
      ioEvents: hasIO ? generateIOEvents(burst, cfg.maxIOEvents) : [],
    });
  }

  // Ordenar en orden de llegada por prolixidad
  processes.sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));

  const algorithm = pick(cfg.algorithms);
  const quantum = algorithm.startsWith('rr') ? randInt(2, 4) : 2;

  return { processes, algorithm, quantum, difficulty };
}

export { DIFFICULTIES };
