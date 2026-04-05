/**
 * Historial de práctica — persistencia en localStorage.
 * Guarda resultados de ejercicios con algoritmo, puntaje, fecha y procesos.
 */

const STORAGE_KEY = 'cpusim_practice_history';
const MAX_HISTORY = 50;

export function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveResult(entry) {
  const history = loadHistory();
  history.unshift({
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString(),
  });
  // Mantener solo las últimas N entradas
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Computar estadísticas por algoritmo desde el historial.
 * Retorna: { [algorithmId]: { attempts, avgScore, bestScore, lastDate } }
 */
export function computeStats(history) {
  const stats = {};
  for (const entry of history) {
    const alg = entry.algorithm;
    if (!stats[alg]) {
      stats[alg] = { attempts: 0, totalScore: 0, bestScore: 0, lastDate: null };
    }
    stats[alg].attempts++;
    stats[alg].totalScore += entry.totalScore;
    stats[alg].bestScore = Math.max(stats[alg].bestScore, entry.totalScore);
    if (!stats[alg].lastDate || entry.date > stats[alg].lastDate) {
      stats[alg].lastDate = entry.date;
    }
  }
  // Calcular promedios
  for (const key of Object.keys(stats)) {
    stats[key].avgScore = Math.round(stats[key].totalScore / stats[key].attempts);
  }
  return stats;
}

/**
 * Sistema de logros
 */
const ACHIEVEMENTS = [
  { id: 'first_try', icon: '🎯', label: 'Primer intento', desc: 'Completá tu primer ejercicio', check: h => h.length >= 1 },
  { id: 'five_done', icon: '📚', label: 'Estudiante', desc: 'Completá 5 ejercicios', check: h => h.length >= 5 },
  { id: 'ten_done', icon: '🎓', label: 'Aplicado', desc: 'Completá 10 ejercicios', check: h => h.length >= 10 },
  { id: 'twenty_done', icon: '🏅', label: 'Dedicado', desc: 'Completá 20 ejercicios', check: h => h.length >= 20 },
  { id: 'perfect', icon: '🏆', label: 'Perfecto', desc: 'Sacá 100% en un ejercicio', check: h => h.some(e => e.totalScore === 100) },
  { id: 'all_algos', icon: '🌟', label: 'Todoterreno', desc: 'Practicá con todos los algoritmos', check: h => {
    const algos = new Set(h.map(e => e.algorithm));
    return algos.size >= 7;
  }},
  { id: 'streak_3', icon: '🔥', label: 'Racha', desc: '3 ejercicios seguidos ≥70%', check: h => {
    let streak = 0;
    for (const e of h) {
      if (e.totalScore >= 70) { streak++; if (streak >= 3) return true; }
      else streak = 0;
    }
    return false;
  }},
  { id: 'master_fifo', icon: '📦', label: 'Master FIFO', desc: '3 veces ≥90% en FIFO', check: h => h.filter(e => e.algorithm === 'fcfs' && e.totalScore >= 90).length >= 3 },
  { id: 'master_rr', icon: '🔄', label: 'Master RR', desc: '3 veces ≥90% en Round Robin', check: h => h.filter(e => (e.algorithm === 'rr-variable' || e.algorithm === 'rr-fixed') && e.totalScore >= 90).length >= 3 },
  { id: 'high_avg', icon: '💎', label: 'Excelencia', desc: 'Promedio general ≥80%', check: h => {
    if (h.length < 3) return false;
    const avg = h.reduce((s, e) => s + e.totalScore, 0) / h.length;
    return avg >= 80;
  }},
];

export function getAchievements(history) {
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: a.check(history),
  }));
}

/**
 * Compartir / Importar ejercicio como JSON codificado en base64
 */
export function encodeExercise(processes, algorithm, quantum) {
  // Incluir ioEvents en ejercicios compartidos
  const data = { p: processes.map(p => ({
    ...p,
    io: p.ioEvents || [],
  })), a: algorithm, q: quantum };
  // Use encodeURIComponent to make btoa safe for UTF-8 characters (like accents or 'ñ')
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodeExercise(code) {
  try {
    // decodeURIComponent to pair with the UTF-8 safe encode buffer
    const data = JSON.parse(decodeURIComponent(atob(code)));
    const processes = data.p.map(p => ({
      ...p,
      ioEvents: p.io || p.ioEvents || [],
    }));
    // Limpiar la clave abreviada 'io'
    processes.forEach(p => delete p.io);
    return { processes, algorithm: data.a, quantum: data.q };
  } catch {
    return null;
  }
}
