import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function ScannerBar({ onScan, isLoading, placeholder = "ENTER URL TO SCAN..." }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onScan(url);
  };

  return (
    <form className="scanner-bar" onSubmit={handleSubmit} style={{ display: 'flex', border: '1px solid var(--border-color)', background: 'var(--bg-panel)' }}>
      <input 
        type="text" 
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '16px 24px', fontFamily: 'var(--font-mono)', fontSize: '16px', outline: 'none' }}
      />
      <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ border: 'none', borderLeft: '1px solid var(--border-color)', margin: 0, padding: '0 32px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
        {isLoading ? 'SCANNING' : 'SCAN'}
      </button>
    </form>
  );
}
