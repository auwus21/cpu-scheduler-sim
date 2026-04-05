/**
 * Motor de corrección para el modo práctica.
 * Compara la solución del alumno contra la simulación correcta.
 * Scores: CPU cells + I/O cells + Métricas.
 * Ready Queue y Resource Queues se auto-derivan (no se corrigen).
 */

/**
 * Construye el mapa de celdas CPU correctas.
 */
export function buildCorrectCells(gantt, processes) {
  const cells = {};
  processes.forEach(p => (cells[p.pid] = new Set()));
  gantt.forEach(seg => {
    for (let t = seg.start; t < seg.end; t++) {
      cells[seg.pid].add(t);
    }
  });
  return cells;
}

/**
 * Construye el mapa de celdas I/O correctas.
 */
export function buildCorrectIOCells(ioGantt) {
  const cells = {};
  if (!ioGantt) return cells;
  ioGantt.forEach(seg => {
    if (!cells[seg.pid]) cells[seg.pid] = {};
    for (let t = seg.start; t < seg.end; t++) {
      cells[seg.pid][t] = seg.resource;
    }
  });
  return cells;
}

/**
 * Corrige la práctica del alumno.
 * Solo puntúa: CPU cells, I/O cells, y Métricas.
 */
export function correctPractice(
  userCells,
  userMetrics,
  correctResult,
  processes,
  userIOCells
) {
  const { gantt, ioGantt, metrics: correctMetrics, stats } = correctResult;
  const totalTime = Number(stats.totalTime);
  const hasIO = ioGantt && ioGantt.length > 0;

  // 1. Revisar CPU
  const correctCells = buildCorrectCells(gantt, processes);
  let ganttCorrect = 0;
  let ganttTotal = 0;
  const cellResults = {};

  processes.forEach(p => {
    cellResults[p.pid] = {};
    for (let t = 0; t < totalTime; t++) {
      const userFilled = userCells[p.pid]?.has(t) || false;
      const correctFilled = correctCells[p.pid].has(t);

      if (userFilled && correctFilled) {
        cellResults[p.pid][t] = 'correct';
        ganttCorrect++;
        ganttTotal++;
      } else if (!userFilled && !correctFilled) {
        cellResults[p.pid][t] = 'correct-empty';
      } else if (userFilled && !correctFilled) {
        cellResults[p.pid][t] = 'wrong-filled';
        ganttTotal++;
      } else {
        cellResults[p.pid][t] = 'missing';
        ganttTotal++;
      }
    }
  });

  const ganttScore =
    ganttTotal > 0 ? Math.round((ganttCorrect / ganttTotal) * 100) : 100;

  // 2. Revisar I/O
  let ioScore = 100;
  const ioCellResults = {};

  if (hasIO) {
    const correctIOCells = buildCorrectIOCells(ioGantt);
    let ioCorrect = 0;
    let ioTotal = 0;

    processes.forEach(p => {
      ioCellResults[p.pid] = {};
      for (let t = 0; t < totalTime; t++) {
        const userIO = userIOCells?.[p.pid]?.[t] || null;
        const correctIO = correctIOCells[p.pid]?.[t] || null;

        if (userIO && correctIO && userIO === correctIO) {
          ioCellResults[p.pid][t] = 'correct';
          ioCorrect++;
          ioTotal++;
        } else if (!userIO && !correctIO) {
          ioCellResults[p.pid][t] = 'correct-empty';
        } else if (userIO && !correctIO) {
          ioCellResults[p.pid][t] = 'wrong-filled';
          ioTotal++;
        } else if (userIO && correctIO && userIO !== correctIO) {
          ioCellResults[p.pid][t] = 'wrong-resource';
          ioTotal++;
        } else {
          ioCellResults[p.pid][t] = 'missing';
          ioTotal++;
        }
      }
    });

    ioScore = ioTotal > 0 ? Math.round((ioCorrect / ioTotal) * 100) : 100;
  }

  // 3. Revisar TR y TE
  const metricsResults = {};
  let metricsCorrect = 0;
  let metricsTotal = 0;

  correctMetrics.forEach(cm => {
    const um = userMetrics[cm.pid] || {};
    const trCorrect = Number(um.tr) === cm.turnaround;
    const teCorrect = Number(um.te) === cm.waitTime;

    metricsResults[cm.pid] = {
      tr: {
        user: um.tr ?? '',
        correct: cm.turnaround,
        isCorrect: trCorrect,
      },
      te: {
        user: um.te ?? '',
        correct: cm.waitTime,
        isCorrect: teCorrect,
      },
    };

    metricsTotal += 2;
    if (trCorrect) metricsCorrect++;
    if (teCorrect) metricsCorrect++;
  });

  const metricsScore =
    metricsTotal > 0
      ? Math.round((metricsCorrect / metricsTotal) * 100)
      : 100;

  // 4. Calcular puntaje final
  let totalScore;
  if (hasIO) {
    // Con I/O: CPU 45%, I/O 20%, Métricas 35%
    totalScore = Math.round(
      ganttScore * 0.45 + ioScore * 0.20 + metricsScore * 0.35
    );
  } else {
    // Sin I/O: CPU 65%, Métricas 35%
    totalScore = Math.round(
      ganttScore * 0.65 + metricsScore * 0.35
    );
  }

  return {
    cellResults,
    correctCells,
    ioCellResults,
    correctIOCells: hasIO ? buildCorrectIOCells(ioGantt) : {},
    metricsResults,
    ganttScore,
    ioScore,
    metricsScore,
    totalScore,
    totalTime,
    hasIO,
  };
}
