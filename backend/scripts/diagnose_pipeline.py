import os
import sys
import pandas as pd
import numpy as np

# Ensure backend root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.classifier import PhishingClassifier, extract_features, FEATURE_NAMES
from app.reputation import check_reputation
from app.main import resolve_redirects, run_scan_pipeline

test_urls = [
    "http://example.com",
    "https://google.com",
    "https://www.amazon.com/dp/B08N5WRWNW?ref_=ast_sto_dp&th=1",
    "https://amazon.com",
    "http://192.168.1.1/login.php",
    "https://192.168.1.1/index.html",
    "http://paypa1-security-verification.com/login?token=123",
    "https://netflix-account-verify-login.com/update",
    "https://en.wikipedia.org/wiki/Phishing",
    "https://github.com/torvalds/linux/commit/1234567890abcdef1234567890abcdef12345678",
    "https://bit.ly/3xyz123",
    "http://neverssl.com",
    "https://subdomain.sub.sub.badsite.tk/login/auth/session",
    "http://user:pass@legit.com@phishing-target.net/verify",
    "https://microsoft.com",
    "https://login.live.com",
    "http://secure-banking-update.xyz/ebank/index.htm?id=9999",
    "https://appleid.apple.com",
    "http://apple.id.recovery-support-center.org",
    "https://very-long-suspicious-domain-name-exceeding-normal-lengths-and-boundaries.com/path",
    "https://invalid-domain-that-does-not-exist-at-all-xyz12345.org",
]

print("=" * 115)
print(f"{'URL':<45} | {'Redir':<8} | {'RawProb':<8} | {'ClfConf':<8} | {'Rep':<5} | {'Score':<5} | {'Tier'}")
print("=" * 115)

clf = PhishingClassifier()
print(f"[INIT] Model loaded in classifier: {clf.model is not None}")
if clf.model is not None:
    clf_step = clf.model.named_steps.get('classifier')
    print(f"[INIT] Classifier step: {clf_step}")
    print(f"[INIT] Classes: {getattr(clf_step, 'classes_', None)}")

print("-" * 115)

for u in test_urls:
    feats = extract_features(u)
    X = pd.DataFrame([feats], columns=FEATURE_NAMES)
    try:
        raw_p = clf.model.predict_proba(X)[0][1] if clf.model else -1.0
    except Exception as e:
        raw_p = -999.0
    v, conf, _ = clf.predict(u)
    final_url, evas = resolve_redirects(u)
    rep = check_reputation(final_url)
    res = run_scan_pipeline(u)
    u_disp = (u[:42] + '...') if len(u) > 45 else u
    evas_disp = 'FAIL(85)' if evas else 'OK'
    print(f"{u_disp:<45} | {evas_disp:<8} | {raw_p:<8.4f} | {conf:<8.4f} | {str(rep):<5} | {res.risk_score:<5} | {res.risk_tier}")

print("=" * 115)
