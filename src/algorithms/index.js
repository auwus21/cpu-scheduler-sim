import { fcfs } from './fcfs.js';
import { sjf } from './sjf.js';
import { srtf } from './srtf.js';
import { roundRobin } from './roundRobin.js';
import { priority } from './priority.js';
export { runSimulationIO } from './simulationIO.js';

export const ALGORITHMS = [
  { id: 'fcfs',        label: 'FIFO / FCFS',                   needsQuantum: false, needsPriority: false },
  { id: 'sjf',         label: 'SJF (Shortest Job First)',       needsQuantum: false, needsPriority: false },
  { id: 'srtf',        label: 'SRTF (Shortest Remaining Time)', needsQuantum: false, needsPriority: false },
  { id: 'rr-variable', label: 'Round Robin – Timer Variable',   needsQuantum: true,  needsPriority: false },
  { id: 'rr-fixed',    label: 'Round Robin – Timer Fijo',       needsQuantum: true,  needsPriority: false },
  { id: 'priority-np', label: 'Prioridades (No Expulsivo)',     needsQuantum: false, needsPriority: true  },
  { id: 'priority-p',  label: 'Prioridades (Expulsivo)',        needsQuantum: false, needsPriority: true  },
];

export function runSimulation(algorithmId, processes, quantum = 2) {
  if (!processes || processes.length === 0) return null;

  let result;
  switch (algorithmId) {
    case 'fcfs':        result = fcfs(processes); break;
    case 'sjf':         result = sjf(processes); break;
    case 'srtf':        result = srtf(processes); break;
    case 'rr-variable': result = roundRobin(processes, quantum, 'variable'); break;
    case 'rr-fixed':    result = roundRobin(processes, quantum, 'fixed'); break;
    case 'priority-np': result = priority(processes, false); break;
    case 'priority-p':  result = priority(processes, true); break;
    default:            result = fcfs(processes); break;
  }

  // Calcular estadísticas globales
  const { gantt, metrics } = result;
  const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].end : 0;
  const firstArrival = Math.min(...processes.map(p => p.arrival));
  const span = totalTime - firstArrival;

  // Tiempo de CPU activo = suma de los segmentos del Gantt (descontando el ocio)
  const busyTime = gantt.reduce((s, seg) => s + (seg.end - seg.start), 0);
  const cpuUtilization = span > 0 ? (busyTime / span) * 100 : 100;

  const avgWaitTime = metrics.reduce((s, m) => s + m.waitTime, 0) / metrics.length;
  const avgTurnaround = metrics.reduce((s, m) => s + m.turnaround, 0) / metrics.length;

  return {
    gantt,
    metrics,
    stats: {
      totalTime,
      cpuUtilization: cpuUtilization.toFixed(1),
      avgWaitTime: avgWaitTime.toFixed(2),
      avgTurnaround: avgTurnaround.toFixed(2),
    },
  };
}
