import React from 'react';
import { Code2, Briefcase, Mail } from 'lucide-react';

export default function Developer() {
  return (
    <div className="panel" style={{ background: 'transparent', border: 'none', padding: 0 }}>
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="mono" style={{ margin: 0 }}>[ DEVELOPER CLEARANCE ]</h2>
      </div>

      <div className="bento-grid">
        <div className="col-12 panel hover-lift" style={{ borderTop: '4px solid var(--safe-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--safe-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/developer.jpg" alt="Tanisha Prabhakar Paunikar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h1 className="mono" style={{ fontSize: '24px', marginBottom: '4px' }}>Tanisha Prabhakar Paunikar</h1>
              <p style={{ color: 'var(--text-muted)' }}>Aspiring AI Engineer</p>
            </div>
          </div>
          
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
            S.H.I.E.L.D. was built to democratize threat intelligence. Traditional anti-phishing blocklists 
            are reactive—by the time a link is blocked, thousands of users have already been compromised. 
            This project uses proactive, machine-learning-driven heuristics to catch malicious infrastructure 
            the exact second it goes live.
          </p>
        </div>

        <div className="col-4 panel hover-lift" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.open('mailto:tanisha18p@gmail.com', '_blank')}>
          <Mail size={32} />
          <div className="mono">EMAIL</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>tanisha18p@gmail.com</div>
        </div>

        <div className="col-4 panel hover-lift" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.open('https://www.linkedin.com/in/tanisha-paunikar/', '_blank')}>
          <Briefcase size={32} />
          <div className="mono">LINKEDIN</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>tanisha-paunikar</div>
        </div>

        <div className="col-4 panel hover-lift" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.open('https://github.com/texon09', '_blank')}>
          <Code2 size={32} />
          <div className="mono">GITHUB</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>texon09</div>
        </div>
      </div>
    </div>
  );
}
