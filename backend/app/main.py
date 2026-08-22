import time
import os
import sys
import requests
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend folder is in path to import other modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import ScanRequest, ScanResponse, TopFeature, AdversarialRequest, AdversarialResponse
from app.classifier import PhishingClassifier
from app.reputation import check_reputation
from app.database import init_db, save_scan, get_scan_history

app = FastAPI(title="AI-powered Phishing URL Detector API", version="1.0.0")

# Enable CORS for frontend and extension (wildcard for dev simplicity)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML Classifier and DB
classifier = PhishingClassifier()
init_db()

def resolve_redirects(url: str) -> str:
    """
    Resolves HTTP redirects to find the final URL destination.
    Defaults to the input URL on timeout or resolution failure.
    """
    normalized_url = url
    if not url.startswith(('http://', 'https://')):
        normalized_url = 'http://' + url

    try:
        session = requests.Session()
        session.max_redirects = 5
        # Set a short timeout (1.5s) to avoid blocking the main thread
        response = session.get(normalized_url, timeout=1.5, allow_redirects=True, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        return response.url
    except Exception as e:
        # Fall back to original URL
        print(f"Redirect resolution failed for {url}: {e}")
        return normalized_url

def run_scan_pipeline(input_url: str) -> ScanResponse:
    """
    Executes the threat detection pipeline:
    Redirect resolution -> Feature extraction -> ML classification -> Reputation check -> Consensus risk scoring.
    """
    start_time = time.time()

    # 1. Resolve redirects
    final_url = resolve_redirects(input_url)

    # 2. Run ML classifier
    ml_prediction, ml_confidence, top_features = classifier.predict(final_url)

    # 3. Check reputation
    reputation_hit = check_reputation(final_url)

    # 4. Consensus risk engine
    # Base score comes from ML confidence
    base_score = int(ml_confidence * 100)
    
    # If reputation hit, force to high-risk (Phishing tier)
    if reputation_hit:
        risk_score = max(base_score, 95)
    else:
        risk_score = base_score

    # Map risk score to tier
    if risk_score <= 30:
        risk_tier = "safe"
    elif risk_score <= 60:
        risk_tier = "suspicious"
    else:
        risk_tier = "phishing"

    response_time_ms = int((time.time() - start_time) * 1000)

    # Map output features schema
    features_list = [
        TopFeature(label=f["label"], weight=f["weight"], direction=f["direction"])
        for f in top_features
    ]

    scan_res = ScanResponse(
        input_url=input_url,
        final_url=final_url,
        risk_score=risk_score,
        risk_tier=risk_tier,
        ml_prediction=ml_prediction,
        ml_confidence=round(ml_confidence, 4),
        reputation_hit=reputation_hit,
        top_features=features_list,
        response_time_ms=response_time_ms
    )

    # 5. Persist to history
    try:
        save_scan(
            url=input_url,
            final_url=final_url,
            risk_score=risk_score,
            risk_tier=risk_tier,
            ml_prediction=ml_prediction,
            ml_confidence=ml_confidence,
            reputation_hit=reputation_hit,
            response_time_ms=response_time_ms
        )
    except Exception as db_err:
        print(f"Failed to save scan history: {db_err}")

    return scan_res

@app.post("/api/scan", response_model=ScanResponse)
def scan_url(request: ScanRequest):
    if not request.url or len(request.url.strip()) == 0:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    return run_scan_pipeline(request.url.strip())

@app.post("/api/adversarial-test", response_model=AdversarialResponse)
def adversarial_test(request: AdversarialRequest):
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    # Run original scan
    original_result = run_scan_pipeline(url)

    # Parse domain
    try:
        if not url.startswith(('http://', 'https://')):
            parsed_url = 'http://' + url
        else:
            parsed_url = url
        parsed = urlparse(parsed_url)
        domain = parsed.netloc.split(':')[0]
        scheme = parsed.scheme if parsed.scheme else "https"
    except Exception:
        domain = url
        scheme = "https"

    # Generate variants
    variants_urls = []

    # Variant 1: Typosquatted (l -> 1, o -> 0)
    typo_domain = domain
    if 'l' in typo_domain:
        typo_domain = typo_domain.replace('l', '1', 1)
    elif 'o' in typo_domain:
        typo_domain = typo_domain.replace('o', '0', 1)
    elif 'i' in typo_domain:
        typo_domain = typo_domain.replace('i', 'I', 1)
    else:
        typo_domain = typo_domain + "1"
    variants_urls.append(f"{scheme}://{typo_domain}")

    # Variant 2: Typosquatted/obfuscated with keywords
    # E.g. paypal-login-security.xyz
    clean_domain = domain.split('.')[0]
    obfuscated_domain = f"{clean_domain}-login-security.xyz"
    variants_urls.append(f"{scheme}://{obfuscated_domain}")

    # Variant 3: IP-substituted form
    # We substitute domain name with a realistic local/external looking IP address
    # and keep brand name in the path to confuse users/extractors
    variants_urls.append(f"http://172.56.21.89/{clean_domain}/login-verify-account")

    # Run scans on variants
    variants_results = []
    for var_url in variants_urls:
        try:
            var_res = run_scan_pipeline(var_url)
            variants_results.append(var_res)
        except Exception as e:
            print(f"Error scanning variant {var_url}: {e}")

    return AdversarialResponse(
        original=original_result,
        variants=variants_results
    )

@app.get("/api/history")
def get_history():
    try:
        return get_scan_history(limit=50)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
