import React from 'react';

export default function Settings({ autoCheck, setAutoCheck, trustedSites }) {
  return (
    <>
      {/* Settings Options */}
      <div className="settings-wrapper">
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
        </div>

        <div className="preferences-section">
          <h4>Preferences</h4>
          <div className="preference-card">
            <div className="pref-info">
              <h5>Auto-check links while browsing</h5>
              <p>Checks every link before you click</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={autoCheck}
                onChange={(e) => setAutoCheck(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="save-changes-row">
          <button 
            onClick={() => alert('Settings preferences saved successfully!')} 
            className="check-btn"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
