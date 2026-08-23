import React from 'react';
import { toast } from 'react-hot-toast';

export default function Header({ activeTab, setActiveTab }) {
  const handleInstallClick = () => {
    toast.success("To install: Go to chrome://extensions and Load Unpacked 'extension' folder.");
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
