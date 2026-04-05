import { pidNum } from './fcfs.js';

/**
 * Planificación por Prioridades
 * Menor número = mayor prioridad (convención de la cátedra ISO-UNLP)
 *
 * MODO NO EXPULSIVO: cuando la CPU queda libre, elige el de mayor prioridad.
 *   Una vez ejecutando, no se interrumpe aunque llegue uno de mayor prioridad.
 *
 * MODO EXPULSIVO: en cada tick, si llega un proceso con mayor prioridad
 *   que el actual, lo expulsa inmediatamente.
 *
 * Desempate dentro de igual prioridad: menor arrival → menor PID
 */
export function priority(processes, preemptive = false) {
  if (preemptive) return priorityPreemptive(processes);
  return priorityNonPreemptive(processes);
}

function priorityNonPreemptive(processes) {
  const procs = processes.map(p => ({ ...p, done: false }));
  const gantt = [];
  const metrics = {};
  let time = 0;
  let completed = 0;
  const n = procs.length;

  while (completed < n) {
    const ready = procs.filter(p => p.arrival <= time && !p.done);

    if (ready.length === 0) {
      const next = procs.filter(p => !p.done).sort((a, b) => a.arrival - b.arrival)[0];
      time = next.arrival;
      continue;
    }

    // Elige la mayor prioridad (número más bajo), empate: llegada, pid
    ready.sort((a, b) =>
      a.priority - b.priority ||
      a.arrival - b.arrival ||
      pidNum(a.pid) - pidNum(b.pid)
    );
    const p = ready[0];

    const start = time;
    const end = time + p.burst;
    gantt.push({ pid: p.pid, start, end });
    metrics[p.pid] = {
      pid: p.pid,
      arrival: p.arrival,
      burst: p.burst,
      priority: p.priority,
      finish: end,
      turnaround: end - p.arrival,
      waitTime: end - p.arrival - p.burst,
    };
    time = end;
    p.done = true;
    completed++;
  }

  return { gantt, metrics: Object.values(metrics) };
}

function priorityPreemptive(processes) {
  const procs = processes.map(p => ({
    ...p,
    remaining: p.burst,
    done: false,
    finish: 0,
  }));

  const gantt = [];
  let time = 0;
  let completed = 0;
  const n = procs.length;
  let current = null;
  let segStart = 0;

  const maxArrival = processes.reduce((mx, p) => Math.max(mx, p.arrival), 0);
  const totalBurst = processes.reduce((sum, p) => sum + p.burst, 0);
  const endTime = maxArrival + totalBurst + 1;

  while (completed < n && time <= endTime) {
    const ready = procs.filter(p => p.arrival <= time && !p.done);

    if (ready.length === 0) {
      if (current) {
        gantt.push({ pid: current.pid, start: segStart, end: time });
        current = null;
      }
      time++;
      continue;
    }

    // Elige la mayor prioridad (número más bajo), empate: llegada, pid
    ready.sort((a, b) =>
      a.priority - b.priority ||
      a.arrival - b.arrival ||
      pidNum(a.pid) - pidNum(b.pid)
    );
    const best = ready[0];

    if (!current || current.pid !== best.pid) {
      if (current) {
        gantt.push({ pid: current.pid, start: segStart, end: time });
      }
      current = best;
      segStart = time;
    }

    current.remaining--;
    time++;

    if (current.remaining === 0) {
      current.done = true;
      current.finish = time;
      gantt.push({ pid: current.pid, start: segStart, end: time });
      current = null;
      completed++;
    }
  }

  const merged = mergeGantt(gantt);

  const metrics = procs.map(p => ({
    pid: p.pid,
    arrival: p.arrival,
    burst: p.burst,
    priority: p.priority,
    finish: p.finish,
    turnaround: p.finish - p.arrival,
    waitTime: p.finish - p.arrival - p.burst,
  }));

  return { gantt: merged, metrics };
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
