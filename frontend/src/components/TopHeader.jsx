import React from 'react';

export default function TopHeader({ setActiveTab, theme, toggleTheme }) {
  return (
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
  );
}
