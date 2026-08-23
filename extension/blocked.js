document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const blockedUrl = urlParams.get('url');
  
  if (blockedUrl) {
    document.getElementById('blockedUrl').textContent = blockedUrl;
  }
  
  // Go back safely: request background script to close this malicious tab immediately.
  document.getElementById('goBackBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "close_tab" }, () => {
      // Fallback if closing fails
      window.location.href = "https://www.google.com";
    });
  });

  document.getElementById('proceedBtn').addEventListener('click', () => {
    if (confirm("WARNING: You are bypassing S.H.I.E.L.D. protection. Are you sure you want to proceed to this dangerous site?")) {
      const wantWhitelist = confirm("Would you like to mark this site as SAFE (whitelist) so it won't be blocked for you in the future?");
      if (wantWhitelist) {
        chrome.runtime.sendMessage({ action: "whitelist_and_proceed", url: blockedUrl }, (response) => {
          window.location.href = blockedUrl;
        });
      } else {
        chrome.runtime.sendMessage({ action: "allow_url", url: blockedUrl }, (response) => {
          window.location.href = blockedUrl;
        });
      }
    }
  });
});
