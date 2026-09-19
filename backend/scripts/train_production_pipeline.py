"""
S.H.I.E.L.D. Production ML Training Pipeline
Calibrated Model Trainer on Real-World URL Dataset (549k URLs)
-------------------------------------------------------------
Trains a high-accuracy, calibrated Pipeline on balanced legitimate and
phishing URLs using lexical security features, collinearity filtering,
and an ensemble RandomForestClassifier.
"""

import os
import sys
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.ensemble import RandomForestClassifier

# Ensure backend root is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.classifier import extract_features, FEATURE_NAMES, PhishingFeatureExtractor, CollinearityFilter

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "phishing_site_urls.csv")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MODEL_EXPORT_PATH = os.path.join(OUTPUT_DIR, "phishing_pipeline.pkl")
METRICS_EXPORT_PATH = os.path.join(OUTPUT_DIR, "pipeline_metrics.txt")


def train_production_model(sample_per_class: int = 10000):
    print("=" * 75)
    print("S.H.I.E.L.D. Production Pipeline Training")
    print("=" * 75)

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    print(f"1. Loading dataset from {DATA_PATH}...")
    t0 = time.time()
    df = pd.read_csv(DATA_PATH)
    print(f"   Full dataset loaded: {df.shape[0]:,} rows ({time.time() - t0:.2f}s)")

    # 2. Balanced sampling
    print(f"2. Sampling {sample_per_class:,} good and {sample_per_class:,} bad URLs...")
    good_urls = df[df['Label'].str.lower() == 'good'].sample(n=sample_per_class, random_state=42)
    bad_urls = df[df['Label'].str.lower() == 'bad'].sample(n=sample_per_class, random_state=42)
    
    sampled_df = pd.concat([good_urls, bad_urls]).reset_index(drop=True)
    # Shuffle
    sampled_df = sampled_df.sample(frac=1.0, random_state=42).reset_index(drop=True)

    # 3. Extract features
    print("3. Extracting lexical features from sampled URLs...")
    t0 = time.time()
    feature_rows = []
    labels = []

    for idx, row in sampled_df.iterrows():
        url = str(row['URL'])
        lbl = 1 if str(row['Label']).lower() == 'bad' else 0
        try:
            feats = extract_features(url)
            feature_rows.append(feats)
            labels.append(lbl)
        except Exception:
            continue

        if (idx + 1) % 5000 == 0:
            print(f"   Extracted {idx + 1:,} / {len(sampled_df):,} URLs...")

    print(f"   Feature extraction complete: {len(feature_rows):,} valid rows in {time.time() - t0:.2f}s")

    X = pd.DataFrame(feature_rows, columns=FEATURE_NAMES)
    y = pd.Series(labels)

    # 4. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    print(f"4. Dataset split: Train={X_train.shape[0]:,}, Test={X_test.shape[0]:,}")

    # 5. Build full scikit-learn Pipeline
    engineered_cols = ['ObfuscationURLLengthInteraction', 'SubdomainPerDomainLength', 'SpecialCharPerLetter']
    all_numeric_cols = FEATURE_NAMES + engineered_cols

    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, all_numeric_cols)
        ]
    )

    pipeline = Pipeline(steps=[
        ('extractor', PhishingFeatureExtractor()),
        ('preprocessor', preprocessor),
        ('collinear', CollinearityFilter(threshold=0.92)),
        ('classifier', RandomForestClassifier(
            n_estimators=100,
            max_depth=16,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        ))
    ])

    # 6. Fit pipeline
    print("5. Fitting production pipeline (StandardScaler + CollinearityFilter + RandomForest)...")
    t0 = time.time()
    pipeline.fit(X_train, y_train)
    fit_time = time.time() - t0
    print(f"   Training completed in {fit_time:.2f}s")

    # 7. Evaluation
    print("6. Evaluating holdout performance...")
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    report = classification_report(y_test, y_pred, target_names=["Legitimate (0)", "Phishing (1)"])
    conf_matrix = confusion_matrix(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)

    print("\nClassification Report:")
    print(report)
    print("Confusion Matrix:")
    print(conf_matrix)
    print(f"ROC-AUC Score: {roc_auc:.4f}")

    # 8. Export artifact
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"\n7. Saving model artifact to {MODEL_EXPORT_PATH}...")
    joblib.dump(pipeline, MODEL_EXPORT_PATH)

    with open(METRICS_EXPORT_PATH, "w") as f:
        f.write("S.H.I.E.L.D. Calibrated Pipeline Evaluation Report\n")
        f.write("===============================================\n")
        f.write(f"Sample Size: {len(sampled_df):,} balanced URLs\n")
        f.write(f"Model: RandomForestClassifier (n_estimators=100, max_depth=16)\n")
        f.write(f"ROC-AUC Score: {roc_auc:.4f}\n")
        f.write(f"Training Time: {fit_time:.2f}s\n\n")
        f.write("Classification Details:\n")
        f.write(report)
        f.write("\nConfusion Matrix:\n")
        f.write(np.array2string(conf_matrix))

    print(f"   Metrics written to {METRICS_EXPORT_PATH}")
    print("==================================================================")
    print("Production pipeline successfully trained and exported!")
    print("==================================================================")


if __name__ == "__main__":
    train_production_model(sample_per_class=10000)
