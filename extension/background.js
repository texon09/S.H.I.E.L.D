const BACKEND_URL = "http://localhost:8000/api/scan";

// Cache to prevent duplicate scans for the same URL in a short period
const scanCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

// Whitelist for when a user clicks "Proceed Anyway"
const allowedUrls = new Set();
let extensionSettings = { activeBlocking: true };

// Fetch settings and whitelist from API periodically
async function syncSettings() {
  try {
    const res = await fetch("http://localhost:8000/api/settings");
    if (res.ok) {
      extensionSettings = await res.json();
    }
    
    // Also sync the global whitelist so web-dashboard whitelists apply to the extension instantly
    const whitelistRes = await fetch("http://localhost:8000/api/whitelist");
    if (whitelistRes.ok) {
      const dbWhitelist = await whitelistRes.json();
      dbWhitelist.forEach(url => allowedUrls.add(url));
    }
  } catch (e) {
    // Backend offline, default to safe mode
  }
}
// Sync every 5 seconds for real-time responsiveness
setInterval(syncSettings, 5000);
syncSettings();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "allow_url" && request.url) {
    allowedUrls.add(request.url);
    sendResponse({ success: true });
  } else if (request.action === "whitelist_and_proceed" && request.url) {
    allowedUrls.add(request.url);
    fetch("http://localhost:8000/api/whitelist", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: request.url })
    }).catch(e => console.error("Failed to whitelist", e));
    sendResponse({ success: true });
  } else if (request.action === "close_tab") {
    if (sender.tab) {
      chrome.tabs.remove(sender.tab.id);
    }
    sendResponse({ success: true });
  }
});

async function scanUrl(url) {
  if (!url || !url.startsWith("http")) {
    return null;
  }
  
  // Return cached result if available and not expired
  if (scanCache.has(url)) {
    const cached = scanCache.get(url);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    } else {
      scanCache.delete(url);
    }
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
      scanCache.set(url, { data: data, timestamp: Date.now() });
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

function updateBadgeAndBlock(tabId, tabUrl, scanResult) {
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
    
    // Active blocking (only if not explicitly allowed by user bypass AND setting is ON)
    if (extensionSettings.activeBlocking && !allowedUrls.has(tabUrl)) {
      const blockedUrl = chrome.runtime.getURL(`blocked.html?url=${encodeURIComponent(tabUrl)}&score=${score}`);
      chrome.tabs.update(tabId, { url: blockedUrl });
    }
  }

  chrome.action.setBadgeText({ tabId: tabId, text: badgeText });
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: badgeColor });
}

// Listen for tab updates (e.g. navigation complete)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    const result = await scanUrl(tab.url);
    updateBadgeAndBlock(tabId, tab.url, result);
  }
});

// Listen for tab switching
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url && tab.url.startsWith("http")) {
      const result = await scanUrl(tab.url);
      updateBadgeAndBlock(activeInfo.tabId, tab.url, result);
    } else {
      chrome.action.setBadgeText({ tabId: activeInfo.tabId, text: "" });
    }
  } catch (err) {
    console.error("Error updating active tab badge:", err);
  }
});
