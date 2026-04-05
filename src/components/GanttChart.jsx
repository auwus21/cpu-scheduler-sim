import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ALGORITHMS } from '../algorithms/index.js';

const PROCESS_COLORS = [
  '#6c63ff', '#00d4ff', '#ff6b6b', '#ffd93d', '#6bcb77',
  '#ff922b', '#cc5de8', '#20c997', '#f06595', '#74c0fc',
  '#a9e34b', '#ff6db8',
];

function getColor(pid, colorMap) {
  if (!colorMap.has(pid)) {
    colorMap.set(pid, PROCESS_COLORS[colorMap.size % PROCESS_COLORS.length]);
  }
  return colorMap.get(pid);
}

export default function GanttChart({ result, processes, algorithmId, animationSpeed = 2, ioEnabled }) {
  const [animTime, setAnimTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const animRef = useRef(null);
  const colorMap = useRef(new Map());

  const gantt = result?.gantt || [];
  const ioGantt = result?.ioGantt || [];
  const metrics = result?.metrics || [];
  const totalTime = Number(result?.stats?.totalTime) || (gantt.length > 0 ? gantt[gantt.length - 1].end : 0);
  const usedResources = result?.usedResources || [];
  const resourceQueuesByTick = result?.resourceQueuesByTick || {};
  const readyQueueByTick = result?.readyQueueByTick || null;

  const algoDef = ALGORITHMS.find(a => a.id === algorithmId);
  const algoShort = algorithmId?.split('-')[0]?.toUpperCase() || 'FCFS';
  const needsPriority = algoDef?.needsPriority;

  const hasIO = ioEnabled && ioGantt.length > 0;

  // Reiniciar al recibir un nuevo resultado
  useEffect(() => {
    colorMap.current = new Map();
    if (result) {
      setAnimTime(totalTime);
      setPlaying(false);
    }
  }, [result, totalTime]);

  // Bucle de animación de la línea de tiempo
  useEffect(() => {
    if (playing) {
      animRef.current = setInterval(() => {
        setAnimTime(prev => {
          if (prev >= totalTime) {
            setPlaying(false);
            clearInterval(animRef.current);
            return totalTime;
          }
          return prev + 1;
        });
      }, Math.max(40, 350 / animationSpeed));
    } else {
      clearInterval(animRef.current);
    }
    return () => clearInterval(animRef.current);
  }, [playing, totalTime, animationSpeed]);

  // Construir datos de estado por proceso y por tick (CPU + I/O)
  const { cellData, ioCellData, runningAt, readyQueueAt } = useMemo(() => {
    if (!result || !processes) return { cellData: {}, ioCellData: {}, runningAt: {}, readyQueueAt: {} };

    const runningAt = {};
    const cellData = {};
    const ioCellData = {};
    const perProcessSeq = {};

    for (const p of processes) {
      cellData[p.pid] = {};
      ioCellData[p.pid] = {};
      perProcessSeq[p.pid] = 0;
    }

    // Llenar datos de uso de CPU desde los segmentos del Gantt
    for (const seg of gantt) {
      if (!cellData[seg.pid]) { cellData[seg.pid] = {}; perProcessSeq[seg.pid] = 0; }
      for (let t = seg.start; t < seg.end; t++) {
        runningAt[t] = seg.pid;
        perProcessSeq[seg.pid]++;
        cellData[seg.pid][t] = {
          seq: perProcessSeq[seg.pid],
          isSegStart: t === seg.start,
          isSegEnd:   t === seg.end - 1,
        };
      }
    }

    // Llenar datos de I/O
    for (const seg of ioGantt) {
      if (!ioCellData[seg.pid]) ioCellData[seg.pid] = {};
      for (let t = seg.start; t < seg.end; t++) {
        ioCellData[seg.pid][t] = {
          resource: seg.resource,
          isSegStart: t === seg.start,
          isSegEnd:   t === seg.end - 1,
        };
      }
    }

    // Cola de listos (usar la precalculada si existe, sino generarla)
    let readyQueueAt = {};
    if (readyQueueByTick) {
      readyQueueAt = readyQueueByTick;
    } else {
      const finishTimes = {};
      for (const m of metrics) finishTimes[m.pid] = m.finish;
      for (let t = 0; t < totalTime; t++) {
        readyQueueAt[t] = processes
          .filter(p =>
            p.arrival <= t &&
            (finishTimes[p.pid] ?? 0) > t &&
            runningAt[t] !== p.pid
          )
          .map(p => p.pid);
      }
    }

    return { cellData, ioCellData, runningAt, readyQueueAt };
  }, [result, gantt, ioGantt, processes, metrics, totalTime, readyQueueByTick]);

  const handlePlayPause = () => {
    if (animTime >= totalTime) { setAnimTime(0); setPlaying(true); }
    else setPlaying(p => !p);
  };

  if (!result) {
    return (
      <div className="gantt-empty">
        <div className="gantt-empty-icon">📊</div>
        <p>Configurá los procesos y presioná <strong>Simular</strong></p>
      </div>
    );
  }

  const times = Array.from({ length: totalTime }, (_, i) => i);
  const done = animTime >= totalTime;
  const colSpanInfo = needsPriority ? 3 : 2;

  return (
    <div className="gantt-container">
      {/* Encabezado y controles */}
      <div className="gantt-header">
        <h2 className="section-title">
          <span className="section-icon">📊</span>
          Diagrama de Gantt {hasIO && <span className="io-label-sm">+ I/O</span>}
        </h2>
        <div className="gantt-controls">
          <div className="btn-group">
            <button className="btn-play" onClick={handlePlayPause}
              title={playing ? 'Pausar' : done ? 'Reiniciar' : 'Reproducir'}>
              {playing ? '⏸' : done ? '↺' : '▶'}
            </button>
            <button className="btn-play btn-play-step"
              onClick={() => { setPlaying(false); setAnimTime(t => Math.max(0, t - 1)); }}
              disabled={animTime <= 0} title="Retroceder un tick">◀</button>
            <button className="btn-play btn-play-step"
              onClick={() => { setPlaying(false); setAnimTime(t => Math.min(totalTime, t + 1)); }}
              disabled={animTime >= totalTime} title="Avanzar un tick">▶</button>
          </div>
          <input type="range" min={0} max={totalTime} value={animTime}
            onChange={e => { setPlaying(false); setAnimTime(Number(e.target.value)); }}
            className="gantt-slider" />
          <span className="gantt-time">t = {animTime}</span>
        </div>
      </div>

      {/* Tabla del diagrama de Gantt */}
      <div className="gantt-scroll">
        <table className="gantt-table">
          <thead>
            <tr>
              <th className="gt-col-proceso">Proceso</th>
              <th className="gt-col-llegada">Llegada</th>
              <th className="gt-col-cpu">CPU</th>
              {needsPriority && <th className="gt-col-prior">Prior.</th>}
              {hasIO && <th className="gt-col-io-header">I/O</th>}
              {times.map(t => (
                <th key={t} className={`gt-col-t ${t >= animTime ? 'gt-future-head' : ''}`}>{t}</th>
              ))}
              <th className="gt-col-tr">TR</th>
              <th className="gt-col-te">TE</th>
            </tr>
          </thead>
          <tbody>
            {processes.map(p => {
              const color = getColor(p.pid, colorMap.current);
              const metric = metrics.find(m => m.pid === p.pid);
              const ioEvts = p.ioEvents || [];

              return (
                <tr key={p.pid} className="gt-process-row">
                  <td className="gt-cell-pid" style={{ borderLeft: `3px solid ${color}` }}>{p.pid}</td>
                  <td className="gt-cell-info">{p.arrival}</td>
                  <td className="gt-cell-info">{p.burst}</td>
                  {needsPriority && <td className="gt-cell-info">{p.priority}</td>}
                  {hasIO && (
                    <td className="gt-cell-info gt-io-compact">
                      {ioEvts.length > 0
                        ? ioEvts.map(e => `(${e.resource},${e.afterCpuTick},${e.duration})`).join(' ')
                        : '—'}
                    </td>
                  )}

                  {times.map(t => {
                    if (t >= animTime) {
                      return <td key={t} className="gt-cell gt-cell-future" />;
                    }

                    // CPU cell
                    const data = cellData[p.pid]?.[t];
                    // I/O cell
                    const ioData = ioCellData[p.pid]?.[t];

                    if (data) {
                      return (
                        <td key={t} className="gt-cell gt-cell-running" style={{
                          background: color + '28',
                          borderTop: `2px solid ${color}`,
                          borderBottom: `2px solid ${color}`,
                          borderLeft: data.isSegStart ? `2px solid ${color}` : `1px solid ${color}40`,
                          borderRight: data.isSegEnd ? `2px solid ${color}` : `1px solid ${color}40`,
                          color: color,
                        }}>
                          <span className="gt-seq">{data.seq}</span>
                        </td>
                      );
                    }

                    if (ioData) {
                      return (
                        <td key={t} className="gt-cell gt-cell-io" style={{
                          background: 'rgba(180,120,255,0.15)',
                          borderTop: '2px solid rgba(180,120,255,0.6)',
                          borderBottom: '2px solid rgba(180,120,255,0.6)',
                          borderLeft: ioData.isSegStart ? '2px solid rgba(180,120,255,0.6)' : '1px solid rgba(180,120,255,0.2)',
                          borderRight: ioData.isSegEnd ? '2px solid rgba(180,120,255,0.6)' : '1px solid rgba(180,120,255,0.2)',
                          color: 'rgba(200,160,255,0.9)',
                        }} title={`I/O: ${ioData.resource}`}>
                          <span className="gt-seq gt-io-label">{ioData.resource}</span>
                        </td>
                      );
                    }

                    // Empty cell
                    const arrived = p.arrival <= t;
                    const finT = metric?.finish ?? 0;
                    const waiting = arrived && finT > t;
                    return (
                      <td key={t} className={`gt-cell ${waiting ? 'gt-cell-waiting' : 'gt-cell-empty'}`} />
                    );
                  })}

                  <td className="gt-cell-metric gt-tr">{done && metric ? metric.turnaround : '—'}</td>
                  <td className="gt-cell-metric gt-te">{done && metric ? metric.waitTime : '—'}</td>
                </tr>
              );
            })}

            {/* Ready Queue row */}
            <tr className="gt-rqueue-row">
              <td className="gt-cell-pid gt-algo-label">{algoShort}</td>
              <td colSpan={colSpanInfo + (hasIO ? 1 : 0)} className="gt-rqueue-title">R Queue</td>
              {times.map(t => {
                if (t >= animTime) return <td key={t} className="gt-cell gt-cell-future" />;
                const q = readyQueueAt[t] || [];
                return (
                  <td key={t} className="gt-cell gt-cell-rqueue">
                    {q.map(pid => pid.replace('P', '')).join(',')}
                  </td>
                );
              })}
              <td colSpan={2} className="gt-avg-cell">
                {done && (
                  <>
                    <span className="gt-avg-label">Prom</span>
                    <span className="gt-avg-tr">{result.stats.avgTurnaround}</span>
                    <span className="gt-avg-te">{result.stats.avgWaitTime}</span>
                  </>
                )}
              </td>
            </tr>

            {/* Resource Queue rows (I/O only) */}
            {hasIO && usedResources.map(resource => (
              <tr key={resource} className="gt-rqueue-row gt-resource-row">
                <td className="gt-cell-pid gt-resource-label">{resource}</td>
                <td colSpan={colSpanInfo + 1} className="gt-rqueue-title"></td>
                {times.map(t => {
                  if (t >= animTime) return <td key={t} className="gt-cell gt-cell-future" />;
                  const q = resourceQueuesByTick[resource]?.[t] || [];
                  return (
                    <td key={t} className="gt-cell gt-cell-resource-queue">
                      {q.map(pid => pid.replace('P', '')).join(',')}
                    </td>
                  );
                })}
                <td colSpan={2} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
