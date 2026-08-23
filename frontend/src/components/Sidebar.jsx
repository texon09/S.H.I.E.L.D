import React from 'react';
import { Shield, Clock, Settings, LayoutDashboard, User } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      <div>
        <div className="brand">
          <h1>S.H.I.E.L.D.</h1>
          <p>Smart Heuristic Intelligence for Evaluating Links & Domains</p>
        </div>
        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </li>
          <li className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <Clock size={18} /> Logs
          </li>
          <li className={`nav-item ${activeTab === 'whitelist' ? 'active' : ''}`} onClick={() => setActiveTab('whitelist')}>
            <Shield size={18} /> Trusted Links
          </li>
          <li className={`nav-item ${activeTab === 'developer' ? 'active' : ''}`} onClick={() => setActiveTab('developer')}>
            <User size={18} /> Developer
          </li>
          <li className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={18} /> Settings
          </li>
        </ul>
      </div>
      
      <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        BUILT BY <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>TANISHA PAUNIKAR</span>
      </div>
    </aside>
  );
}
