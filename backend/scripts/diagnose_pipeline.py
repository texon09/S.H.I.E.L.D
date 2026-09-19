import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import run_scan_pipeline

test_urls = [
    "https://google.com",
    "https://amazon.com",
    "https://www.amazon.com/Apple-iPhone-15-128GB-Black/dp/B0CHX1W1XY/ref=sr_1_1?keywords=iphone",
    "https://github.com/torvalds/linux/commit/1234567890abcdef",
    "https://en.wikipedia.org/wiki/Phishing",
    "http://example.com",
    "http://192.168.1.1/login.php",
    "http://paypa1-security-verification.com/login?token=123",
    "https://netflix-account-verify-login.com/update",
    "http://apple.id.recovery-support-center.org",
    "http://secure-banking-update.xyz/ebank/index.htm?id=9999",
    "https://subdomain.sub.sub.badsite.tk/login/auth/session",
    "https://very-long-suspicious-domain-name-exceeding-normal-lengths-and-boundaries.com/path"
]

print("=" * 115, flush=True)
print(f"{'URL':<65} | {'Score':<6} | {'Tier':<11} | {'ML Conf':<8} | {'RepHit'}", flush=True)
print("=" * 115, flush=True)

for u in test_urls:
    res = run_scan_pipeline(u)
    u_disp = (u[:62] + "...") if len(u) > 65 else u
    print(f"{u_disp:<65} | {res.risk_score:<6} | {res.risk_tier:<11} | {res.ml_confidence:<8.4f} | {res.reputation_hit}", flush=True)

print("=" * 115, flush=True)
