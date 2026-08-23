import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';

import Whitelist from './pages/Whitelist';

import Developer from './pages/Developer';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [scanResult, setScanResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch History
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleScan = async (url) => {
    if (!url) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      setScanResult(data);
      setActiveTab('dashboard');
      fetchHistory();
      toast.success('Scan complete');
    } catch (err) {
      toast.error('Failed to scan URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/history`, { method: 'DELETE' });
      if (response.ok) {
        setHistory([]);
        toast.success('History cleared successfully');
      }
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  return (
    <div className="app-layout">
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#171717',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '0px',
          fontFamily: "'JetBrains Mono', monospace"
        }
      }}/>
      
      {activeTab !== 'landing' && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      
      <div className="main-wrapper">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="content-area">
          {activeTab === 'landing' && <LandingPage onScan={handleScan} isLoading={isLoading} />}
          {activeTab === 'dashboard' && <Dashboard result={scanResult} onScan={handleScan} isLoading={isLoading} />}
          {activeTab === 'history' && <History data={history} onClearHistory={handleClearHistory} onRefresh={fetchHistory} />}
          {activeTab === 'whitelist' && <Whitelist />}
          {activeTab === 'developer' && <Developer />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  );
}
