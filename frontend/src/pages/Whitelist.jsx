import React, { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Whitelist() {
  const [whitelist, setWhitelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchWhitelist = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/whitelist`);
      if (res.ok) {
        setWhitelist(await res.json());
      }
    } catch (e) {
      toast.error('Failed to load trusted links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWhitelist();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleRemove = async (url) => {
    try {
      const res = await fetch(`${API_BASE}/api/whitelist`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      if (res.ok) {
        toast.success('Removed from trusted links');
        fetchWhitelist();
      }
    } catch (e) {
      toast.error('Failed to remove link');
    }
  };

  return (
    <div className="panel" style={{ background: 'transparent', border: 'none', padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="mono" style={{ margin: 0 }}>[ TRUSTED LINKS ]</h2>
        <button className="btn" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> REFRESH
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        URLs listed here have been manually marked as safe by you. S.H.I.E.L.D. will never block these links, regardless of their machine learning score.
      </p>

      {loading ? (
        <div className="mono" style={{ color: 'var(--text-muted)' }}>LOADING...</div>
      ) : whitelist.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {whitelist.map((url, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--safe-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <ShieldCheck size={20} color="var(--safe-color)" />
                <span className="mono" style={{ fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {url}
                </span>
              </div>
              <button 
                className="btn btn-danger" 
                onClick={() => handleRemove(url)} 
                style={{ padding: '8px 16px', borderColor: 'var(--danger-color)', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Trash2 size={16} /> REMOVE
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          NO TRUSTED LINKS CONFIGURED.
        </div>
      )}
    </div>
  );
}
