import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function History({ data, onClearHistory, onRefresh }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="panel" style={{ background: 'transparent', border: 'none', padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="mono" style={{ margin: 0 }}>[ SCAN LOGS ]</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> REFRESH
          </button>
          <button className="btn btn-danger" onClick={onClearHistory} style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
            CLEAR HISTORY
          </button>
        </div>
      </div>

      {data && data.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.map((log) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderLeft: `4px solid var(--${log.risk_tier === 'phishing' ? 'danger' : log.risk_tier === 'safe' ? 'safe' : 'suspicious'}-color)` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`badge bg-${log.risk_tier} is-${log.risk_tier === 'phishing' ? 'danger' : log.risk_tier === 'safe' ? 'safe' : 'suspicious'}`}>
                    {log.risk_tier.toUpperCase()}
                  </span>
                  <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    SCORE: {log.risk_score} | {log.response_time_ms}ms
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
                  {log.url}
                </div>
              </div>
              <div className="mono" style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'right' }}>
                {new Date(log.created_at + 'Z').toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          NO SCANS RECORDED.
        </div>
      )}
    </div>
  );
}
