const BACKEND_URL = "http://localhost:8000/api/scan";

// Cache to prevent duplicate scans for the same URL in a short period
const scanCache = new Map();

async function scanUrl(url) {
  if (!url || !url.startsWith("http")) {
    return null;
  }
  
  // Return cached result if available
  if (scanCache.has(url)) {
    return scanCache.get(url);
  }

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: url })
    });

    if (response.ok) {
      const data = await response.json();
      scanCache.set(url, data);
      // Limit cache size
      if (scanCache.size > 200) {
        const firstKey = scanCache.keys().next().value;
        scanCache.delete(firstKey);
      }
      return data;
    }
  } catch (error) {
    console.error("Failed to query Phishing scan API:", error);
  }
  return null;
}

function updateBadge(tabId, scanResult) {
  if (!scanResult) {
    chrome.action.setBadgeText({ tabId: tabId, text: "" });
    return;
  }

  const score = scanResult.risk_score;
  const tier = scanResult.risk_tier;

  let badgeColor = "#10B981"; // Green (Safe)
  let badgeText = String(score);

  if (tier === "suspicious") {
    badgeColor = "#F59E0B"; // Amber
  } else if (tier === "phishing") {
    badgeColor = "#EF4444"; // Red
  }

  chrome.action.setBadgeText({ tabId: tabId, text: badgeText });
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: badgeColor });
}

// Listen for tab updates (e.g. navigation complete)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    const result = await scanUrl(tab.url);
    updateBadge(tabId, result);
  }
});

// Listen for tab switching
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && tab.url.startsWith("http")) {
      const result = await scanUrl(tab.url);
      updateBadge(activeInfo.tabId, result);
    } else {
      chrome.action.setBadgeText({ tabId: activeInfo.tabId, text: "" });
    }
  } catch (err) {
    console.error("Error updating active tab badge:", err);
  }
});
