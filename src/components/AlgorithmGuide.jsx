import React, { useState } from 'react';
import guides from '../data/algorithmGuides.js';

export default function AlgorithmGuide({ algorithmId }) {
  const [open, setOpen] = useState(false);

  const guide = guides[algorithmId];
  if (!guide) return null;

  return (
    <div className="guide-wrapper">
      <button className="guide-toggle" onClick={() => setOpen(o => !o)}>
        <span className="guide-toggle-icon">📖</span>
        <span>{open ? 'Ocultar guía' : 'Guía de estudio'}</span>
        <span className={`guide-chevron ${open ? 'guide-chevron-open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="guide-panel">
          {/* Encabezado */}
          <div className="guide-header">
            <span className="guide-emoji">{guide.emoji}</span>
            <div>
              <h3 className="guide-name">{guide.name}</h3>
              <span className="guide-fullname">{guide.fullName}</span>
            </div>
            <span className={`guide-type-badge ${guide.type === 'Expulsivo' ? 'badge-preemptive' : 'badge-non-preemptive'}`}>
              {guide.type}
            </span>
          </div>

          {/* Resumen general */}
          <p className="guide-summary">{guide.summary}</p>

          {/* Conceptos principales */}
          {guide.concepts && (
            <div className="guide-section">
              <h4 className="guide-section-title">
                <span>📘</span> Conceptos clave
              </h4>
              <div className="guide-concepts">
                {guide.concepts.map((c, i) => (
                  <div key={i} className="guide-concept">
                    <span className="concept-term">{c.term}</span>
                    <span className="concept-def">{c.def}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mecánica del algoritmo */}
          <div className="guide-section">
            <h4 className="guide-section-title">
              <span>⚙️</span> ¿Cómo funciona?
            </h4>
            <ol className="guide-steps">
              {guide.howItWorks.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Reglas de desempate */}
          {guide.tieBreaking && (
            <div className="guide-tiebreak">
              <span className="tiebreak-icon">⚖️</span>
              <div>
                <strong>Regla de desempate:</strong> {guide.tieBreaking}
              </div>
            </div>
          )}

          {/* Ventajas y Desventajas */}
          <div className="guide-columns">
            <div className="guide-section guide-pro">
              <h4 className="guide-section-title">
                <span>✅</span> Ventajas
              </h4>
              <ul className="guide-list">
                {guide.advantages.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="guide-section guide-con">
              <h4 className="guide-section-title">
                <span>❌</span> Desventajas
              </h4>
              <ul className="guide-list">
                {guide.disadvantages.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ejemplo ilustrativo */}
          {guide.example && (
            <div className="guide-section guide-example-section">
              <h4 className="guide-section-title">
                <span>💡</span> Ejemplo paso a paso
              </h4>
              <div className="guide-example-block">
                <div className="example-row">
                  <span className="example-label">Procesos:</span>
                  <span className="example-value">{guide.example.processes}</span>
                </div>
                <div className="example-row">
                  <span className="example-label">Ejecución:</span>
                  <span className="example-value">{guide.example.execution}</span>
                </div>
                <div className="example-analysis">
                  <span className="example-analysis-icon">🔍</span>
                  <span>{guide.example.analysis}</span>
                </div>
              </div>
            </div>
          )}

          {/* Consejos para parciales */}
          {guide.examTips && (
            <div className="guide-section guide-tip-section">
              <h4 className="guide-section-title">
                <span>🎯</span> Tips para el parcial
              </h4>
              <ul className="guide-tips-list">
                {guide.examTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Pregunta conceptual */}
          {guide.keyQuestion && (
            <div className="guide-key-question">
              <span className="kq-icon">❓</span>
              <div>
                <strong>Pregunta clave:</strong> {guide.keyQuestion}
              </div>
            </div>
          )}

          {/* Aplicación en Sistemas Operativos reales */}
          {guide.realWorld && (
            <div className="guide-section guide-real-section">
              <h4 className="guide-section-title">
                <span>🌍</span> Uso en el mundo real
              </h4>
              <p className="guide-real-text">{guide.realWorld}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
