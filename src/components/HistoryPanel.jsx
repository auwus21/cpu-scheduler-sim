import React, { useState, useMemo } from 'react';
import { ALGORITHMS } from '../algorithms/index.js';
import {
  loadHistory,
  clearHistory,
  computeStats,
  getAchievements,
} from '../utils/practiceHistory.js';

/**
 * Panel de historial, estadísticas y logros.
 */
export default function HistoryPanel({ onClose, onImport }) {
  const [history, setHistory] = useState(() => loadHistory());
  const [tab, setTab] = useState('stats'); // stats | history | achievements

  const stats = useMemo(() => computeStats(history), [history]);
  const achievements = useMemo(() => getAchievements(history), [history]);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const handleClear = () => {
    if (window.confirm('¿Borrar todo el historial de práctica?')) {
      clearHistory();
      setHistory([]);
    }
  };

  const algoLabel = id => ALGORITHMS.find(a => a.id === id)?.label || id;

  const formatDate = iso => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const scoreColor = score => {
    if (score >= 90) return 'var(--clr-green)';
    if (score >= 70) return '#ffd93d';
    if (score >= 50) return '#ff922b';
    return 'var(--clr-red)';
  };

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={e => e.stopPropagation()}>
        <div className="history-header">
          <h2>📈 Mi progreso</h2>
          <button className="history-close" onClick={onClose}>✕</button>
        </div>

        {/* Pestañas de navegación */}
        <div className="history-tabs">
          <button
            className={`htab ${tab === 'stats' ? 'htab-active' : ''}`}
            onClick={() => setTab('stats')}
          >
            📊 Estadísticas
          </button>
          <button
            className={`htab ${tab === 'history' ? 'htab-active' : ''}`}
            onClick={() => setTab('history')}
          >
            📋 Historial ({history.length})
          </button>
          <button
            className={`htab ${tab === 'achievements' ? 'htab-active' : ''}`}
            onClick={() => setTab('achievements')}
          >
            🏆 Logros ({unlockedCount}/{achievements.length})
          </button>
        </div>

        {/* Pestaña de estadísticas */}
        {tab === 'stats' && (
          <div className="history-content">
            {history.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">📝</div>
                <p>No hay ejercicios completados aún.</p>
                <p className="history-empty-sub">Completá un ejercicio en modo práctica para ver tus estadísticas.</p>
              </div>
            ) : (
              <>
                {/* Tarjetas de resumen */}
                <div className="stats-summary">
                  <div className="stat-card">
                    <span className="stat-value">{history.length}</span>
                    <span className="stat-label">Ejercicios</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value" style={{ color: scoreColor(Math.round(history.reduce((s,e) => s + e.totalScore, 0) / history.length)) }}>
                      {Math.round(history.reduce((s,e) => s + e.totalScore, 0) / history.length)}%
                    </span>
                    <span className="stat-label">Promedio</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value" style={{ color: 'var(--clr-green)' }}>
                      {Math.max(...history.map(e => e.totalScore))}%
                    </span>
                    <span className="stat-label">Mejor</span>
                  </div>
                </div>

                {/* Estadísticas por algoritmo */}
                <h3 className="stats-section-title">Por algoritmo</h3>
                <div className="stats-algo-grid">
                  {Object.entries(stats).map(([alg, s]) => (
                    <div key={alg} className="stats-algo-card">
                      <div className="stats-algo-name">{algoLabel(alg)}</div>
                      <div className="stats-algo-row">
                        <span>{s.attempts} intento{s.attempts !== 1 ? 's' : ''}</span>
                        <span style={{ color: scoreColor(s.avgScore) }}>
                          Prom: {s.avgScore}%
                        </span>
                        <span style={{ color: 'var(--clr-green)' }}>
                          Mejor: {s.bestScore}%
                        </span>
                      </div>
                      <div className="stats-bar-bg">
                        <div
                          className="stats-bar-fill"
                          style={{ width: `${s.avgScore}%`, background: scoreColor(s.avgScore) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Pestaña de historial */}
        {tab === 'history' && (
          <div className="history-content">
            {history.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">📋</div>
                <p>Sin historial todavía.</p>
              </div>
            ) : (
              <>
                <div className="history-list">
                  {history.map((entry, idx) => (
                    <div key={entry.id || idx} className="history-item">
                      <div className="history-item-left">
                        <span className="history-item-algo">{algoLabel(entry.algorithm)}</span>
                        <span className="history-item-date">{formatDate(entry.date)}</span>
                        <span className="history-item-procs">{entry.processCount || '?'} procesos</span>
                      </div>
                      <div className="history-item-right">
                        <span
                          className="history-item-score"
                          style={{ color: scoreColor(entry.totalScore) }}
                        >
                          {entry.totalScore}%
                        </span>
                        <div className="history-item-breakdown">
                          <span>G:{entry.ganttScore}%</span>
                          <span>M:{entry.metricsScore}%</span>
                          <span>R:{entry.rqScore}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-clear-history" onClick={handleClear}>
                  🗑️ Borrar historial
                </button>
              </>
            )}
          </div>
        )}

        {/* Pestaña de logros */}
        {tab === 'achievements' && (
          <div className="history-content">
            <div className="achievements-grid">
              {achievements.map(a => (
                <div
                  key={a.id}
                  className={`achievement-card ${a.unlocked ? 'achievement-unlocked' : 'achievement-locked'}`}
                >
                  <span className="achievement-icon">{a.icon}</span>
                  <div className="achievement-info">
                    <span className="achievement-label">{a.label}</span>
                    <span className="achievement-desc">{a.desc}</span>
                  </div>
                  {a.unlocked && <span className="achievement-check">✅</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
