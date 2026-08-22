import os
import sys
import pandas as pd
import requests
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# Ensure backend folder is in path to import extractor
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.classifier import extract_features, FEATURE_NAMES

DATASET_URL = "https://raw.githubusercontent.com/phishing-ml/phishing-ml/main/phishing_site_urls.csv"
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
MODEL_PATH = os.path.join(DATA_DIR, 'phishing_model.pkl')
METRICS_PATH = os.path.join(DATA_DIR, 'model_metrics.txt')

def main():
    print("Starting ML pipeline setup...")
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

    csv_path = os.path.join(DATA_DIR, "phishing_site_urls.csv")
    if not os.path.exists(csv_path):
        print(f"Downloading dataset from {DATASET_URL}...")
        try:
            r = requests.get(DATASET_URL, timeout=30)
            r.raise_for_status()
            with open(csv_path, 'wb') as f:
                f.write(r.content)
            print("Dataset downloaded successfully.")
        except Exception as e:
            print(f"Error downloading dataset: {e}")
            sys.exit(1)
    else:
        print("Using cached dataset.")

    print("Loading dataset...")
    df = pd.read_csv(csv_path)
    
    # Take a balanced slice of 10,000 URLs to ensure training finishes within 1-2 minutes on any machine
    # The dataset contains columns: 'URL', 'Label' ('good', 'bad')
    print("Original dataset size:", len(df))
    good_urls = df[df['Label'] == 'good'].sample(n=5000, random_state=42)
    bad_urls = df[df['Label'] == 'bad'].sample(n=5000, random_state=42)
    df_slice = pd.concat([good_urls, bad_urls]).reset_index(drop=True)
    print("Sliced dataset size (balanced):", len(df_slice))

    # Feature extraction
    print("Extracting security features from URLs (this may take up to 1-2 minutes)...")
    feature_list = []
    labels = []
    
    for idx, row in df_slice.iterrows():
        url = row['URL']
        lbl = 1 if row['Label'] == 'bad' else 0 # 1 = Phishing/bad, 0 = Legitimate/good
        
        feats = extract_features(url)
        feature_list.append([feats[name] for name in FEATURE_NAMES])
        labels.append(lbl)
        
        if (idx + 1) % 2000 == 0:
            print(f"Processed {idx + 1}/10000 URLs")

    X = pd.DataFrame(feature_list, columns=FEATURE_NAMES)
    y = pd.Series(labels)

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    # Evaluation
    print("Evaluating model...")
    y_pred = model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    metrics_str = (
        f"RandomForestClassifier Evaluation Metrics:\n"
        f"-----------------------------------------\n"
        f"Accuracy:  {acc:.4f}\n"
        f"Precision: {prec:.4f}\n"
        f"Recall:    {rec:.4f}\n"
        f"F1-Score:  {f1:.4f}\n"
    )
    print(metrics_str)

    with open(METRICS_PATH, 'w') as f:
        f.write(metrics_str)
    print(f"Metrics saved to {METRICS_PATH}")

    # Save model artifact
    print(f"Saving model artifact to {MODEL_PATH}...")
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump({'model': model, 'metrics': {'accuracy': acc, 'precision': prec, 'recall': rec, 'f1': f1}}, f)
    print("Model pipeline run complete!")

if __name__ == "__main__":
    main()
