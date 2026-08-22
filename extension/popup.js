const API_URL = "http://localhost:8000/api/scan";

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const errorCard = document.getElementById("error-card");
  const resultCard = document.getElementById("result-card");
  
  const scannedUrlText = document.getElementById("scanned-url");
  const riskScoreText = document.getElementById("risk-score");
  const warningText = document.getElementById("warning-text");
  const badge = document.getElementById("verdict-badge");
  const alertCircleIcon = document.getElementById("alert-circle-icon");
  const alertCircleOuter = document.querySelector(".alert-circle-outer");
  const findingsList = document.getElementById("findings-list");
  
  const retryBtn = document.getElementById("retry-btn");
  const closeBtn = document.getElementById("close-warning-btn");

  async function performScan() {
    loader.classList.remove("hidden");
    errorCard.classList.add("hidden");
    resultCard.classList.add("hidden");
    
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        showError("Unable to locate active tab.");
        return;
      }
      
      const activeTab = tabs[0];
      const url = activeTab.url;
      
      if (!url || !url.startsWith("http")) {
        showError("The S.H.I.E.L.D. extension can only analyze HTTP/HTTPS website addresses.");
        return;
      }
      
      scannedUrlText.textContent = url;
      
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) {
          throw new Error(`API error ${response.status}`);
        }
        
        const data = await response.json();
        renderResults(data);
      } catch (err) {
        console.error("Extension scan failed:", err);
        showError(null);
      }
    });
  }

  function renderResults(data) {
    loader.classList.add("hidden");
    resultCard.classList.remove("hidden");
    
    // Set risk score
    riskScoreText.textContent = data.risk_score;
    
    // Reset layout classes
    badge.className = "verdict-capsule-badge";
    warningText.className = "verdict-title";
    
    if (data.risk_tier === "safe") {
      badge.textContent = "Safe";
      badge.classList.add("badge-safe");
      warningText.textContent = "S.H.I.E.L.D. verified. Safe to visit.";
      warningText.classList.add("title-safe");
      
      alertCircleOuter.style.backgroundColor = "var(--safe-bg)";
      alertCircleIcon.textContent = "🛡️";
      alertCircleIcon.style.color = "var(--safe-color)";
      
    } else if (data.risk_tier === "suspicious") {
      badge.textContent = "Suspicious";
      badge.classList.add("badge-suspicious");
      warningText.textContent = "Caution advised. Minor threat indicators detected.";
      warningText.classList.add("title-suspicious");
      
      alertCircleOuter.style.backgroundColor = "var(--suspicious-bg)";
      alertCircleIcon.textContent = "⚠️";
      alertCircleIcon.style.color = "var(--suspicious-color)";
      
    } else {
      badge.textContent = "Phishing";
      badge.classList.add("badge-phishing");
      warningText.textContent = "Strong phishing signals detected. Avoid this site.";
      warningText.classList.add("title-phishing");
      
      alertCircleOuter.style.backgroundColor = "var(--phishing-bg)";
      alertCircleIcon.textContent = "⚠️";
      alertCircleIcon.style.color = "var(--phishing-color)";
    }

    // Populate Key Findings list (showing raw contributing score factors dynamically)
    findingsList.innerHTML = "";
    
    // Calculate display weights from the top features
    data.top_features.forEach(feat => {
      const displayScore = Math.round(feat.weight * 100);
      const isRisky = feat.direction === "risky";
      
      const row = document.createElement("div");
      row.className = "finding-row";
      
      const cleanLabel = feat.label.split(" (")[0]; // Remove details
      const prefix = isRisky ? "+" : "-";
      const colorClass = isRisky ? "risky" : "safe";
      
      row.innerHTML = `
        <span class="finding-label">${cleanLabel}</span>
        <span class="finding-score ${colorClass}">${prefix}${displayScore}</span>
      `;
      findingsList.appendChild(row);
    });
  }

  function showError(customMsg) {
    loader.classList.add("hidden");
    resultCard.classList.add("hidden");
    errorCard.classList.remove("hidden");
    if (customMsg) {
      errorCard.querySelector(".error-text").textContent = customMsg;
    } else {
      errorCard.querySelector(".error-text").innerHTML = `⚠️ Cannot connect to backend server. Ensure the S.H.I.E.L.D. uvicorn engine is running on port 8000.`;
    }
  }

  retryBtn.addEventListener("click", performScan);
  closeBtn.addEventListener("click", () => {
    window.close();
  });

  // Automatically scan on popup load
  performScan();
});
