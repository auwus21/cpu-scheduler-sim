import React from 'react';

/**
 * Tabla de métricas editable para el modo práctica.
 * El alumno completa TR y TE de cada proceso y los promedios.
 */
export default function PracticeMetrics({
  processes,
  userMetrics,
  setUserMetrics,
  corrected,
  metricsResults,
}) {
  const handleChange = (pid, field, value) => {
    setUserMetrics(prev => ({
      ...prev,
      [pid]: { ...prev[pid], [field]: value },
    }));
  };

  return (
    <div className="practice-metrics">
      <h3 className="section-title">
        <span className="section-icon">📊</span>
        Métricas — Completá TR y TE de cada proceso
      </h3>
      <div className="practice-metrics-table-wrap">
        <table className="practice-metrics-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>LLEGADA</th>
              <th>TCPU</th>
              <th>
                TR (Retorno)
                <div className="th-hint">T_fin − T_llegada</div>
              </th>
              <th>
                TE (Espera)
                <div className="th-hint">TR − TCPU</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {processes.map(p => {
              const um = userMetrics[p.pid] || {};
              const mr = metricsResults?.[p.pid];
              return (
                <tr key={p.pid}>
                  <td className="pm-pid">{p.pid}</td>
                  <td className="pm-info">{p.arrival}</td>
                  <td className="pm-info">{p.burst}</td>
                  <td className="pm-input-cell">
                    {corrected ? (
                      <div className={`pm-result ${mr?.tr.isCorrect ? 'pm-correct' : 'pm-wrong'}`}>
                        <span className="pm-user-val">{um.tr || '—'}</span>
                        {!mr?.tr.isCorrect && (
                          <span className="pm-correct-val"> → {mr?.tr.correct}</span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="number"
                        className="pm-input"
                        value={um.tr || ''}
                        onChange={e => handleChange(p.pid, 'tr', e.target.value)}
                        placeholder="?"
                      />
                    )}
                  </td>
                  <td className="pm-input-cell">
                    {corrected ? (
                      <div className={`pm-result ${mr?.te.isCorrect ? 'pm-correct' : 'pm-wrong'}`}>
                        <span className="pm-user-val">{um.te || '—'}</span>
                        {!mr?.te.isCorrect && (
                          <span className="pm-correct-val"> → {mr?.te.correct}</span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="number"
                        className="pm-input"
                        value={um.te || ''}
                        onChange={e => handleChange(p.pid, 'te', e.target.value)}
                        placeholder="?"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
