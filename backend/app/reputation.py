import requests
import re
from urllib.parse import urlparse

PHISHTANK_ENDPOINT = "https://checkurl.phishtank.com/checkurl/"

# Hardcoded pattern-based blocklist for immediate, reliable offline demoing
FALLBACK_PHISHING_PATTERNS = [
    r"paypa1\.com",
    r"paypal-login-security\.xyz",
    r"paypaI\.com",
    r"amazon-secure-update\.net",
    r"netflix-account-verify\.com",
    r"microsoft-signin-auth\.org",
    r"apple-id-verify\.support",
    r"blockchain-wallet-login\.xyz",
    r"coinbase-login-help\.com",
    r"chase-online-protect\.com",
    r"wellsfargo-verify-security\.com",
    r"bankofamerica-login-update\.net",
    r"steam-community-promo\.xyz",
    r"google-verify-security\.info",
    r"yahoo-verify-login\.com"
]

FALLBACK_PHISHING_KEYWORDS = [
    "paypal", "stripe", "netflix", "microsoft", "google", "apple", "amazon", "chase", "wellsfargo", "bankofamerica", "coinbase", "binance"
]
SUSPICIOUS_PHISHING_SUFFIXES = [
    "-login", "-verify", "-secure", "-account", "-update", "-signin", "-portal", "-support", "-security"
]

def check_reputation_offline(url: str) -> bool:
    """
    Fallback pattern matching for offline/demo reliability.
    Returns True if the URL domain matches any known bad patterns or suspicious combos.
    """
    normalized_url = url.lower()
    
    # 1. Match direct regex blocklist
    for pattern in FALLBACK_PHISHING_PATTERNS:
        if re.search(pattern, normalized_url):
            return True
            
    # 2. Match suspicious brand combos (e.g. amazon-login.xyz)
    try:
        if not normalized_url.startswith(('http://', 'https://')):
            url_to_parse = 'http://' + normalized_url
        else:
            url_to_parse = normalized_url
        parsed = urlparse(url_to_parse)
        domain = parsed.netloc.split(':')[0]
    except Exception:
        domain = normalized_url
        
    for brand in FALLBACK_PHISHING_KEYWORDS:
        for suffix in SUSPICIOUS_PHISHING_SUFFIXES:
            # Match brand followed by suffix, e.g. "paypal-login"
            if f"{brand}{suffix}" in domain:
                return True
            # Match suffix followed by brand, e.g. "login-paypal"
            if f"{suffix.replace('-', '')}-{brand}" in domain or f"{suffix.replace('-', '')}{brand}" in domain:
                return True
                
    return False

def check_reputation(url: str) -> bool:
    """
    Checks PhishTank reputation API. If unreachable or rate-limited (509),
    falls back to offline signature matching.
    """
    # Quick offline check to save requests or act as secondary validation
    if check_reputation_offline(url):
        return True

    headers = {
        "User-Agent": "phishtank/PhishingDetectorHackathonMVP"
    }
    data = {
        "url": url,
        "format": "json"
    }
    
    try:
        # High-performance timeout (1 second max) so reputation check never hangs the UI
        response = requests.post(PHISHTANK_ENDPOINT, data=data, headers=headers, timeout=1.0)
        if response.status_code == 200:
            result = response.json()
            # PhishTank return structure: {"meta": {...}, "results": {"in_database": bool, "valid": bool, ...}}
            results = result.get("results", {})
            if results.get("in_database", False) and results.get("valid", False):
                return True
        elif response.status_code == 509:
            print("PhishTank API rate limited (509). Using local fallback blocklist.")
        else:
            print(f"PhishTank API returned status code {response.status_code}. Using local fallback blocklist.")
    except requests.exceptions.RequestException as e:
        print(f"PhishTank API request failed ({e}). Using local fallback blocklist.")

    return False
