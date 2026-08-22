import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  // Navigation & Theme States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'history', 'trusted', 'settings'
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const [showLanding, setShowLanding] = useState(true);
  const [introPhase, setIntroPhase] = useState('showing'); // 'showing', 'charging', 'breaking', 'dashboard'

  // Main Scan States
  const [scanUrl, setScanUrl] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanResult, setScanResult] = useState(null);

  // Adversarial States
  const [advUrl, setAdvUrl] = useState('');
  const [advLoading, setAdvLoading] = useState(false);
  const [advError, setAdvError] = useState('');
  const [advResult, setAdvResult] = useState(null);

  // Database / Preferences States
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);
  const [trustedSites, setTrustedSites] = useState([
    'https://google.com',
    'https://github.com',
    'https://wikipedia.org'
  ]);

  // Synchronize HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Cinematic shield transition timers
  useEffect(() => {
    if (introPhase === 'showing') {
      const timer = setTimeout(() => {
        setIntroPhase('charging');
      }, 2500); // Display large shield + text for 2.5 seconds
      return () => clearTimeout(timer);
    } else if (introPhase === 'charging') {
      const timer = setTimeout(() => {
        setIntroPhase('breaking');
      }, 800); // Shake tremor + neon lightning flashes for 0.8 seconds
      return () => clearTimeout(timer);
    } else if (introPhase === 'breaking') {
      const timer = setTimeout(() => {
        setIntroPhase('dashboard');
        setShowLanding(false);
      }, 2500); // Heavy slide-apart break animation over 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [introPhase]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_BASE}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    if (!scanUrl.trim()) return;

    setScanLoading(true);
    setScanError('');
    setScanResult(null);

    try {
      const response = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scanUrl.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned error ${response.status}`);
      }

      const data = await response.json();
      setScanResult(data);
      fetchHistory();
    } catch (err) {
      setScanError(err.message || 'Unable to connect to S.H.I.E.L.D. engine.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleLandingScan = async (e) => {
    if (e) e.preventDefault();
    if (!scanUrl.trim()) return;

    setScanLoading(true);
    setScanError('');
    setScanResult(null);

    try {
      const response = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scanUrl.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned error ${response.status}`);
      }

      const data = await response.json();
      setScanResult(data);
      setShowLanding(false); // Transition to dashboard
      setActiveTab('dashboard');
      fetchHistory();
    } catch (err) {
      setScanError(err.message || 'Unable to connect to S.H.I.E.L.D. engine.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleAdversarial = async (e) => {
    e.preventDefault();
    if (!advUrl.trim()) return;

    setAdvLoading(true);
    setAdvError('');
    setAdvResult(null);

    try {
      const response = await fetch(`${API_BASE}/adversarial-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: advUrl.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned error ${response.status}`);
      }

      const data = await response.json();
      setAdvResult(data);
      fetchHistory();
    } catch (err) {
      setAdvError(err.message || 'Unable to run adversarial generation.');
    } finally {
      setAdvLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const copyToClipboard = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult.final_url);
    alert('Copied URL to clipboard!');
  };

  const addToTrusted = () => {
    if (!scanResult) return;
    const url = scanResult.final_url;
    if (!trustedSites.includes(url)) {
      setTrustedSites([...trustedSites, url]);
      alert('URL added to trusted sites list!');
    }
  };

  // Helper to map top features to the UI bar charts matching screen (1).png
  const getMappedWhyFactors = (scanResult) => {
    if (!scanResult || !scanResult.top_features) return [];
    
    // Convert backend weights into exact display scores
    return scanResult.top_features.map(f => {
      const displayScore = Math.round(f.weight * 100);
      const isRisky = f.direction === 'risky';
      const label = f.label.split(' (')[0]; // Clean label text
      
      return {
        name: label,
        scoreText: isRisky ? `+${displayScore}` : `-${displayScore}`,
        scoreVal: isRisky ? displayScore : -displayScore,
        direction: f.direction
      };
    });
  };

  if (showLanding) {
    return (
      <div className={`landing-container ${introPhase === 'breaking' ? 'fade-out' : ''}`}>
        {/* Name and Full Form on Landing Page */}
        <div className={`landing-brand-overlay ${introPhase === 'breaking' ? 'fade-out' : ''}`}>
          <h1>S.H.I.E.L.D.</h1>
          <p>Suspicious Hyperlink Intelligence & Evaluation Layer for Defense</p>
        </div>

        <div className={`shield-animation-container ${introPhase === 'charging' ? 'shake' : ''}`}>
          <div className="split-shield-svg-wrapper">
            {/* Left Half (Crimson Red, 200px width window) */}
            <div className={`shield-left-half ${introPhase === 'breaking' ? 'break-left' : ''}`}>
              <svg viewBox="0 0 400 450" style={{ width: '400px', height: '450px' }}>
                <path fill="#b91c1c" d="M 200 22 C 144 22, 67 40, 44 78 C 44 200, 44 322, 200 425 L 195 367 L 211 300 L 189 211 L 211 122 Z" />
              </svg>
            </div>
            {/* Right Half (Warnings Blue, 200px width window offset) */}
            <div className={`shield-right-half ${introPhase === 'breaking' ? 'break-right' : ''}`}>
              <svg viewBox="0 0 400 450" style={{ width: '400px', height: '450px', marginLeft: '-200px' }}>
                <path fill="#2563eb" d="M 200 22 C 256 22, 333 40, 356 78 C 356 200, 356 322, 200 425 L 195 367 L 211 300 L 189 211 L 211 122 Z" />
              </svg>
            </div>
          </div>

          {/* Cyan lightning bolt crack overlay flickering violently during charging/breaking */}
          <svg viewBox="0 0 400 450" className={`lightning-bolt ${introPhase === 'charging' || introPhase === 'breaking' ? 'active' : ''}`}>
            {/* 1. Outer Soft Neon Blur */}
            <path 
              fill="none" 
              stroke="#00f0ff" 
              strokeWidth="28" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              opacity="0.35"
              style={{ filter: 'blur(8px)' }}
              d="M 200 0 L 195 122 L 211 211 L 189 300 L 211 367 L 200 450" 
            />
            {/* 2. Inner Neon Glow */}
            <path 
              fill="none" 
              stroke="#00f0ff" 
              strokeWidth="14" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              opacity="0.7"
              style={{ filter: 'blur(2px)' }}
              d="M 200 0 L 195 122 L 211 211 L 189 300 L 211 367 L 200 450" 
            />
            {/* 3. Branching electrical discharge arcs (left and right) */}
            <path 
              fill="none" 
              stroke="#00f0ff" 
              strokeWidth="8" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              opacity="0.85"
              d="M 211 211 L 160 170 L 120 185 M 189 300 L 250 340 L 290 325" 
            />
            {/* 4. White Hot Center core */}
            <path 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M 200 0 L 195 122 L 211 211 L 189 300 L 211 367 L 200 450" 
            />
          </svg>

          <div className="shield-center-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container app-fade-in">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section" onClick={() => { setShowLanding(true); setIntroPhase('showing'); }} style={{ cursor: 'pointer' }}>
          <div className="brand-logo-img"></div>
          <div className="brand-info">
            <h2>S.H.I.E.L.D.</h2>
            <p>CLINICAL PROTECTION</p>
          </div>
        </div>

        <ul className="nav-menu">
          <li 
            className={`nav-item ${!showLanding && activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setShowLanding(false); setActiveTab('dashboard'); }}
          >
            <span className="nav-icon">🛡️</span> Dashboard
          </li>
          <li 
            className={`nav-item ${!showLanding && activeTab === 'history' ? 'active' : ''}`}
            onClick={() => { setShowLanding(false); setActiveTab('history'); }}
          >
            <span className="nav-icon">⏱️</span> Scan History
          </li>
          <li 
            className={`nav-item ${!showLanding && activeTab === 'trusted' ? 'active' : ''}`}
            onClick={() => { setShowLanding(false); setActiveTab('trusted'); }}
          >
            <span className="nav-icon">✅</span> Trusted Sites
          </li>
          <li 
            className={`nav-item ${!showLanding && activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setShowLanding(false); setActiveTab('settings'); }}
          >
            <span className="nav-icon">⚙️</span> Settings
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Header Controls */}
        <div className="top-header">
          <button 
            className="header-btn" 
            title="Scan History Log" 
            onClick={() => setActiveTab('history')}
          >
            ⏱️
          </button>
          <button 
            className="header-btn" 
            title="Toggle Light/Dark Theme"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button 
            className="header-btn" 
            title="Settings Preferences" 
            onClick={() => setActiveTab('settings')}
          >
            ⚙️
          </button>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Hero Header */}
            <div className="hero-section">
              <h1>Check a URL before you visit it</h1>
              <p>
                Enter any suspect link below. Our clinical analysis engine evaluates domain
                age, structure, and known blocklists in real-time.
              </p>
            </div>

            {/* Main Search/Scan Bar */}
            <form onSubmit={handleScan} className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="https://example-secure-login.com"
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                disabled={scanLoading}
              />
              <button type="submit" className="check-btn" disabled={scanLoading}>
                {scanLoading ? 'Checking...' : 'Check URL'}
              </button>
            </form>

            {scanError && <div className="error-banner" style={{ width: '100%', maxWidth: '800px' }}>⚠️ {scanError}</div>}

            {/* Spinner */}
            {scanLoading && (
              <div className="search-loader">
                <div className="circle-spinner"></div>
              </div>
            )}

            {/* Scanned Result Card */}
            {scanResult && !scanLoading && (
              <>
                <div className="scanned-card">
                  <span className="scanned-title">Scanned URL</span>
                  <div className="scanned-url-banner">
                    <div className="scanned-url-box" title={scanResult.final_url}>
                      {scanResult.final_url}
                    </div>
                    
                    {/* Badge */}
                    <div className={`verdict-badge badge-${scanResult.risk_tier}`}>
                      {scanResult.risk_tier === 'phishing' && '⚠️ Phishing'}
                      {scanResult.risk_tier === 'suspicious' && '⚠️ Suspicious'}
                      {scanResult.risk_tier === 'safe' && '🛡️ Safe'}
                    </div>

                    <div className="score-display">
                      {scanResult.risk_score}<span> / 100</span>
                    </div>
                  </div>

                  {/* Segmented Color Progress Bar */}
                  <div className="segmented-bar-container">
                    <div className="segmented-bar">
                      <div 
                        className="score-marker" 
                        style={{ left: `${scanResult.risk_score}%` }}
                      ></div>
                    </div>
                    <div className="bar-labels">
                      <span>Safe (0-33)</span>
                      <span>Suspicious (34-66)</span>
                      <span>Malicious (67-100)</span>
                    </div>
                  </div>

                  {/* Verdict Warning Message */}
                  <div className={`warning-banner banner-${scanResult.risk_tier}`}>
                    <span className="warning-icon">
                      {scanResult.risk_tier === 'safe' ? '🛡️' : '⚠️'}
                    </span>
                    <div className={`warning-text ${scanResult.risk_tier}`}>
                      {scanResult.risk_tier === 'phishing' && (
                        <><strong>Warning:</strong> This site shows strong signs of phishing. Do not enter any personal information, credentials, or financial details.</>
                      )}
                      {scanResult.risk_tier === 'suspicious' && (
                        <><strong>Caution:</strong> Minor anomalies found. Typosquatting or brand spoofing is possible. Verify before visiting.</>
                      )}
                      {scanResult.risk_tier === 'safe' && (
                        <><strong>Secure:</strong> S.H.I.E.L.D. found standard security structures. URL appears safe to browse.</>
                      )}
                    </div>
                  </div>
                </div>

                {/* Why This Score Card */}
                <div className="why-score-card">
                  <div className="why-score-header">
                    <span>📊</span> Why this score
                  </div>
                  <div className="why-factors-list">
                    {getMappedWhyFactors(scanResult).map((factor, idx) => {
                      const absoluteScore = Math.abs(factor.scoreVal);
                      return (
                        <div key={idx} className="why-factor-row">
                          <span className="factor-name">{factor.name}</span>
                          <span className={`factor-score-val ${factor.scoreVal > 0 ? 'positive' : 'negative'}`}>
                            {factor.scoreText}
                          </span>
                          <div className="factor-bar-outer">
                            <div 
                              className={`factor-bar-fill-inner ${factor.direction === 'risky' ? 'bar-positive' : 'bar-negative'}`}
                              style={{ width: `${absoluteScore}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="actions-container">
                  <button onClick={copyToClipboard} className="outline-btn">
                    📋 Copy link
                  </button>
                  <button onClick={addToTrusted} className="outline-btn danger-text-btn">
                    🚫 Add to trusted
                  </button>
                </div>
              </>
            )}

            {/* Adversarial Playground (Always visible below Dashboard for quick demoing) */}
            <div className="scanned-card" style={{ marginTop: '24px' }}>
              <span className="scanned-title">Typosquat / Adversarial Test Playground</span>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 16px 0', lineHeight: '1.4' }}>
                Type a trusted domain name below (e.g. <strong>paypal.com</strong>). S.H.I.E.L.D. will generate obfuscated links and show side-by-side classifications.
              </p>
              <form onSubmit={handleAdversarial} className="adv-input-group" style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px', flex: 1 }}
                  placeholder="netflix.com"
                  value={advUrl}
                  onChange={(e) => setAdvUrl(e.target.value)}
                  disabled={advLoading}
                />
                <button type="submit" className="check-btn" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' }} disabled={advLoading}>
                  {advLoading ? 'Testing...' : 'Run Test'}
                </button>
              </form>

              {advError && <div className="error-banner" style={{ marginTop: '12px' }}>⚠️ {advError}</div>}

              {advLoading && (
                <div className="search-loader">
                  <div className="circle-spinner" style={{ borderTopColor: '#8b5cf6' }}></div>
                </div>
              )}

              {advResult && !advLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                  {/* Original */}
                  <div className="trusted-card" style={{ background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.1)' }}>
                    <span className="trusted-url">{advResult.original.input_url} (Original)</span>
                    <span className={`trusted-badge`} style={{ color: advResult.original.risk_tier === 'safe' ? 'var(--safe-color)' : 'var(--phishing-color)', background: 'none' }}>
                      {advResult.original.risk_tier} (Score: {advResult.original.risk_score})
                    </span>
                  </div>

                  {/* Variants */}
                  {advResult.variants.map((v, idx) => {
                    let typeLabel = 'Lookalike Domain';
                    if (idx === 0) typeLabel = 'Typosquat Variant';
                    if (idx === 1) typeLabel = 'Keyword Obfuscated';
                    if (idx === 2) typeLabel = 'IP-substituted path';
                    
                    return (
                      <div key={idx} className="trusted-card">
                        <div>
                          <span className="trusted-url" style={{ display: 'block' }}>{v.input_url}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{typeLabel}</span>
                        </div>
                        <span className="trusted-badge" style={{ color: v.risk_tier === 'safe' ? 'var(--safe-color)' : 'var(--phishing-color)', background: 'none' }}>
                          {v.risk_tier} (Score: {v.risk_score})
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scan History Tab */}
        {activeTab === 'history' && (
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
        )}

        {/* Trusted Sites Tab */}
        {activeTab === 'trusted' && (
          <div className="trusted-wrapper">
            <div className="settings-header">
              <h2 className="settings-title">Trusted Domains</h2>
            </div>
            <div className="trusted-list">
              {trustedSites.map((site, idx) => (
                <div key={idx} className="trusted-card">
                  <span className="trusted-url">{site}</span>
                  <span className="trusted-badge">Verified Safe</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab matching screen 2.png / screen 4.png */}
        {activeTab === 'settings' && (
          <div className="settings-wrapper">
            <div className="settings-header">
              <h2 className="settings-title">Settings</h2>
            </div>

            <div className="preferences-section">
              <h4>Preferences</h4>
              <div className="preference-card">
                <div className="pref-info">
                  <h5>Auto-check links while browsing</h5>
                  <p>Checks every link before you click</p>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={autoCheck}
                    onChange={(e) => setAutoCheck(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="save-changes-row">
              <button 
                onClick={() => alert('Settings preferences saved successfully!')} 
                className="check-btn"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
