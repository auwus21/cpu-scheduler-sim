import { pidNum } from './fcfs.js';

/**
 * Round Robin - Dos variantes:
 *
 * TIMER VARIABLE:
 *   Cuando un proceso entra a la CPU, su quantum empieza a contar desde 0.
 *   Si llega un proceso nuevo mientras la CPU ejecuta, no interrumpe hasta
 *   que se agote el quantum actual.
 *   El proceso preemptado vuelve al final de la cola.
 *
 * TIMER FIJO (Periódico):
 *   Hay interrupciones globales a intervalos fijos: 0, Q, 2Q, 3Q...
 *   Cuando llega una interrupción, si hay otro proceso listo → expulsión.
 *   Si un proceso entra en el tick 1 con Q=4, la próxima int. es en tick 4 (no 5).
 */

export function roundRobin(processes, quantum, timerType = 'variable') {
  if (timerType === 'fixed') {
    return rrFixed(processes, quantum);
  }
  return rrVariable(processes, quantum);
}

function rrVariable(processes, quantum) {
  const procs = processes.map(p => ({
    ...p,
    remaining: p.burst,
    done: false,
    finish: 0,
  }));

  // Ordenamos inicialmente por llegada, luego por PID
  const queue = [];
  const arrived = new Set();
  const gantt = [];
  let time = 0;
  let completed = 0;
  const n = procs.length;
  let quantumLeft = 0;
  let current = null;
  let segStart = 0;

  const allSorted = [...procs].sort((a, b) => a.arrival - b.arrival || pidNum(a.pid) - pidNum(b.pid));

  // Encolar todos los procesos que llegaron en un intervalo de tiempo
  function enqueueArrivals(t) {
    for (const p of allSorted) {
      if (p.arrival <= t && !arrived.has(p.pid) && !p.done) {
        arrived.add(p.pid);
        queue.push(p);
      }
    }
  }

  enqueueArrivals(0);

  while (completed < n) {
    if (queue.length === 0 && !current) {
      // CPU inactiva
      if (current) {
        gantt.push({ pid: current.pid, start: segStart, end: time });
        current = null;
      }
      const nextArrival = allSorted.find(p => !p.done && !arrived.has(p.pid));
      if (!nextArrival) break;
      time = nextArrival.arrival;
      enqueueArrivals(time);
      continue;
    }

    if (!current) {
      current = queue.shift();
      segStart = time;
      quantumLeft = quantum;
    }

    // Ejecutar un tick de ciclo de reloj
    current.remaining--;
    quantumLeft--;
    time++;

    // Comprobar ingresos nuevos en el tiempo actual
    enqueueArrivals(time);

    if (current.remaining === 0) {
      // Proceso terminado
      current.done = true;
      current.finish = time;
      gantt.push({ pid: current.pid, start: segStart, end: time });
      current = null;
    } else if (quantumLeft === 0) {
      // Quantum expirado, expulsar al proceso hacia el final de la cola
      gantt.push({ pid: current.pid, start: segStart, end: time });
      queue.push(current);
      current = null;
    }
  }

  if (current) {
    gantt.push({ pid: current.pid, start: segStart, end: time });
  }

  const metrics = procs.map(p => ({
    pid: p.pid,
    arrival: p.arrival,
    burst: p.burst,
    priority: p.priority,
    finish: p.finish,
    turnaround: p.finish - p.arrival,
    waitTime: p.finish - p.arrival - p.burst,
  }));

  return { gantt: mergeGantt(gantt), metrics };
}

/**
 * Timer Fijo: interrupciones en 0, Q, 2Q, 3Q...
 * En cada interrupción, si hay proceso esperando → expulsar actual.
 */
function rrFixed(processes, quantum) {
  const procs = processes.map(p => ({
    ...p,
    remaining: p.burst,
    done: false,
    finish: 0,
  }));

  const queue = [];
  const arrived = new Set();
  const gantt = [];
  let time = 0;
  let completed = 0;
  const n = procs.length;
  let current = null;
  let segStart = 0;

  // Próximo tick de interrupción global
  let nextInterrupt = quantum;

  const allSorted = [...procs].sort((a, b) => a.arrival - b.arrival || pidNum(a.pid) - pidNum(b.pid));

  function enqueueArrivals(t) {
    for (const p of allSorted) {
      if (p.arrival <= t && !arrived.has(p.pid) && !p.done) {
        arrived.add(p.pid);
        queue.push(p);
      }
    }
  }

  enqueueArrivals(0);

  while (completed < n) {
    if (queue.length === 0 && !current) {
      const nextArr = allSorted.find(p => !p.done && !arrived.has(p.pid));
      if (!nextArr) break;
      time = nextArr.arrival;
      enqueueArrivals(time);
      // Avanzar la próxima interrupción para cubrir el agujero de inactividad actual
      while (nextInterrupt <= time) nextInterrupt += quantum;
      continue;
    }

    if (!current && queue.length > 0) {
      current = queue.shift();
      segStart = time;
    }

    // Ejecutar ininterrumpidamente hasta que el proceso termine O se lance la interrupción global
    const ticksToInterrupt = nextInterrupt - time;
    const ticksToFinish = current.remaining;
    const ticks = Math.min(ticksToFinish, ticksToInterrupt);

    current.remaining -= ticks;
    time += ticks;
    enqueueArrivals(time);

    if (current.remaining === 0) {
      current.done = true;
      current.finish = time;
      gantt.push({ pid: current.pid, start: segStart, end: time });
      current = null;
      completed++;
    }

    // Si chocamos contra la interrupción global del algoritmo
    if (time === nextInterrupt) {
      nextInterrupt += quantum;
      if (current && queue.length > 0) {
        // Expulsar proceso por fin de ciclo
        gantt.push({ pid: current.pid, start: segStart, end: time });
        queue.push(current);
        current = null;
      }
    }
  }

  if (current) {
    gantt.push({ pid: current.pid, start: segStart, end: time });
  }

  const metrics = procs.map(p => ({
    pid: p.pid,
    arrival: p.arrival,
    burst: p.burst,
    priority: p.priority,
    finish: p.finish,
    turnaround: p.finish - p.arrival,
    waitTime: p.finish - p.arrival - p.burst,
  }));

  return { gantt: mergeGantt(gantt), metrics };
}

function mergeGantt(gantt) {
  if (!gantt.length) return [];
  const merged = [{ ...gantt[0] }];
  for (let i = 1; i < gantt.length; i++) {
    const last = merged[merged.length - 1];
    if (last.pid === gantt[i].pid && last.end === gantt[i].start) {
      last.end = gantt[i].end;
    } else {
      merged.push({ ...gantt[i] });
    }
  }
  return merged;
}
