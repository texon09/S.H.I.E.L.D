import React from 'react';

export default function LandingPage({
  scanUrl,
  setScanUrl,
  handleLandingScan,
  scanLoading,
  scanError
}) {
  return (
    <div className="landing-container" style={{ background: 'var(--bg-gradient)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-panel" style={{ 
        background: 'rgba(255, 255, 255, 0.05)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: '24px', 
        padding: '3rem', 
        maxWidth: '800px', 
        width: '100%',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-color)' }}>SHIELD</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
          Suspicious Hyperlink Intelligence & Evaluation Layer for Defense
        </p>

        <form onSubmit={handleLandingScan} className="search-wrapper" style={{ margin: '0 auto' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Enter URL to scan... (e.g. https://example.com)"
            value={scanUrl}
            onChange={(e) => setScanUrl(e.target.value)}
            disabled={scanLoading}
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-color)' }}
          />
          <button type="submit" className="check-btn" disabled={scanLoading}>
            {scanLoading ? 'Checking...' : 'Check URL'}
          </button>
        </form>
        {scanError && <div className="error-banner" style={{ marginTop: '1rem' }}>⚠️ {scanError}</div>}
        {scanLoading && (
          <div className="search-loader" style={{ marginTop: '1rem' }}>
            <div className="circle-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
}
