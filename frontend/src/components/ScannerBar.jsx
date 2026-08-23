import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function ScannerBar({ onScan, isLoading, placeholder = "ENTER URL TO SCAN..." }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onScan(url);
  };

  return (
    <form className="scanner-bar" onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="scanner-input"
      />
      <button type="submit" className="btn btn-primary scanner-btn" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
        <span className="scanner-btn-text">{isLoading ? 'SCANNING' : 'SCAN'}</span>
      </button>
    </form>
  );
}
