import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';

/**
 * Grilla de Gantt interactiva para el modo práctica.
 * Ready Queue and Resource Queues are auto-derived from painted cells.
 */

const PROCESS_COLORS = [
  '#6c63ff', '#00d4ff', '#ff6b6b', '#ffd93d', '#6bcb77',
  '#ff922b', '#cc5de8', '#20c997', '#f06595', '#74c0fc',
];

const IO_COLOR = '#c9a0ff';

export default function PracticeGantt({
  processes,
  totalTime,
  filledCells,
  setFilledCells,
  filledIOCells,
  setFilledIOCells,
  userMetrics,
  setUserMetrics,
  cellResults,
  corrected,
  correctCells,
  ioCellResults,
  correctIOCells,
  correctRQ,
  metricsResults,
  algorithmId,
  undoStack,
  pushUndo,
  hasIO,
  usedResources,
}) {
  const isDragging = useRef(false);
  const dragPid = useRef(null);
  const dragAction = useRef('add');
  const tableRef = useRef(null);

  // I/O paint mode
  const [paintMode, setPaintMode] = useState('cpu');
  const [selectedResource, setSelectedResource] = useState('R1');

  if (!totalTime || totalTime === 0) return null;

  const times = Array.from({ length: totalTime }, (_, i) => i);
  const algoShort = algorithmId?.split('-')[0]?.toUpperCase() || 'ALGO';

  // Cola lista automatica en base a celdas pintadas
  // Find the last tick where any cell (CPU or IO) has been painted
  const lastPaintedTick = useMemo(() => {
    let max = -1;
    processes.forEach(p => {
      const cpuSet = filledCells[p.pid];
      if (cpuSet) cpuSet.forEach(t => { if (t > max) max = t; });
      const ioMap = filledIOCells?.[p.pid];
      if (ioMap) Object.keys(ioMap).forEach(t => { if (Number(t) > max) max = Number(t); });
    });
    return max;
  }, [filledCells, filledIOCells, processes]);

  const derivedReadyQueue = useMemo(() => {
    const rq = {};
    for (let t = 0; t < totalTime; t++) {
      // Only show queue up to where student has painted
      if (t > lastPaintedTick) { rq[t] = null; continue; }

      const inQueue = [];
      processes.forEach(p => {
        if (p.arrival > t) return;
        if (filledCells[p.pid]?.has(t)) return;
        if (filledIOCells?.[p.pid]?.[t]) return;

        const cpuTicks = filledCells[p.pid] ? [...filledCells[p.pid]].sort((a, b) => a - b) : [];
        if (cpuTicks.length >= p.burst) {
          const lastTick = cpuTicks[cpuTicks.length - 1];
          if (lastTick < t) return;
        }

        const ioTicks = filledIOCells?.[p.pid] ? Object.keys(filledIOCells[p.pid]).map(Number) : [];
        const allTicks = [...cpuTicks, ...ioTicks].sort((a, b) => a - b);
        if (cpuTicks.length >= p.burst && allTicks.length > 0) {
          const lastAny = Math.max(...allTicks);
          if (lastAny < t) return;
        }

        inQueue.push(p.pid.replace(/^P/i, ''));
      });
      rq[t] = inQueue.join(',');
    }
    return rq;
  }, [filledCells, filledIOCells, processes, totalTime, lastPaintedTick]);

  // Colas de recursos automaticas en base a I/O
  const derivedResourceQueues = useMemo(() => {
    if (!hasIO) return {};
    const rqs = {};
    (usedResources || []).forEach(r => {
      rqs[r] = {};
      for (let t = 0; t < totalTime; t++) {
        if (t > lastPaintedTick) { rqs[r][t] = null; continue; }
        const using = [];
        processes.forEach(p => {
          if (filledIOCells?.[p.pid]?.[t] === r) {
            using.push(p.pid.replace(/^P/i, ''));
          }
        });
        rqs[r][t] = using.join(',');
      }
    });
    return rqs;
  }, [filledIOCells, processes, totalTime, hasIO, usedResources, lastPaintedTick]);

  // Sequential numbering + segment borders for CPU cells
  const cellDisplay = useMemo(() => {
    const result = {};
    processes.forEach((p, idx) => {
      result[p.pid] = {};
      const filled = filledCells[p.pid] || new Set();
      const sortedTicks = [...filled].sort((a, b) => a - b);
      let seq = 0;
      sortedTicks.forEach(t => {
        seq++;
        result[p.pid][t] = {
          seq,
          isSegStart: !filled.has(t - 1),
          isSegEnd: !filled.has(t + 1),
          color: PROCESS_COLORS[idx % PROCESS_COLORS.length],
        };
      });
    });
    return result;
  }, [filledCells, processes]);

  // Correct cell display for correction mode (CPU)
  const correctDisplay = useMemo(() => {
    if (!corrected || !correctCells) return {};
    const result = {};
    processes.forEach((p, idx) => {
      result[p.pid] = {};
      const cells = correctCells[p.pid] || new Set();
      const sorted = [...cells].sort((a, b) => a - b);
      let seq = 0;
      sorted.forEach(t => {
        seq++;
        result[p.pid][t] = {
          seq,
          isSegStart: !cells.has(t - 1),
          isSegEnd: !cells.has(t + 1),
          color: PROCESS_COLORS[idx % PROCESS_COLORS.length],
        };
      });
    });
    return result;
  }, [corrected, correctCells, processes]);

  // Apply a CPU cell change
  const applyCell = useCallback((pid, tick, action) => {
    setFilledCells(prev => {
      const next = {};
      Object.keys(prev).forEach(k => (next[k] = new Set(prev[k])));
      if (!next[pid]) next[pid] = new Set();

      if (action === 'remove') {
        next[pid].delete(tick);
      } else {
        processes.forEach(p => {
          if (p.pid !== pid && next[p.pid]) next[p.pid].delete(tick);
        });
        next[pid].add(tick);
      }
      return next;
    });
    // Remove any I/O cell at this position
    if (action === 'add') {
      setFilledIOCells(prev => {
        if (!prev[pid]?.[tick]) return prev;
        const next = { ...prev, [pid]: { ...prev[pid] } };
        delete next[pid][tick];
        return next;
      });
    }
  }, [setFilledCells, setFilledIOCells, processes]);

  // Apply an I/O cell change
  const applyIOCell = useCallback((pid, tick, action) => {
    setFilledIOCells(prev => {
      const next = {};
      Object.keys(prev).forEach(k => (next[k] = { ...prev[k] }));
      if (!next[pid]) next[pid] = {};

      if (action === 'remove') {
        delete next[pid][tick];
      } else {
        next[pid][tick] = selectedResource;
      }
      return next;
    });
    if (action === 'add') {
      setFilledCells(prev => {
        if (!prev[pid]?.has(tick)) return prev;
        const next = {};
        Object.keys(prev).forEach(k => (next[k] = new Set(prev[k])));
        next[pid].delete(tick);
        return next;
      });
    }
  }, [setFilledIOCells, setFilledCells, selectedResource]);

  const saveUndo = useCallback(() => {
    if (pushUndo) pushUndo(filledCells);
  }, [pushUndo, filledCells]);

  const handleMouseDown = (pid, tick, e) => {
    if (corrected) return;
    e.preventDefault();
    saveUndo();
    isDragging.current = true;
    dragPid.current = pid;

    if (paintMode === 'io' && hasIO) {
      const hasIOCell = filledIOCells[pid]?.[tick];
      dragAction.current = hasIOCell ? 'remove' : 'add';
      applyIOCell(pid, tick, dragAction.current);
    } else {
      const isFilled = filledCells[pid]?.has(tick);
      dragAction.current = isFilled ? 'remove' : 'add';
      applyCell(pid, tick, dragAction.current);
    }
  };

  const handleMouseEnter = (pid, tick) => {
    if (!isDragging.current || corrected) return;
    if (pid !== dragPid.current) return;

    if (paintMode === 'io' && hasIO) {
      applyIOCell(pid, tick, dragAction.current);
    } else {
      applyCell(pid, tick, dragAction.current);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMetricChange = (pid, field, value) => {
    setUserMetrics(prev => ({
      ...prev,
      [pid]: { ...prev[pid], [field]: value },
    }));
  };

  const formatIOEvents = (p) => {
    if (!p.ioEvents || p.ioEvents.length === 0) return '—';
    return p.ioEvents.map(e => `(${e.resource},${e.afterCpuTick},${e.duration})`).join(' ');
  };

  return (
    <div className="gantt-container" ref={tableRef} id="practice-gantt-export">
      <div className="gantt-header">
        <h2 className="section-title">
          <span className="section-icon">📝</span>
          Diagrama de Gantt — Completalo vos
        </h2>

        {/* Paint mode toggle */}
        {hasIO && !corrected && (
          <div className="practice-paint-toggle">
            <button
              className={`paint-mode-btn ${paintMode === 'cpu' ? 'active' : ''}`}
              onClick={() => setPaintMode('cpu')}
            >
              🖥️ CPU
            </button>
            <button
              className={`paint-mode-btn paint-mode-io ${paintMode === 'io' ? 'active' : ''}`}
              onClick={() => setPaintMode('io')}
            >
              💾 I/O
            </button>
            {paintMode === 'io' && (
              <select
                className="paint-resource-select"
                value={selectedResource}
                onChange={e => setSelectedResource(e.target.value)}
              >
                <option value="R1">R1</option>
                <option value="R2">R2</option>
                <option value="R3">R3</option>
              </select>
            )}
          </div>
        )}
      </div>

      <div className="gantt-scroll">
        <table className="gantt-table" style={{ userSelect: 'none' }}>
          <thead>
            <tr>
              <th className="gt-col-proceso">Proceso</th>
              <th className="gt-col-llegada">Llegada</th>
              <th className="gt-col-cpu">CPU</th>
              {hasIO && <th className="gt-col-io-info">I/O</th>}
              {times.map(t => (
                <th key={t} className="gt-col-t">{t}</th>
              ))}
              <th className="gt-col-tr">TR</th>
              <th className="gt-col-te">TE</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p, idx) => {
              const color = PROCESS_COLORS[idx % PROCESS_COLORS.length];
              const mr = metricsResults?.[p.pid];
              const um = userMetrics[p.pid] || {};

              return (
                <tr key={p.pid} className="gt-process-row">
                  <td className="gt-cell-pid" style={{ borderLeft: `3px solid ${color}` }}>
                    {p.pid}
                  </td>
                  <td className="gt-cell-info">{p.arrival}</td>
                  <td className="gt-cell-info">{p.burst}</td>
                  {hasIO && (
                    <td className="gt-cell-info gt-cell-io-info" title={formatIOEvents(p)}>
                      {formatIOEvents(p)}
                    </td>
                  )}

                  {times.map(t => {
                    const isCpuFilled = filledCells[p.pid]?.has(t);
                    const ioResource = filledIOCells?.[p.pid]?.[t];
                    const cpuData = cellDisplay[p.pid]?.[t];
                    const cpuStatus = corrected ? cellResults?.[p.pid]?.[t] : null;
                    const ioStatus = corrected ? ioCellResults?.[p.pid]?.[t] : null;

                    // MODO CORRECION

                    if (corrected && cpuStatus === 'missing') {
                      const cd = correctDisplay[p.pid]?.[t];
                      return (
                        <td key={t} className="gt-cell gt-cell-running"
                          style={{
                            background: 'rgba(255,217,61,0.08)',
                            borderTop: '2px dashed rgba(255,217,61,0.5)',
                            borderBottom: '2px dashed rgba(255,217,61,0.5)',
                            borderLeft: cd?.isSegStart ? '2px dashed rgba(255,217,61,0.5)' : '1px solid rgba(255,217,61,0.15)',
                            borderRight: cd?.isSegEnd ? '2px dashed rgba(255,217,61,0.5)' : '1px solid rgba(255,217,61,0.15)',
                            color: 'rgba(255,217,61,0.6)',
                          }}
                          title={`⚠️ Faltó: ${p.pid} tick ${cd?.seq || '?'}`}
                        >
                          <span className="gt-seq">{cd?.seq}</span>
                        </td>
                      );
                    }

                    if (corrected && cpuStatus === 'wrong-filled') {
                      return (
                        <td key={t} className="gt-cell gt-cell-running"
                          style={{
                            background: 'rgba(255,92,106,0.12)',
                            borderTop: '2px solid var(--clr-red)',
                            borderBottom: '2px solid var(--clr-red)',
                            borderLeft: cpuData?.isSegStart ? '2px solid var(--clr-red)' : '1px solid rgba(255,92,106,0.3)',
                            borderRight: cpuData?.isSegEnd ? '2px solid var(--clr-red)' : '1px solid rgba(255,92,106,0.3)',
                            color: 'var(--clr-red)',
                            textDecoration: 'line-through',
                          }}
                          title={`❌ ${p.pid} no ejecuta acá`}
                        >
                          <span className="gt-seq">{cpuData?.seq}</span>
                        </td>
                      );
                    }

                    if (corrected && cpuStatus === 'correct') {
                      return (
                        <td key={t} className="gt-cell gt-cell-running"
                          style={{
                            background: 'rgba(0,255,159,0.1)',
                            borderTop: '2px solid var(--clr-green)',
                            borderBottom: '2px solid var(--clr-green)',
                            borderLeft: cpuData?.isSegStart ? '2px solid var(--clr-green)' : '1px solid rgba(0,255,159,0.2)',
                            borderRight: cpuData?.isSegEnd ? '2px solid var(--clr-green)' : '1px solid rgba(0,255,159,0.2)',
                            color: 'var(--clr-green)',
                          }}
                          title="✅ Correcto"
                        >
                          <span className="gt-seq">{cpuData?.seq}</span>
                        </td>
                      );
                    }

                    // I/O correction
                    if (corrected && ioStatus === 'correct') {
                      return (
                        <td key={t} className="gt-cell gt-cell-io-practice"
                          style={{ background: 'rgba(0,255,159,0.1)', border: '2px solid var(--clr-green)', color: 'var(--clr-green)' }}
                          title={`✅ I/O correcto: ${ioResource}`}
                        >
                          <span className="gt-seq">{ioResource}</span>
                        </td>
                      );
                    }

                    if (corrected && (ioStatus === 'wrong-filled' || ioStatus === 'wrong-resource')) {
                      const correctRes = correctIOCells?.[p.pid]?.[t];
                      return (
                        <td key={t} className="gt-cell gt-cell-io-practice"
                          style={{ background: 'rgba(255,92,106,0.12)', border: '2px solid var(--clr-red)', color: 'var(--clr-red)', textDecoration: 'line-through' }}
                          title={`❌ ${ioStatus === 'wrong-resource' ? `Recurso incorrecto (correcto: ${correctRes})` : 'No hay I/O acá'}`}
                        >
                          <span className="gt-seq">{ioResource}</span>
                        </td>
                      );
                    }

                    if (corrected && ioStatus === 'missing') {
                      const correctRes = correctIOCells?.[p.pid]?.[t];
                      return (
                        <td key={t} className="gt-cell gt-cell-io-practice"
                          style={{ background: 'rgba(255,217,61,0.08)', border: '2px dashed rgba(255,217,61,0.5)', color: 'rgba(255,217,61,0.6)' }}
                          title={`⚠️ Faltó I/O: ${correctRes}`}
                        >
                          <span className="gt-seq">{correctRes}</span>
                        </td>
                      );
                    }

                    // MODO NORMAL

                    if (ioResource) {
                      return (
                        <td key={t} className="gt-cell gt-cell-io-practice"
                          onMouseDown={e => handleMouseDown(p.pid, t, e)}
                          onMouseEnter={() => handleMouseEnter(p.pid, t)}
                          style={{
                            background: 'rgba(180,120,255,0.15)',
                            border: `2px solid ${IO_COLOR}`,
                            color: IO_COLOR,
                            cursor: corrected ? 'default' : 'pointer',
                          }}
                          title={`I/O: ${ioResource} en t=${t}`}
                        >
                          <span className="gt-seq">{ioResource}</span>
                        </td>
                      );
                    }

                    if (isCpuFilled && cpuData) {
                      return (
                        <td key={t} className="gt-cell gt-cell-running"
                          onMouseDown={e => handleMouseDown(p.pid, t, e)}
                          onMouseEnter={() => handleMouseEnter(p.pid, t)}
                          style={{
                            background: color + '28',
                            borderTop: `2px solid ${color}`,
                            borderBottom: `2px solid ${color}`,
                            borderLeft: cpuData.isSegStart ? `2px solid ${color}` : `1px solid ${color}40`,
                            borderRight: cpuData.isSegEnd ? `2px solid ${color}` : `1px solid ${color}40`,
                            color: color,
                            cursor: corrected ? 'default' : 'pointer',
                          }}
                          title={`${p.pid} — tick ${cpuData.seq}`}
                        >
                          <span className="gt-seq">{cpuData.seq}</span>
                        </td>
                      );
                    }

                    return (
                      <td key={t}
                        className={`gt-cell ${!corrected ? 'practice-cell-clickable' : 'gt-cell-empty'}`}
                        onMouseDown={e => handleMouseDown(p.pid, t, e)}
                        onMouseEnter={() => handleMouseEnter(p.pid, t)}
                        style={{ cursor: corrected ? 'default' : 'pointer' }}
                        title={!corrected ? `Click para ${paintMode === 'io' ? `I/O (${selectedResource})` : 'CPU'} en t=${t}` : ''}
                      />
                    );
                  })}

                  {/* TR / TE */}
                  <td className="gt-cell-metric gt-tr">
                    {corrected ? (
                      <span className={mr?.tr.isCorrect ? 'pm-correct' : 'pm-wrong'}>
                        {um.tr || '—'}
                        {!mr?.tr.isCorrect && <span className="pm-correct-val"> →{mr?.tr.correct}</span>}
                      </span>
                    ) : (
                      <input type="number" className="pm-input-inline"
                        value={um.tr || ''} onChange={e => handleMetricChange(p.pid, 'tr', e.target.value)}
                        placeholder="?"
                      />
                    )}
                  </td>
                  <td className="gt-cell-metric gt-te">
                    {corrected ? (
                      <span className={mr?.te.isCorrect ? 'pm-correct' : 'pm-wrong'}>
                        {um.te || '—'}
                        {!mr?.te.isCorrect && <span className="pm-correct-val"> →{mr?.te.correct}</span>}
                      </span>
                    ) : (
                      <input type="number" className="pm-input-inline"
                        value={um.te || ''} onChange={e => handleMetricChange(p.pid, 'te', e.target.value)}
                        placeholder="?"
                      />
                    )}
                  </td>
                </tr>
              );
            })}

            {/* Ready Queue (solo lectura) */}
            <tr className="gt-rqueue-row">
              <td className="gt-cell-pid gt-algo-label">{algoShort}</td>
              <td colSpan={hasIO ? 3 : 2} className="gt-rqueue-title">R Queue</td>
              {times.map(t => {
                const val = derivedReadyQueue[t];
                const correctVal = corrected && correctRQ ? (correctRQ[t] || []).map(pid => pid.replace(/^P/i, '')).join(',') : null;
                const isMatch = correctVal !== null ? (val || '') === correctVal : null;
                return (
                  <td key={t} className="gt-cell gt-cell-rqueue gt-cell-rqueue-auto">
                    {val === null ? (
                      <span className="rq-auto-empty"></span>
                    ) : corrected && correctVal !== null ? (
                      <span className={isMatch ? 'rq-correct' : 'rq-wrong'} title={isMatch ? '✅' : `❌ Correcto: ${correctVal}`}>
                        {val || '—'}
                        {!isMatch && <div className="rq-correction">{correctVal || '—'}</div>}
                      </span>
                    ) : (
                      <span className="rq-auto-value">{val || '—'}</span>
                    )}
                  </td>
                );
              })}
              <td colSpan={2} className="gt-avg-cell">
                {corrected && metricsResults && <span className="gt-avg-label">Prom</span>}
              </td>
            </tr>

            {/* Colas de recursos (solo lectura) */}
            {hasIO && usedResources && usedResources.map(r => (
              <tr key={r} className="gt-rqueue-row gt-resq-row">
                <td className="gt-cell-pid gt-resq-label" style={{ color: IO_COLOR }}>{r}</td>
                <td colSpan={hasIO ? 3 : 2} className="gt-rqueue-title"></td>
                {times.map(t => {
                  const val = derivedResourceQueues[r]?.[t];
                  return (
                    <td key={t} className="gt-cell gt-cell-rqueue gt-cell-resq">
                      {val === null ? (
                        <span className="rq-auto-empty"></span>
                      ) : (
                        <span className="rq-auto-value">{val || '—'}</span>
                      )}
                    </td>
                  );
                })}
                <td colSpan={2} className="gt-avg-cell" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
