/**
 * FCFS - First Come First Served (FIFO)
 * No expulsivo. Los procesos se atienden en orden de llegada.
 * Desempate: menor tiempo de llegada → menor PID
 */
export function fcfs(processes) {
  const procs = processes.map(p => ({ ...p, remaining: p.burst }));
  // Ordenar por llegada, desempata PID
  procs.sort((a, b) => a.arrival - b.arrival || pidNum(a.pid) - pidNum(b.pid));

  const gantt = [];
  const metrics = {};
  let time = 0;

  for (const p of procs) {
    if (time < p.arrival) time = p.arrival; // Cubrir tiempos muertos del CPU
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
  }

  return { gantt, metrics: Object.values(metrics) };
}

export function pidNum(pid) {
  const m = pid.match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}
