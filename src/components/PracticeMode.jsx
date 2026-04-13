import React, { useState, useCallback, useRef, useEffect } from 'react';
import PracticeGantt from './PracticeGantt.jsx';
import HistoryPanel from './HistoryPanel.jsx';
import { runSimulation, runSimulationIO, ALGORITHMS } from '../algorithms/index.js';
import { correctPractice } from '../utils/practiceCorrector.js';
import { generateExercise } from '../utils/exerciseGenerator.js';
import { saveResult, loadHistory, getAchievements, encodeExercise, decodeExercise } from '../utils/practiceHistory.js';
import html2canvas from 'html2canvas';

export default function PracticeMode({
  processes, setProcesses, algorithm, setAlgorithm, quantum, setQuantum,
  difficulty, setDifficulty, practicePhase, setPracticePhase, ioEnabled,
}) {
  const [filledCells, setFilledCells] = useState({});
  const [filledIOCells, setFilledIOCells] = useState({});
  const [userMetrics, setUserMetrics] = useState({});
  const [correction, setCorrection] = useState(null);
  const [correctResult, setCorrectResult] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [exportMsg, setExportMsg] = useState('');
  const [newAchievement, setNewAchievement] = useState(null);

  // States for user queues and export
  const [userReadyQueue, setUserReadyQueue] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  // Pilas de Deshacer/Rehacer
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const algoDef = ALGORITHMS.find(a => a.id === algorithm);
  const phase = practicePhase;

  const pushUndo = useCallback((state) => {
    setUndoStack(prev => [...prev.slice(-19), state]);
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, filledCells]);
    setFilledCells(prev);
    setUndoStack(s => s.slice(0, -1));
  }, [undoStack, filledCells]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, filledCells]);
    setFilledCells(next);
    setRedoStack(r => r.slice(0, -1));
  }, [redoStack, filledCells]);

  // Atajos de teclado: Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handler = (e) => {
      if (phase !== 'practicing') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleUndo, handleRedo]);

  // Comprobar si el I/O global está activo Y algún proceso tiene eventos de I/O
  const hasIO = ioEnabled && processes.some(p => p.ioEvents && p.ioEvents.length > 0);

  const startPractice = useCallback(() => {
    let result;
    if (hasIO) {
      result = runSimulationIO(algorithm, processes, quantum);
    } else {
      result = runSimulation(algorithm, processes, quantum);
    }
    if (!result) return;
    setCorrectResult(result);
    setTotalTime(Number(result.stats.totalTime));
    setFilledCells({});
    setFilledIOCells({});
    setUserMetrics({});
    setUserReadyQueue({});
    setCorrection(null);
    setShowSolution(false);
    setUndoStack([]);
    setRedoStack([]);
    setPracticePhase('practicing');
  }, [algorithm, processes, quantum, setPracticePhase, hasIO]);

  useEffect(() => {
    if (practicePhase === 'start-requested') startPractice();
  }, [practicePhase, startPractice]);

  const handleCorrect = useCallback(() => {
    if (!correctResult) return;
    const result = correctPractice(
      filledCells, userMetrics, correctResult, processes,
      filledIOCells
    );
    setCorrection(result);
    setPracticePhase('corrected');

    // Guardar resultado en el historial
    const prevAch = getAchievements(loadHistory());
    saveResult({
      algorithm, totalScore: result.totalScore,
      ganttScore: result.ganttScore, metricsScore: result.metricsScore,
      ioScore: result.ioScore,
      processCount: processes.length, hasIO,
    });
    const newAch = getAchievements(loadHistory());
    const justUnlocked = newAch.find((a, i) => a.unlocked && !prevAch[i].unlocked);
    if (justUnlocked) {
      setNewAchievement(justUnlocked);
      setTimeout(() => setNewAchievement(null), 4000);
    }
  }, [filledCells, filledIOCells, userMetrics, correctResult, processes, algorithm, setPracticePhase, hasIO]);

  const handleRetry = () => {
    setFilledCells({});
    setFilledIOCells({});
    setUserMetrics({});
    setUserReadyQueue({});
    setCorrection(null);
    setShowSolution(false);
    setUndoStack([]);
    setRedoStack([]);
    setPracticePhase('practicing');
  };

  const handleContinueEditing = () => {
    setCorrection(null);
    setShowSolution(false);
    setPracticePhase('practicing');
  };

  const handleRandomExercise = () => {
    const ex = generateExercise(difficulty);
    setProcesses(ex.processes);
    setAlgorithm(ex.algorithm);
    setQuantum(ex.quantum);
    setPracticePhase('idle');
    setCorrection(null);
    setShowSolution(false);
  };

  // Exportación a imagen
  const handleExport = () => {
    const el = document.getElementById('practice-gantt-export');
    if (!el) return;
    setExportMsg('Generando imagen...');
    setIsExporting(true);

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(el, {
          backgroundColor: '#0f1729',
          scale: 2,
          useCORS: true,
        });
        const link = document.createElement('a');
        link.download = `CPUSim_${algoDef?.label || algorithm}_${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        setExportMsg('✅ Imagen descargada');
        setTimeout(() => setExportMsg(''), 2000);
      } catch (err) {
        setExportMsg('❌ Error al exportar');
        setTimeout(() => setExportMsg(''), 3000);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  // Compartir ejercicio
  const handleShare = () => {
    const code = encodeExercise(processes, algorithm, quantum);
    setShareCode(code);
    setShowShareModal(true);
  };

  const handleImport = () => {
    const data = decodeExercise(importCode.trim());
    if (!data) {
      setImportError('Código inválido. Pedile el código correcto a tu compañero.');
      return;
    }
    setProcesses(data.processes);
    setAlgorithm(data.algorithm);
    setQuantum(data.quantum);
    setImportError('');
    setImportCode('');
    setShowShareModal(false);
    setPracticePhase('idle');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(shareCode);
    setExportMsg('📋 Código copiado');
    setTimeout(() => setExportMsg(''), 2000);
  };

  const getScoreEmoji = s => s >= 90 ? '🏆' : s >= 70 ? '🎯' : s >= 50 ? '💪' : '📚';
  const getScoreMessage = s => s === 100 ? '¡Perfecto! Dominas este algoritmo.' :
    s >= 90 ? '¡Excelente! Casi perfecto.' : s >= 70 ? '¡Muy bien! Revisá los detalles.' :
    s >= 50 ? 'Buen intento. Revisá las celdas en rojo.' : 'Seguí practicando. Revisá la guía.';

  const COLORS_SOL = ['#6c63ff','#00d4ff','#ff6b6b','#ffd93d','#6bcb77','#ff922b'];

  return (
    <div className="practice-container">
      {/* Barra de utilidades */}
      <div className="practice-toolbar">
        <button className="ptool-btn" onClick={() => setShowHistory(true)} title="Historial y estadísticas">
          📈 Mi progreso
        </button>
        <button className="ptool-btn" onClick={handleShare} title="Compartir o importar ejercicio">
          🔗 Compartir
        </button>
        {(phase === 'practicing' || phase === 'corrected') && (
          <>
            <button className="ptool-btn" onClick={handleExport} title="Descargar Gantt como imagen">
              📤 Exportar
            </button>
            {phase === 'practicing' && (
              <>
                <button className="ptool-btn" onClick={handleUndo} disabled={undoStack.length === 0} title="Deshacer (Ctrl+Z)">
                  ↩️ Deshacer
                </button>
                <button className="ptool-btn" onClick={handleRedo} disabled={redoStack.length === 0} title="Rehacer (Ctrl+Y)">
                  ↪️ Rehacer
                </button>
              </>
            )}
          </>
        )}
        {exportMsg && <span className="ptool-msg">{exportMsg}</span>}
      </div>

      {/* Notificación de logro desbloqueado */}
      {newAchievement && (
        <div className="achievement-toast">
          <span className="achievement-toast-icon">{newAchievement.icon}</span>
          <div>
            <strong>¡Logro desbloqueado!</strong>
            <span>{newAchievement.label} — {newAchievement.desc}</span>
          </div>
        </div>
      )}

      {/* Información del algoritmo activo */}
      {phase !== 'idle' && (
        <div className="practice-algo-info">
          <span className="practice-algo-label">Algoritmo:</span>
          <span className="practice-algo-badge">{algoDef?.label}</span>
          {algoDef?.needsQuantum && (
            <span className="practice-algo-badge practice-algo-quantum">Q = {quantum}</span>
          )}
        </div>
      )}

      {/* Estado inactivo (esperando inicio de práctica) */}
      {phase === 'idle' && (
        <div className="practice-idle">
          <div className="practice-idle-card">
            <div className="practice-idle-emoji">📝</div>
            <h3>Configurá los procesos en el panel izquierdo</h3>
            <p>Generá un ejercicio aleatorio, importá uno de un compañero, o cargá uno de la práctica.</p>
          </div>
        </div>
      )}

      {/* Estado de práctica o corrección */}
      {(phase === 'practicing' || phase === 'corrected') && (
        <>
          {/* Banner de puntuación */}
          {phase === 'corrected' && correction && (
            <div className="practice-score-banner">
              <div className="score-main">
                <span className="score-emoji">{getScoreEmoji(correction.totalScore)}</span>
                <span className="score-number">{correction.totalScore}%</span>
                <span className="score-message">{getScoreMessage(correction.totalScore)}</span>
              </div>
              <div className="score-breakdown">
                <div className="score-item"><span className="score-item-label">Gantt CPU</span><span className="score-item-value">{correction.ganttScore}%</span></div>
                {correction.hasIO && <div className="score-item"><span className="score-item-label">I/O</span><span className="score-item-value">{correction.ioScore}%</span></div>}
                <div className="score-item"><span className="score-item-label">Métricas</span><span className="score-item-value">{correction.metricsScore}%</span></div>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          {phase === 'practicing' && (
            <div className="practice-instructions">
              <span>💡</span>
              <span>
                <strong>Click + arrastrar</strong> para pintar celdas CPU.
                {hasIO && <> Usá el <strong>toggle 💾 I/O</strong> para pintar celdas de I/O.</>}
                {' '}<strong>Ctrl+Z</strong> para deshacer.
                Solo completá <strong>R Queue</strong> (opcional) y <strong>TR/TE</strong>.
              </span>
            </div>
          )}

          {/* Cuadrícula de Gantt interactiva */}
          <PracticeGantt
            processes={processes} totalTime={totalTime}
            filledCells={filledCells} setFilledCells={setFilledCells}
            filledIOCells={filledIOCells} setFilledIOCells={setFilledIOCells}
            userMetrics={userMetrics} setUserMetrics={setUserMetrics}
            cellResults={correction?.cellResults} corrected={phase === 'corrected' && !isExporting}
            correctCells={correction?.correctCells}
            ioCellResults={correction?.ioCellResults}
            correctIOCells={correction?.correctIOCells}
            correctRQ={correctResult?.readyQueueByTick}
            metricsResults={correction?.metricsResults}
            algorithmId={algorithm}
            undoStack={undoStack} pushUndo={pushUndo}
            hasIO={hasIO}
            usedResources={correctResult?.usedResources || []}
            userReadyQueue={userReadyQueue}
            setUserReadyQueue={setUserReadyQueue}
            isExporting={isExporting}
          />

          {/* Acciones principales */}
          <div className="practice-actions">
            {phase === 'practicing' && (
              <button className="btn-correct" onClick={handleCorrect}>✅ Corregir</button>
            )}
            {phase === 'corrected' && (
              <>
                <button className="btn-correct" onClick={handleContinueEditing}>✏️ Seguir editando</button>
                <button className="btn-retry" onClick={handleRetry}>🔄 Empezar de cero</button>
                <button className="btn-solution" onClick={() => setShowSolution(s => !s)}>
                  {showSolution ? '🙈 Ocultar solución' : '👁 Ver solución'}
                </button>
                <button className="btn-random" onClick={handleRandomExercise}>🎲 Nuevo ejercicio</button>
              </>
            )}
          </div>

          {/* Solución del algoritmo */}
          {showSolution && correctResult && (
            <div className="practice-solution" id="practice-solution-export">
              <h4 className="section-title"><span className="section-icon">✨</span> Solución correcta</h4>
              <div className="gantt-scroll">
                <table className="gantt-table">
                  <thead>
                    <tr>
                      <th className="gt-col-proceso">Proceso</th>
                      <th className="gt-col-llegada">Llegada</th>
                      <th className="gt-col-cpu">CPU</th>
                      {Array.from({ length: totalTime }, (_, i) => <th key={i} className="gt-col-t">{i}</th>)}
                      <th className="gt-col-tr">TR</th>
                      <th className="gt-col-te">TE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map((p, idx) => {
                      const cells = correction?.correctCells?.[p.pid] || new Set();
                      const sorted = [...cells].sort((a, b) => a - b);
                      const color = COLORS_SOL[idx % COLORS_SOL.length];
                      const segMap = {};
                      let seq = 0;
                      sorted.forEach(t => { seq++; segMap[t] = { seq, isSegStart: !cells.has(t-1), isSegEnd: !cells.has(t+1) }; });
                      const metric = correctResult.metrics.find(m => m.pid === p.pid);
                      return (
                        <tr key={p.pid} className="gt-process-row">
                          <td className="gt-cell-pid" style={{ borderLeft: `3px solid ${color}` }}>{p.pid}</td>
                          <td className="gt-cell-info">{p.arrival}</td>
                          <td className="gt-cell-info">{p.burst}</td>
                          {Array.from({ length: totalTime }, (_, t) => {
                            const data = segMap[t];
                            if (data) return (
                              <td key={t} className="gt-cell gt-cell-running" style={{
                                background: color + '28', borderTop: `2px solid ${color}`, borderBottom: `2px solid ${color}`,
                                borderLeft: data.isSegStart ? `2px solid ${color}` : `1px solid ${color}40`,
                                borderRight: data.isSegEnd ? `2px solid ${color}` : `1px solid ${color}40`,
                                color,
                              }}><span className="gt-seq">{data.seq}</span></td>
                            );
                            return <td key={t} className="gt-cell gt-cell-empty" />;
                          })}
                          <td className="gt-cell-metric gt-tr">{metric?.turnaround ?? '—'}</td>
                          <td className="gt-cell-metric gt-te">{metric?.waitTime ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Panel del historial */}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}

      {/* Modal de compartir e importar */}
      {showShareModal && (
        <div className="history-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={e => e.stopPropagation()}>
            <div className="history-header">
              <h2>🔗 Compartir / Importar</h2>
              <button className="history-close" onClick={() => setShowShareModal(false)}>✕</button>
            </div>
            <div className="share-section">
              <h3>📤 Compartir este ejercicio</h3>
              <p className="share-hint">Copiá este código y pasáselo a un compañero:</p>
              <div className="share-code-wrap">
                <input className="share-code-input" value={shareCode} readOnly onClick={e => e.target.select()} />
                <button className="btn-add" onClick={copyCode}>📋 Copiar</button>
              </div>
            </div>
            <div className="share-section">
              <h3>📥 Importar ejercicio</h3>
              <p className="share-hint">Pegá el código que te compartieron:</p>
              <div className="share-code-wrap">
                <input className="share-code-input" value={importCode} onChange={e => setImportCode(e.target.value)} placeholder="Pegá el código acá..." />
                <button className="btn-add" onClick={handleImport}>Cargar</button>
              </div>
              {importError && <p className="share-error">{importError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
