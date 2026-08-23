import React from 'react';

export default function Dashboard({
  scanUrl,
  setScanUrl,
  handleScan,
  scanLoading,
  scanError,
  scanResult,
  advUrl,
  setAdvUrl,
  handleAdversarial,
  advLoading,
  advError,
  advResult,
  copyToClipboard,
  addToTrusted,
  getMappedWhyFactors
}) {
  return (
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
                  <><strong>Secure:</strong> SHIELD found standard security structures. URL appears safe to browse.</>
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
          Type a trusted domain name below (e.g. <strong>paypal.com</strong>). SHIELD will generate obfuscated links and show side-by-side classifications.
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
  );
}
