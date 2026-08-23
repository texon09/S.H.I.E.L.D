import React, { useState } from 'react';
import ScannerBar from '../components/ScannerBar';
import { toast } from 'react-hot-toast';

export default function Dashboard({ result, onScan, isLoading }) {
  const [testUrl, setTestUrl] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const getScoreColor = (tier) => {
    if (tier === 'phishing') return 'is-danger';
    if (tier === 'suspicious') return 'is-suspicious';
    return 'is-safe';
  };

  const getBgColor = (tier) => {
    if (tier === 'phishing') return 'bg-danger';
    if (tier === 'suspicious') return 'bg-suspicious';
    return 'bg-safe';
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!testUrl.trim()) return;
    setTestLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/adversarial-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl.trim() })
      });
      if (response.ok) {
        setTestResult(await response.json());
      } else {
        toast.error("Failed to generate test URLs.");
      }
    } catch (e) {
      toast.error("Network error during test.");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <ScannerBar onScan={onScan} isLoading={isLoading} placeholder="SCAN ANOTHER LINK..." />
      </div>

      {!result && !isLoading && (
        <div className="panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          NO ACTIVE SCAN. ENTER A URL ABOVE.
        </div>
      )}

      {result && (
        <div className="bento-grid">
          {/* Verdict Card */}
          <div className={`col-4 panel verdict-card ${getBgColor(result.risk_tier)}`} style={{ border: 'none', borderTop: '4px solid', borderTopColor: `var(--${result.risk_tier === 'phishing' ? 'danger' : result.risk_tier === 'suspicious' ? 'suspicious' : 'safe'}-color)` }}>
            <div className="verdict-tier" style={{ color: `var(--${result.risk_tier === 'phishing' ? 'danger' : result.risk_tier === 'suspicious' ? 'suspicious' : 'safe'}-color)` }}>
              {result.risk_tier === 'phishing' ? 'DANGER' : result.risk_tier === 'suspicious' ? 'CAUTION' : 'SAFE'}
            </div>
            <div className={`verdict-score ${getScoreColor(result.risk_tier)}`}>
              {result.risk_score}
            </div>
            <div className="verdict-desc" style={{ marginBottom: '16px' }}>
              {result.risk_tier === 'phishing' && "This is a scam. Do not click or enter credentials."}
              {result.risk_tier === 'suspicious' && "This looks weird. Proceed with extreme caution."}
              {result.risk_tier === 'safe' && "Looks good. Safe to browse."}
            </div>
            
            {result.risk_tier !== 'safe' && (
              <button 
                className="btn" 
                onClick={async () => {
                  try {
                    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                    await fetch(`${API_BASE}/api/whitelist`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url: result.input_url })
                    });
                    toast.success('Added to safe list. Will not be blocked.');
                    onScan(result.input_url); // Rescan to show it's safe now
                  } catch(e) {
                    toast.error('Failed to whitelist');
                  }
                }}
                style={{ fontSize: '11px', padding: '8px 16px', borderColor: 'var(--text-muted)', color: 'var(--text-muted)' }}
              >
                MARK AS SAFE (WHITELIST)
              </button>
            )}
          </div>

          {/* Threat Intel */}
          <div className="col-8 panel">
            <h3 className="mono" style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>[ THREAT INTEL ]</h3>
            <div className="mono" style={{ fontSize: '14px', lineHeight: '2' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>TARGET_URL:</span> {result.final_url}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>REP_DATABASE:</span> {result.reputation_hit ? <span className="is-danger">KNOWN SCAM HIT</span> : <span className="is-safe">CLEAN</span>}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>SCAN_LATENCY:</span> {result.response_time_ms}ms</div>
              <div><span style={{ color: 'var(--text-muted)' }}>TIMESTAMP:</span> {new Date().toISOString()}</div>
            </div>
          </div>

          {/* ML Heuristics (Plain English) */}
          <div className="col-12 panel">
            <h3 className="mono" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>[ SMART LINK ANALYSIS ]</h3>
            <div>
              {result.top_features.map((f, idx) => {
                // Translate the technical labels to plain English
                let plainLabel = f.label;
                if (plainLabel.includes("obfuscating")) plainLabel = "Hidden characters detected in link.";
                if (plainLabel.includes("URL length")) plainLabel = "Link is unusually long, common in scams.";
                if (plainLabel.includes("subdomains")) plainLabel = "Uses multiple sub-names to mimic real brands.";
                if (plainLabel.includes("special characters")) plainLabel = "High ratio of weird symbols detected.";
                if (plainLabel.includes("IP address")) plainLabel = "Uses raw numbers instead of a real website name.";

                return (
                  <div key={idx} className="feature-row">
                    <div className="feature-label">{plainLabel}</div>
                    <div className="feature-bar-container">
                      <div 
                        className="feature-bar-fill" 
                        style={{ 
                          width: `${Math.min(f.weight * 100, 100)}%`,
                          backgroundColor: f.direction === 'risky' ? 'var(--danger-color)' : 'var(--safe-color)'
                        }}
                      ></div>
                    </div>
                    <div className={`feature-value ${f.direction === 'risky' ? 'is-danger' : 'is-safe'}`}>
                      {f.direction === 'risky' ? 'RISK' : 'SAFE'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lookalike Simulator */}
          <div className="col-12 panel" style={{ marginTop: '24px' }}>
            <h3 className="mono" style={{ marginBottom: '8px' }}>[ SPOT THE FAKE - SIMULATOR ]</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Type a trusted brand (e.g., <strong>netflix.com</strong>). See how scammers create lookalike links to trick you, and watch our engine catch them in real-time.
            </p>
            <form onSubmit={handleTestSubmit} style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <input type="text" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} placeholder="netflix.com" className="mono" style={{ flex: 1, background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'white', padding: '12px' }} />
              <button type="submit" className="btn btn-primary" disabled={testLoading}>{testLoading ? 'GENERATING...' : 'SIMULATE ATTACK'}</button>
            </form>

            {testResult && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Variant Type</th>
                    <th>Lookalike URL</th>
                    <th>Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span style={{ color: 'var(--text-muted)' }}>Original</span></td>
                    <td>{testResult.original.input_url}</td>
                    <td><span className={`badge ${getBgColor(testResult.original.risk_tier)} ${getScoreColor(testResult.original.risk_tier)}`}>{testResult.original.risk_tier}</span></td>
                  </tr>
                  {testResult.variants.map((v, i) => (
                    <tr key={i}>
                      <td><span style={{ color: 'var(--text-muted)' }}>{i === 0 ? 'Typosquat' : i === 1 ? 'Obfuscated' : 'IP-Subbed'}</span></td>
                      <td>{v.input_url}</td>
                      <td><span className={`badge ${getBgColor(v.risk_tier)} ${getScoreColor(v.risk_tier)}`}>{v.risk_tier}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
