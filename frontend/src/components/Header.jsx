import React from 'react';

export default function Header({ activeTab, setActiveTab }) {
  const handleInstallClick = () => {
    window.open("https://github.com/texon09/S.H.I.E.L.D/releases/tag/v1.0.0", "_blank");
  };

  return (
    <header className="top-header">
      {activeTab !== 'landing' && (
        <div style={{ flex: 1 }}>
          <button className="btn" onClick={() => setActiveTab('landing')}>← NEW SCAN</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: '16px' }}>
        <button className="btn btn-primary" onClick={handleInstallClick}>ADD TO CHROME - FREE</button>
      </div>
    </header>
  );
}
