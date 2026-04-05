/**
 * Motor de simulación CPU + I/O — tick a tick.
 *
 * Maneja todos los algoritmos con soporte de I/O:
 * - Cada dispositivo tiene su cola FCFS
 * - CPU e I/O trabajan en simultáneo (DMA)
 * - Formato I/O: (Recurso, Instante, Duración)
 *   donde Instante = después de cuántos ticks de CPU
 */

import { pidNum } from './fcfs.js';

/**
 * @param {string} algorithmId
 * @param {Array} processes — con ioEvents: [{ resource, afterCpuTick, duration }]
 * @param {number} quantum
 * @returns {{ gantt, ioGantt, metrics, stats, readyQueueByTick, resourceQueuesByTick, usedResources }}
 */
export function runSimulationIO(algorithmId, processes, quantum = 2) {
  if (!processes || processes.length === 0) return null;

  const MAX_TICKS = 200; // safety

  // preparamos procesos
  const procs = processes.map(p => ({
    pid: p.pid,
    arrival: p.arrival,
    totalBurst: p.burst,
    remaining: p.burst,
    priority: p.priority || 0,
    ioEvents: (p.ioEvents || [])
      .slice()
      .sort((a, b) => a.afterCpuTick - b.afterCpuTick),
    cpuTicksDone: 0,       // how many CPU ticks completed so far
    state: 'new',          // new, ready, running, blocked, finished
    ioResource: null,      // which resource, if blocked
    ioRemaining: 0,        // ticks left on I/O
    readyAt: p.arrival,    // when entered ready queue (for FCFS ordering)
    finishTime: 0,
  }));

  // Collect all unique I/O resources
  const usedResources = [...new Set(
    procs.flatMap(p => p.ioEvents.map(e => e.resource))
  )].sort();

  // estado de simulacion
  const readyQueue = [];        // PIDs in ready order
  const deviceQueues = {};      // { R1: [{ pid, remaining }], R2: [...] }
  const deviceBusy = {};        // { R1: { pid, remaining }, R2: null }
  usedResources.forEach(r => {
    deviceQueues[r] = [];
    deviceBusy[r] = null;
  });

  let runningPid = null;
  let quantumLeft = quantum;
  let fixedTimer = quantum;

  // variables de salida
  const ganttSegments = [];    // { pid, start, end }
  const ioSegments = [];       // { pid, start, end, resource }
  const readyQueueByTick = {};
  const resourceQueuesByTick = {};
  usedResources.forEach(r => (resourceQueuesByTick[r] = {}));

  let currentGanttStart = null;
  let currentGanttPid = null;

  // helper: buscar proceso por pid
  const proc = pid => procs.find(p => p.pid === pid);

  // helper: guardar segmento del gantt
  const flushGantt = (tick) => {
    if (currentGanttPid && currentGanttStart !== null && currentGanttStart < tick) {
      ganttSegments.push({ pid: currentGanttPid, start: currentGanttStart, end: tick });
    }
    currentGanttPid = null;
    currentGanttStart = null;
  };

  // helper: agarra el prox segun agloritmo
  const pickNext = (tick) => {
    if (readyQueue.length === 0) return null;

    const isPreemptive = ['srtf', 'priority-p'].includes(algorithmId);
    const isRR = ['rr-variable', 'rr-fixed'].includes(algorithmId);

    switch (algorithmId) {
      case 'fcfs': {
        // Sort by readyAt, then arrival, then PID
        readyQueue.sort((a, b) => {
          const pa = proc(a), pb = proc(b);
          return (pa.readyAt - pb.readyAt) || (pa.arrival - pb.arrival) || (pidNum(a) - pidNum(b));
        });
        return readyQueue[0];
      }

      case 'sjf': {
        // Non-preemptive: shortest total burst, tiebreak by arrival then PID
        readyQueue.sort((a, b) => {
          const pa = proc(a), pb = proc(b);
          return (pa.totalBurst - pb.totalBurst) || (pa.arrival - pb.arrival) || (pidNum(a) - pidNum(b));
        });
        return readyQueue[0];
      }

      case 'srtf': {
        // Preemptive: shortest remaining CPU time
        readyQueue.sort((a, b) => {
          const pa = proc(a), pb = proc(b);
          return (pa.remaining - pb.remaining) || (pa.arrival - pb.arrival) || (pidNum(a) - pidNum(b));
        });
        return readyQueue[0];
      }

      case 'rr-variable':
      case 'rr-fixed': {
        // FCFS order in ready queue
        return readyQueue[0];
      }

      case 'priority-np': {
        // Non-preemptive: lowest priority number = highest priority
        readyQueue.sort((a, b) => {
          const pa = proc(a), pb = proc(b);
          return (pa.priority - pb.priority) || (pa.arrival - pb.arrival) || (pidNum(a) - pidNum(b));
        });
        return readyQueue[0];
      }

      case 'priority-p': {
        // Preemptive: lowest priority number
        readyQueue.sort((a, b) => {
          const pa = proc(a), pb = proc(b);
          return (pa.priority - pb.priority) || (pa.arrival - pb.arrival) || (pidNum(a) - pidNum(b));
        });
        return readyQueue[0];
      }

      default:
        return readyQueue[0];
    }
  };

  // Check if algorithm is non-preemptive (can't interrupt running process)
  const isNonPreemptive = ['fcfs', 'sjf', 'priority-np'].includes(algorithmId);
  const isRR = ['rr-variable', 'rr-fixed'].includes(algorithmId);

  // loop principal
  let tick = 0;
  while (tick < MAX_TICKS) {
    // Check if all finished
    if (procs.every(p => p.state === 'finished')) break;

    // Track devices assigned this tick (skip decrement for them)
    const freshDevices = new Set();

    // 1. procesos que terminan I/O vuelven a la rqueue primero
    usedResources.forEach(r => {
      if (deviceBusy[r] && deviceBusy[r].remaining <= 0) {
        const donePid = deviceBusy[r].pid;
        const doneProc = proc(donePid);
        doneProc.state = 'ready';
        doneProc.readyAt = tick;
        doneProc.ioResource = null;
        readyQueue.push(donePid);
        deviceBusy[r] = null;
      }
    });

    // 2. nuevas llegadas van a la rqueue desp de los retornos de I/O
    procs.forEach(p => {
      if (p.state === 'new' && p.arrival === tick) {
        p.state = 'ready';
        p.readyAt = tick;
        readyQueue.push(p.pid);
      }
    });

    // 3. arrancar I/O para procesos esperando en dispositivos
    usedResources.forEach(r => {
      if (!deviceBusy[r] && deviceQueues[r].length > 0) {
        const next = deviceQueues[r].shift();
        deviceBusy[r] = next;
        freshDevices.add(r);
        ioSegments.push({ pid: next.pid, start: tick, end: tick + next.remaining, resource: r });
      }
    });

    // 4. cpu scheduling
    if (runningPid) {
      const rp = proc(runningPid);
      if (isRR) {
        if (quantumLeft <= 0) {
          flushGantt(tick);
          rp.state = 'ready';
          rp.readyAt = tick;
          readyQueue.push(runningPid);
          runningPid = null;
          if (algorithmId === 'rr-fixed') {
            fixedTimer = quantum;
          }
        }
      } else if (!isNonPreemptive) {
        const candidate = pickNext(tick);
        if (candidate && candidate !== runningPid) {
          const cp = proc(candidate);
          let shouldPreempt = false;
          if (algorithmId === 'srtf' && cp.remaining < rp.remaining) shouldPreempt = true;
          if (algorithmId === 'priority-p' && cp.priority < rp.priority) shouldPreempt = true;
          if (shouldPreempt) {
            flushGantt(tick);
            rp.state = 'ready';
            rp.readyAt = tick;
            readyQueue.push(runningPid);
            runningPid = null;
          }
        }
      }
    }

    if (!runningPid && readyQueue.length > 0) {
      const nextPid = pickNext(tick);
      if (nextPid) {
        readyQueue.splice(readyQueue.indexOf(nextPid), 1);
        runningPid = nextPid;
        proc(nextPid).state = 'running';
        currentGanttPid = nextPid;
        currentGanttStart = tick;
        quantumLeft = quantum;
      }
    }

    // 5. guardar historia de colas en este tick
    readyQueueByTick[tick] = readyQueue.slice();
    usedResources.forEach(r => {
      const inQueue = deviceQueues[r].map(d => d.pid);
      const busy = deviceBusy[r] ? [deviceBusy[r].pid] : [];
      resourceQueuesByTick[r][tick] = [...busy, ...inQueue];
    });

    // 6. ejecutar tick de cpu
    if (runningPid) {
      const rp = proc(runningPid);
      rp.cpuTicksDone++;
      rp.remaining--;
      quantumLeft--;

      if (algorithmId === 'rr-fixed') {
        fixedTimer--;
        if (fixedTimer <= 0) {
          quantumLeft = 0;
          fixedTimer = quantum;
        }
      }

      // Check if process hits an I/O event at this CPU tick count
      const ioEvent = rp.ioEvents.find(e => e.afterCpuTick === rp.cpuTicksDone);
      if (ioEvent && rp.remaining > 0) {
        // Process goes to I/O — leaves CPU
        flushGantt(tick + 1);
        rp.state = 'blocked';
        rp.ioResource = ioEvent.resource;

        const dqEntry = { pid: rp.pid, remaining: ioEvent.duration };
        if (!deviceBusy[ioEvent.resource]) {
          deviceBusy[ioEvent.resource] = dqEntry;
          freshDevices.add(ioEvent.resource);
          ioSegments.push({ pid: rp.pid, start: tick + 1, end: tick + 1 + ioEvent.duration, resource: ioEvent.resource });
        } else {
          deviceQueues[ioEvent.resource].push(dqEntry);
        }
        runningPid = null;
      }
      // Check if process finished all CPU
      else if (rp.remaining <= 0) {
        flushGantt(tick + 1);
        rp.state = 'finished';
        rp.finishTime = tick + 1;
        runningPid = null;
      }
    }

    // 7. consumir tick de i/o (solo para los que no acaban de arrancar en este tick)
    usedResources.forEach(r => {
      if (deviceBusy[r] && !freshDevices.has(r)) {
        deviceBusy[r].remaining--;
      }
    });

    tick++;
  }

  // Flush any remaining gantt segment
  flushGantt(tick);

  // Calcular metricas al final
  const totalTime = Math.max(
    ...procs.map(p => p.finishTime),
    ...ioSegments.map(s => s.end),
    ...ganttSegments.map(s => s.end)
  );

  const metrics = procs.map(p => {
    // Total I/O time actually used (from segments, not config)
    const actualIOTime = ioSegments
      .filter(s => s.pid === p.pid)
      .reduce((s, seg) => s + (seg.end - seg.start), 0);
    return {
      pid: p.pid,
      arrival: p.arrival,
      burst: p.totalBurst,
      priority: p.priority,
      finish: p.finishTime,
      turnaround: p.finishTime - p.arrival,
      waitTime: p.finishTime - p.arrival - p.totalBurst - actualIOTime,
    };
  });

  const busyTime = ganttSegments.reduce((s, seg) => s + (seg.end - seg.start), 0);
  const cpuUtilization = totalTime > 0 ? (busyTime / totalTime) * 100 : 100;
  const avgWaitTime = metrics.reduce((s, m) => s + m.waitTime, 0) / metrics.length;
  const avgTurnaround = metrics.reduce((s, m) => s + m.turnaround, 0) / metrics.length;

  return {
    gantt: ganttSegments,
    ioGantt: ioSegments,
    metrics,
    stats: {
      totalTime,
      cpuUtilization: cpuUtilization.toFixed(1),
      avgWaitTime: avgWaitTime.toFixed(2),
      avgTurnaround: avgTurnaround.toFixed(2),
    },
    readyQueueByTick,
    resourceQueuesByTick,
    usedResources,
  };
}
