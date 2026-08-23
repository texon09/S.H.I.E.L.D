import React from 'react';

export default function ScanHistory({ history, historyLoading }) {
  return (
    <div className="history-wrapper">
      <div className="settings-header">
        <h2 className="settings-title">Recent Scan History</h2>
      </div>

      {historyLoading && history.length === 0 ? (
        <div className="search-loader">
          <div className="circle-spinner"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="history-card-table">
          <div className="no-logs-box">No links scanned recently. Use the dashboard to scan!</div>
        </div>
      ) : (
        <div className="history-card-table">
          <div className="table-scroller">
            <table>
              <thead>
                <tr>
                  <th>Scanned URL</th>
                  <th>Risk Verdict</th>
                  <th>Score</th>
                  <th>ML Confidence</th>
                  <th>Reputation Match</th>
                  <th>Latency</th>
                  <th>Scanned At</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>
                      <div className="table-url-text" title={h.url}>{h.url}</div>
                    </td>
                    <td>
                      <span className={`table-badge ${h.risk_tier}`}>
                        {h.risk_tier}
                      </span>
                    </td>
                    <td><strong>{h.risk_score}</strong></td>
                    <td>{(h.ml_confidence * 100).toFixed(1)}%</td>
                    <td style={{ color: h.reputation_hit ? 'var(--phishing-color)' : 'var(--safe-color)' }}>
                      {h.reputation_hit ? 'Hit' : 'Clean'}
                    </td>
                    <td className="table-latency">{h.response_time_ms}ms</td>
                    <td className="table-date">
                      {new Date(h.created_at + 'Z').toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
