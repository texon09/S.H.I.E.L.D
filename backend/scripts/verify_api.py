import os
import sys

# Ensure backend folder is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

def test_scan_api():
    print("Starting automated API verification...")
    client = TestClient(app)
    
    # 1. Test scanning a legitimate site
    print("\n[Test 1] Testing /api/scan with google.com...")
    response = client.post("/api/scan", json={"url": "https://google.com"})
    if response.status_code != 200:
        print(f"FAILED: Expected 200, got {response.status_code}")
        print("Response:", response.text)
        sys.exit(1)
        
    data = response.json()
    print("Success! Response:")
    print(f"  Final URL: {data['final_url']}")
    print(f"  Risk Score: {data['risk_score']}")
    print(f"  Risk Tier: {data['risk_tier']}")
    print(f"  ML Prediction: {data['ml_prediction']}")
    print(f"  ML Confidence: {data['ml_confidence']}")
    print(f"  Reputation Hit: {data['reputation_hit']}")
    print(f"  Latency: {data['response_time_ms']}ms")
    print(f"  Top Features Count: {len(data['top_features'])}")
    
    assert data["risk_tier"] in ["safe", "suspicious", "phishing"]
    assert "top_features" in data
    
    # 2. Test scanning a known phishing blocklist site
    print("\n[Test 2] Testing /api/scan with a known bad blocklist site (paypal-login-security.xyz)...")
    response = client.post("/api/scan", json={"url": "http://paypal-login-security.xyz"})
    if response.status_code != 200:
        print(f"FAILED: Expected 200, got {response.status_code}")
        sys.exit(1)
        
    data = response.json()
    print("Success! Response:")
    print(f"  Risk Score: {data['risk_score']} (Expected >= 95)")
    print(f"  Risk Tier: {data['risk_tier']} (Expected: phishing)")
    print(f"  Reputation Hit: {data['reputation_hit']} (Expected: True)")
    
    assert data["reputation_hit"] is True
    assert data["risk_tier"] == "phishing"
    assert data["risk_score"] >= 95
    
    # 3. Test adversarial testing endpoint
    print("\n[Test 3] Testing /api/adversarial-test with paypal.com...")
    response = client.post("/api/adversarial-test", json={"url": "https://paypal.com"})
    if response.status_code != 200:
        print(f"FAILED: Expected 200, got {response.status_code}")
        sys.exit(1)
        
    data = response.json()
    print("Success! Response:")
    print(f"  Original URL: {data['original']['input_url']}")
    print(f"  Original Score: {data['original']['risk_score']}")
    print(f"  Variants Generated: {len(data['variants'])}")
    for idx, var in enumerate(data['variants']):
        print(f"    Variant {idx+1}: {var['input_url']} | Tier: {var['risk_tier']} | Score: {var['risk_score']}")
        
    assert "original" in data
    assert len(data["variants"]) == 3
    
    # 4. Test history endpoint
    print("\n[Test 4] Testing /api/history...")
    response = client.get("/api/history")
    if response.status_code != 200:
        print(f"FAILED: Expected 200, got {response.status_code}")
        sys.exit(1)
        
    history = response.json()
    print("Success! Response:")
    print(f"  Total records in database: {len(history)}")
    for scan in history[:5]:
        print(f"    ID: {scan['id']} | URL: {scan['url']} | Score: {scan['risk_score']} | Tier: {scan['risk_tier']}")
        
    assert len(history) >= 2
    
    print("\n==========================================")
    print("ALL API ENDPOINTS VERIFIED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    test_scan_api()
