import os
import sys
import pandas as pd
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.classifier import PhishingClassifier, extract_features, FEATURE_NAMES

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

print("=" * 120, flush=True)
print(f"{'URL':<50} | {'Model?':<6} | {'P(Legit)':<9} | {'P(Phish)':<9} | {'Verdict':<11} | {'Features Summary'}", flush=True)
print("=" * 120, flush=True)

clf = PhishingClassifier()
print(f"[MODEL LOAD STATUS]: Loaded = {clf.model is not None}, Path = {clf.model_path}", flush=True)

if clf.model is not None:
    for u in test_urls:
        feats = extract_features(u)
        X = pd.DataFrame([feats], columns=FEATURE_NAMES)
        prob = clf.model.predict_proba(X)[0]
        verdict, conf, top_feats = clf.predict(u)
        u_disp = (u[:47] + "...") if len(u) > 50 else u
        feat_summary = f"len={feats['URLLength']}, https={feats['IsHTTPS']}, ip={feats['IsDomainIP']}, sub={feats['NoOfSubDomain']}, digits={feats['NoOfDegitsInURL']}"
        print(f"{u_disp:<50} | {'YES':<6} | {prob[0]:<9.4f} | {prob[1]:<9.4f} | {verdict:<11} | {feat_summary}", flush=True)
else:
    print("[ERROR] Model failed to load!", flush=True)

print("=" * 120, flush=True)
