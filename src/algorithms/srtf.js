import { pidNum } from './fcfs.js';

/**
 * SRTF - Shortest Remaining Time First
 * Versión expulsiva de SJF. Tick a tick: si llega un proceso con menor
 * tiempo restante que el actual, lo expulsa.
 * Desempate: menor remaining → menor arrival → menor PID
 */
export function srtf(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst, done: false, finish: 0 }));
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

    // Elige el tiempo restante más corto, desempatando por llegada y PID
    ready.sort((a, b) =>
      a.remaining - b.remaining ||
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

  // Unificar segmentos consecutivos del mismo proceso
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
