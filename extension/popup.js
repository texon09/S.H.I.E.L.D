const API_URL = "https://s-h-i-e-l-d-ggtx.onrender.com/api/scan";

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const errorCard = document.getElementById("error-card");
  const resultCard = document.getElementById("result-card");
  
  const scannedUrlText = document.getElementById("scanned-url");
  const riskScoreText = document.getElementById("risk-score");
  const warningText = document.getElementById("warning-text");
  const verdictTier = document.getElementById("verdict-tier");
  const verdictBox = document.getElementById("verdict-box");
  const findingsList = document.getElementById("findings-list");
  
  const retryBtn = document.getElementById("retry-btn");
  const closeBtn = document.getElementById("close-btn");

  async function performScan() {
    loader.classList.remove("hidden");
    errorCard.classList.add("hidden");
    resultCard.classList.add("hidden");
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        showError("Unable to locate active tab.");
        return;
      }
      
      const url = tabs[0].url;
      if (!url || !url.startsWith("http")) {
        showError("S.H.I.E.L.D. only analyzes HTTP/HTTPS addresses.");
        return;
      }
      
      scannedUrlText.textContent = url;
      
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) throw new Error("API error");
        
        const data = await response.json();
        renderResults(data);
      } catch (err) {
        showError("SYSTEM OFFLINE. Cannot connect to engine.");
      }
    });
  }

  function renderResults(data) {
    loader.classList.add("hidden");
    resultCard.classList.remove("hidden");
    
    riskScoreText.textContent = data.risk_score;
    
    let colorVar = '--safe-color';
    if (data.risk_tier === "safe") {
      colorVar = '--safe-color';
      verdictTier.textContent = "SAFE";
      warningText.textContent = "S.H.I.E.L.D. verified. Safe to visit.";
    } else if (data.risk_tier === "suspicious") {
      colorVar = '--suspicious-color';
      verdictTier.textContent = "CAUTION";
      warningText.textContent = "Minor threat indicators detected.";
    } else {
      colorVar = '--danger-color';
      verdictTier.textContent = "DANGER";
      warningText.textContent = "Strong phishing signals detected. Avoid.";
    }

    verdictBox.style.borderTopColor = `var(${colorVar})`;
    verdictTier.style.color = `var(${colorVar})`;
    riskScoreText.style.color = `var(${colorVar})`;

    findingsList.innerHTML = "";
    data.top_features.forEach(feat => {
      const isRisky = feat.direction === "risky";
      
      let plainLabel = feat.label.split(" (")[0]; 
      if (plainLabel.includes("obfuscating")) plainLabel = "Hidden characters";
      if (plainLabel.includes("URL length")) plainLabel = "Unusually long";
      if (plainLabel.includes("subdomains")) plainLabel = "Mimics real brands";
      if (plainLabel.includes("special characters")) plainLabel = "Suspicious symbols";
      if (plainLabel.includes("IP address")) plainLabel = "Uses raw numbers";

      const row = document.createElement("div");
      row.className = "finding-row";
      row.style.color = isRisky ? "var(--danger-color)" : "var(--safe-color)";
      
      row.innerHTML = `
        <span>${plainLabel}</span>
        <span>${isRisky ? "RISK" : "SAFE"}</span>
      `;
      findingsList.appendChild(row);
    });
  }

  function showError(msg) {
    loader.classList.add("hidden");
    resultCard.classList.add("hidden");
    errorCard.classList.remove("hidden");
    if (msg) document.getElementById("error-text").innerHTML = `[ ERROR ]<br><br>${msg}`;
  }

  retryBtn.addEventListener("click", performScan);
  closeBtn.addEventListener("click", () => window.close());

  performScan();
});
