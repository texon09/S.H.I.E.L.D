import os
import pandas as pd
import requests
import zipfile
import io
import time

OUTPUT_DIR = "docs"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "real_world_dataset.csv")
OPENPHISH_URL = "https://openphish.com/feed.txt"
TRANCO_URL = "https://tranco-list.eu/top-1m.csv.zip"

def fetch_data():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Fetching live phishing URLs from OpenPhish...")
    
    phishing_urls = []
    try:
        response = requests.get(OPENPHISH_URL, timeout=10)
        if response.status_code == 200:
            urls = response.text.strip().split('\n')
            phishing_urls = [u for u in urls if u.strip()]
            print(f"Successfully fetched {len(phishing_urls)} phishing URLs.")
    except Exception as e:
        print(f"Error fetching OpenPhish: {e}")
        
    if not phishing_urls:
        print("Using fallback phishing URLs...")
        phishing_urls = [
            "http://paypal-update-security.com/login",
            "https://netflix-billing-issue.net",
            "http://172.56.21.89/secure-login",
            "https://amazon-security-alert.xyz/verify",
            "http://chase-bank-verify.info"
        ] * 100 

    print("Fetching top legitimate domains from Tranco...")
    legit_urls = []
    try:
        response = requests.get(TRANCO_URL, timeout=20)
        if response.status_code == 200:
            with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                filename = z.namelist()[0]
                with z.open(filename) as f:
                    df = pd.read_csv(f, header=None, names=['rank', 'domain'])
                    top_domains = df['domain'].head(10000).tolist()
                    legit_urls = [f"https://{domain}" for domain in top_domains]
            print(f"Successfully fetched {len(legit_urls)} legitimate URLs.")
    except Exception as e:
        print(f"Error fetching Tranco: {e}")

    if not legit_urls:
        legit_urls = ["https://google.com", "https://github.com"] * 500

    if len(phishing_urls) > 0 and len(legit_urls) > 0:
        target_legit_count = int(len(phishing_urls) * 1.5) 
        legit_urls = legit_urls[:target_legit_count]
        
    print(f"Final dataset: {len(phishing_urls)} phishing, {len(legit_urls)} legitimate.")

    data = []
    for url in phishing_urls:
        data.append({'url': url, 'label': 1})
    for url in legit_urls:
        data.append({'url': url, 'label': 0})
        
    df = pd.DataFrame(data)
    
    print("Extracting features using SHIELD feature extractor...")
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    from backend.app.classifier import extract_features
    
    feature_list = []
    for idx, row in df.iterrows():
        try:
            feats = extract_features(row['url'])
            feats['label'] = row['label']
            feature_list.append(feats)
        except Exception as e:
            pass
            
    final_df = pd.DataFrame(feature_list)
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"Dataset compiled and saved to {OUTPUT_FILE} with shape {final_df.shape}")

if __name__ == "__main__":
    fetch_data()
