import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const [prefs, setPrefs] = useState({
    activeBlocking: true,
    saveHistory: true
  });

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetch(`${API_BASE}/api/settings`)
      .then(res => res.json())
      .then(data => setPrefs(data))
      .catch(err => console.error(err));
  }, []);

  const saveChanges = async (newPrefs) => {
    setPrefs(newPrefs);
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      });
      toast.success('SETTINGS SAVED INSTANTLY.');
    } catch(err) {
      toast.error('Failed to save settings.');
    }
  };

  return (
    <div className="panel" style={{ maxWidth: '600px' }}>
      <h2 className="mono" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>[ SYSTEM PREFERENCES ]</h2>
      
      <div style={{ marginBottom: '24px' }}>
        <h4 className="mono" style={{ marginBottom: '8px' }}>BROWSER EXTENSION</h4>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
          <input 
            type="checkbox" 
            checked={prefs.activeBlocking}
            onChange={(e) => saveChanges({...prefs, activeBlocking: e.target.checked})}
          />
          Enable real-time active blocking
        </label>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h4 className="mono" style={{ marginBottom: '8px' }}>DATA RETENTION</h4>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
          <input 
            type="checkbox" 
            checked={prefs.saveHistory}
            onChange={(e) => saveChanges({...prefs, saveHistory: e.target.checked})}
          />
          Save scan history locally
        </label>
      </div>
    </div>
  );
}
