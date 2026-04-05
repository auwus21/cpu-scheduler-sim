import { pidNum } from './fcfs.js';

/**
 * SJF - Shortest Job First
 * No expulsivo. Cuando la CPU queda libre, elige el proceso con menor burst.
 * Desempate: menor arrival → menor PID
 */
export function sjf(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst, done: false }));
  const gantt = [];
  const metrics = {};
  let time = 0;
  let completed = 0;
  const n = procs.length;

  while (completed < n) {
    // Cola de listos: los que llegaron y aún no terminan
    const ready = procs.filter(p => p.arrival <= time && !p.done);

    if (ready.length === 0) {
      // CPU inactiva: avanzamos el tiempo a la próxima llegada ideal
      const next = procs.filter(p => !p.done).sort((a, b) => a.arrival - b.arrival)[0];
      time = next.arrival;
      continue;
    }

    // Elige ráfaga más corta, desempatando por llegada y luego PID
    ready.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || pidNum(a.pid) - pidNum(b.pid));
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
