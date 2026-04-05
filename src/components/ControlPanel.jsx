import React, { useState, useEffect } from 'react';
import { ALGORITHMS } from '../algorithms/index.js';
import { DIFFICULTIES } from '../utils/exerciseGenerator.js';

const DEFAULT_PROCESSES = [
  { pid: 'P1', arrival: 0, burst: 8, priority: 3 },
  { pid: 'P2', arrival: 1, burst: 4, priority: 1 },
  { pid: 'P3', arrival: 2, burst: 9, priority: 2 },
  { pid: 'P4', arrival: 3, burst: 5, priority: 4 },
];

export default function ControlPanel({
  processes,
  setProcesses,
  algorithm,
  setAlgorithm,
  quantum,
  setQuantum,
  onSimulate,
  onReset,
  practiceMode,
  difficulty,
  setDifficulty,
  onGenerateExercise,
  onStartPractice,
  ioEnabled,
  setIoEnabled,
}) {
  const algoDef = ALGORITHMS.find(a => a.id === algorithm);
  const needsQuantum = algoDef?.needsQuantum;
  const needsPriority = algoDef?.needsPriority;

  // I/O add form state
  const [editingIO, setEditingIO] = useState(null); // index of process being edited

  // Limpiar panel de edición si desactivan I/O globalmente
  useEffect(() => {
    if (!ioEnabled && editingIO !== null) {
      setEditingIO(null);
    }
  }, [ioEnabled, editingIO]);

  const addProcess = () => {
    if (processes.length >= 15) {
      alert("Límite máximo de procesos alcanzado (15).");
      return;
    }
    const nextNum = processes.length + 1;
    setProcesses([
      ...processes,
      { pid: `P${nextNum}`, arrival: 0, burst: 1, priority: 1, ioEvents: [] },
    ]);
  };

  const removeProcess = (idx) => {
    if (processes.length <= 1) return;
    setProcesses(processes.filter((_, i) => i !== idx));
  };

  const updateProcess = (idx, field, value) => {
    const updated = [...processes];
    let finalValue = value;
    
    if (field !== 'pid') {
      finalValue = parseInt(value, 10);
      if (isNaN(finalValue)) {
        // Fallback robusto a mínimos válidos para no dejar NaN
        finalValue = field === 'burst' ? 1 : 0;
      } else {
        finalValue = Math.max(field === 'burst' || field === 'priority' ? 1 : 0, finalValue);
      }
    }

    updated[idx] = {
      ...updated[idx],
      [field]: finalValue,
    };
    setProcesses(updated);
  };

  const addIOEvent = (idx) => {
    const updated = [...processes];
    const p = updated[idx];
    const events = p.ioEvents || [];
    events.push({ resource: 'R1', afterCpuTick: 1, duration: 1 });
    updated[idx] = { ...p, ioEvents: events };
    setProcesses(updated);
  };

  const updateIOEvent = (pidx, eidx, field, value) => {
    const updated = [...processes];
    const events = [...(updated[pidx].ioEvents || [])];
    events[eidx] = {
      ...events[eidx],
      [field]: field === 'resource' ? value : Math.max(1, Number(value)),
    };
    updated[pidx] = { ...updated[pidx], ioEvents: events };
    setProcesses(updated);
  };

  const removeIOEvent = (pidx, eidx) => {
    const updated = [...processes];
    const events = [...(updated[pidx].ioEvents || [])];
    events.splice(eidx, 1);
    updated[pidx] = { ...updated[pidx], ioEvents: events };
    setProcesses(updated);
  };

  const loadDefaults = () => setProcesses(DEFAULT_PROCESSES);

  // Format I/O events count
  const formatIO = (events) => {
    if (!events || events.length === 0) return '—';
    return `${events.length} evt${events.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="control-panel">
      {/* Algorithm Selector */}
      <div className="panel-section">
        <h2 className="section-title">
          <span className="section-icon">⚙️</span>
          Algoritmo
        </h2>
        <div className="algo-grid">
          {ALGORITHMS.map(algo => (
            <button
              key={algo.id}
              className={`algo-btn ${algorithm === algo.id ? 'active' : ''}`}
              onClick={() => setAlgorithm(algo.id)}
            >
              {algo.label}
            </button>
          ))}
        </div>

        {needsQuantum && (
          <div className="quantum-config">
            <label className="config-label">
              <span>Quantum (Q)</span>
              <div className="quantum-input-wrap">
                <button
                  className="q-btn"
                  onClick={() => setQuantum(Math.max(1, quantum - 1))}
                >−</button>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={quantum}
                  onChange={e => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                  className="quantum-input"
                />
                <button
                  className="q-btn"
                  onClick={() => setQuantum(quantum + 1)}
                >+</button>
              </div>
            </label>
          </div>
        )}

        {/* I/O Toggle */}
        <label className="io-toggle">
          <input
            type="checkbox"
            checked={ioEnabled}
            onChange={e => setIoEnabled(e.target.checked)}
          />
          <span className="io-toggle-label">
            💾 Con ráfagas de I/O
          </span>
        </label>
      </div>

      {/* Random Exercise Generator — only in practice mode */}
      {practiceMode && (
        <div className="panel-section practice-gen-section">
          <h2 className="section-title">
            <span className="section-icon">🎲</span>
            Ejercicio
          </h2>
          <div className="practice-gen-controls">
            <div className="difficulty-selector">
              {Object.entries(DIFFICULTIES).map(([key, val]) => (
                <button
                  key={key}
                  className={`diff-btn ${difficulty === key ? 'diff-btn-active' : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  {val.label}
                </button>
              ))}
            </div>
            <button className="btn-random btn-random-full" onClick={onGenerateExercise}>
              🎲 Generar aleatorio
            </button>
          </div>
          <p className="practice-gen-hint">
            O completá los procesos manualmente abajo ↓
          </p>
        </div>
      )}

      {/* Process Table */}
      <div className="panel-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon">📋</span>
            Procesos
          </h2>
          <div className="table-actions">
            <button className="btn-ghost" onClick={loadDefaults}>Ejemplo</button>
            <button className="btn-add" onClick={addProcess}>+ Agregar</button>
          </div>
        </div>

        {/* I/O Editor Panel — above the table */}
        {ioEnabled && editingIO !== null && processes[editingIO] && (() => {
          const p = processes[editingIO];
          const idx = editingIO;
          return (
            <div className="io-editor-panel">
              <div className="io-events-editor">
                <div className="io-events-title">
                  <div className="io-title-left">
                    <span>💾 {'I/O de '}<strong>{p.pid}</strong></span>
                    <button className="btn-add-io" onClick={() => addIOEvent(idx)}>
                      + Agregar I/O
                    </button>
                  </div>
                  <button className="btn-remove io-close-btn" onClick={() => setEditingIO(null)}>✕</button>
                </div>
                {(!p.ioEvents || p.ioEvents.length === 0) && (
                  <span className="io-empty">Sin eventos de I/O. Hacé click en "+ Agregar I/O" para añadir.</span>
                )}
                {(p.ioEvents || []).map((ev, eidx) => (
                  <div key={eidx} className="io-event-row">
                    <select
                      value={ev.resource}
                      onChange={e => updateIOEvent(idx, eidx, 'resource', e.target.value)}
                      className="io-select"
                    >
                      {['R1','R2','R3','R4','R5'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <label className="io-field" title="Tras tick (Instante de CPU)">
                      <span>Inst.</span>
                      <input
                        type="number"
                        min="1"
                        max={p.burst - 1}
                        value={ev.afterCpuTick}
                        onChange={e => updateIOEvent(idx, eidx, 'afterCpuTick', e.target.value)}
                        className="io-input"
                      />
                    </label>
                    <label className="io-field" title="Duración del evento I/O">
                      <span>Dur.</span>
                      <input
                        type="number"
                        min="1"
                        value={ev.duration}
                        onChange={e => updateIOEvent(idx, eidx, 'duration', e.target.value)}
                        className="io-input"
                      />
                    </label>
                    <button className="btn-remove" onClick={() => removeIOEvent(idx, eidx)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="process-table-wrap">
          <table className="process-table">
            <thead>
              <tr>
                <th title="Process ID">PID</th>
                <th title="Tiempo de llegada">Lleg.</th>
                <th title="Tiempo de CPU (Ráfaga)">CPU</th>
                {needsPriority && <th title="Prioridad">Prio.</th>}
                {ioEnabled && <th title="Eventos I/O">I/O</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {processes.map((p, idx) => (
                <tr key={idx} className={`process-row ${editingIO === idx ? 'process-row-editing' : ''}`}>
                  <td>
                    <input
                      className="cell-input pid-input"
                      value={p.pid}
                      onChange={e => updateProcess(idx, 'pid', e.target.value)}
                      maxLength={4}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      type="number"
                      min="0"
                      value={p.arrival}
                      onChange={e => updateProcess(idx, 'arrival', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      type="number"
                      min="1"
                      value={p.burst}
                      onChange={e => updateProcess(idx, 'burst', e.target.value)}
                    />
                  </td>
                  {needsPriority && (
                    <td>
                      <input
                        className="cell-input"
                        type="number"
                        min="1"
                        value={p.priority}
                        onChange={e => updateProcess(idx, 'priority', e.target.value)}
                      />
                    </td>
                  )}
                  {ioEnabled && (
                    <td>
                      <button
                        className={`io-cell-btn ${editingIO === idx ? 'io-cell-btn-active' : ''}`}
                        onClick={() => setEditingIO(editingIO === idx ? null : idx)}
                        title="Editar eventos de I/O"
                      >
                        {formatIO(p.ioEvents)}
                        <span className="io-edit-icon">✏️</span>
                      </button>
                    </td>
                  )}
                  <td>
                    <button
                      className="btn-remove"
                      onClick={() => removeProcess(idx)}
                      disabled={processes.length <= 1}
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="panel-actions">
        {onSimulate && (
          <button className="btn-simulate" onClick={onSimulate}>
            <span className="btn-icon">▶</span>
            Simular
          </button>
        )}
        {practiceMode && onStartPractice && (
          <button className="btn-simulate btn-start-practice-left" onClick={onStartPractice}>
            <span className="btn-icon">📝</span>
            Iniciar práctica
          </button>
        )}
        <button className="btn-reset" onClick={onReset}>
          Limpiar
        </button>
      </div>
    </div>
  );
}
