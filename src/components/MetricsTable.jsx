import React from 'react';

export default function MetricsTable({ result }) {
  if (!result) return null;

  const { metrics, stats } = result;

  return (
    <div className="metrics-container">
      <h2 className="section-title">
        <span className="section-icon">📈</span>
        Métricas por Proceso
      </h2>

      <div className="metrics-table-wrap">
        <table className="metrics-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>Llegada</th>
              <th>Tcpu</th>
              <th>Fin</th>
              <th>Tr (Retorno)</th>
              <th>Te (Espera)</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => (
              <tr key={m.pid} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                <td className="pid-cell">
                  <span className="pid-badge">{m.pid}</span>
                </td>
                <td>{m.arrival}</td>
                <td>{m.burst}</td>
                <td>{m.finish}</td>
                <td className="metric-highlight">{m.turnaround}</td>
                <td className="metric-highlight">{m.waitTime}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="metrics-footer">
              <td colSpan={4} className="avg-label">Promedios</td>
              <td className="avg-value">TPR = {stats.avgTurnaround}</td>
              <td className="avg-value">TPE = {stats.avgWaitTime}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.cpuUtilization}%</div>
          <div className="stat-label">Utilización CPU</div>
          <div className="stat-bar-bg">
            <div
              className="stat-bar-fill"
              style={{ width: `${stats.cpuUtilization}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgTurnaround}</div>
          <div className="stat-label">TPR (Promedio Retorno)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgWaitTime}</div>
          <div className="stat-label">TPE (Promedio Espera)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalTime}</div>
          <div className="stat-label">Tiempo Total</div>
        </div>
      </div>
    </div>
  );
}
