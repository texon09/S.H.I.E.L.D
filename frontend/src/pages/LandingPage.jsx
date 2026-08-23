import React from 'react';
import ScannerBar from '../components/ScannerBar';
import { ShieldAlert, BrainCircuit, ShieldCheck } from 'lucide-react';

export default function LandingPage({ onScan, isLoading }) {
  return (
    <div className="landing-wrapper">
      <div className="hero-section">
        <h1 className="hero-title" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '4px' }}>S.H.I.E.L.D.</h1>
        <p className="hero-subtitle">Smart Heuristic Intelligence for Evaluating Links & Domains</p>
        
        <div style={{ maxWidth: '800px', margin: '40px auto' }}>
          <ScannerBar onScan={onScan} isLoading={isLoading} />
        </div>
      </div>

      <div className="bento-grid" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div className="col-4 panel hover-lift" style={{ borderTop: '4px solid var(--safe-color)' }}>
          <BrainCircuit size={32} color="var(--safe-color)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Smart Link Analysis</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            We analyze the deep structure of the URL in real-time, catching new scams instantly rather than waiting for outdated blocklists.
          </p>
        </div>
        <div className="col-4 panel hover-lift" style={{ borderTop: '4px solid var(--danger-color)' }}>
          <ShieldAlert size={32} color="var(--danger-color)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Lookalike Protection</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Detects clever "typosquatting" tricks where scammers use fake characters to impersonate your bank or favorite brands.
          </p>
        </div>
        <div className="col-4 panel hover-lift" style={{ borderTop: '4px solid var(--suspicious-color)' }}>
          <ShieldCheck size={32} color="var(--suspicious-color)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>Active Extension</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Install the Chrome extension to get passive, real-time protection. It automatically intercepts and blocks malicious redirects.
          </p>
        </div>
      </div>
    </div>
  );
}
