"""
S.H.I.E.L.D. Production ML Training Pipeline
Principal Machine Learning Engineer Implementation
--------------------------------------------------
This script runs end-to-end data loading, data validation, feature engineering,
collinearity filtering, model training, hyperparameter optimization, and export.
No data leakage is guaranteed by encapsulating all transformations in a scikit-learn Pipeline.
"""

import os
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.feature_selection import VarianceThreshold
from sklearn.model_selection import train_test_split, StratifiedKFold, RandomizedSearchCV
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.classifier import PhishingFeatureExtractor, CollinearityFilter

# Define paths
DATA_PATH = "docs/real_world_dataset.csv"
OUTPUT_DIR = "backend/data"
MODEL_EXPORT_PATH = os.path.join(OUTPUT_DIR, "phishing_pipeline.pkl")
METRICS_EXPORT_PATH = os.path.join(OUTPUT_DIR, "pipeline_metrics.txt")

# Ensure output directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Custom Transformers are imported from app.classifier


# --------------------------------------------------------------------------
# 2. Main Processing Pipeline
# --------------------------------------------------------------------------

def run_ml_pipeline(sample_size=30000):
    print("==================================================================")
    print("S.H.I.E.L.D. Principal ML Pipeline Training")
    print("==================================================================")
    
    # 2.1 Load dataset
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Provided dataset not found at {DATA_PATH}. Check directory location.")

    print(f"Loading data from {DATA_PATH}...")
    # Read columns and full shape
    full_df = pd.read_csv(DATA_PATH)
    print(f"Full dataset shape: {full_df.shape}")

    # Use actual sample size based on dataframe
    sample_size = min(sample_size, len(full_df))
    # 2.2 Stratified Sampling to preserve class distribution for quick cross-validation
    print(f"Sampling {sample_size} records using stratified sampling...")
    if sample_size < len(full_df):
        df, _ = train_test_split(
            full_df, 
            train_size=sample_size, 
            stratify=full_df['label'], 
            random_state=42
        )
    else:
        df = full_df.copy()
    print(f"Sampled class ratios:\n{df['label'].value_counts(normalize=True)}")

    # 2.3 Separate target and feature variables
    X = df.drop(columns=['label', 'url'], errors='ignore')
    y = df['label']

    # 2.4 Train-Test Split (Holdout Validation split)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    print(f"Train size: {X_train.shape}, Test size: {X_test.shape}")

    # Define numeric features & categoricals
    # Keep strictly lexical columns (Option A)
    lexical_numeric_cols = [
        'URLLength', 'DomainLength', 'IsDomainIP', 'TLDLength', 'NoOfSubDomain', 
        'HasObfuscation', 'NoOfObfuscatedChar', 'ObfuscationRatio', 'NoOfLettersInURL', 
        'LetterRatioInURL', 'NoOfDegitsInURL', 'DegitRatioInURL', 'NoOfEqualsInURL', 
        'NoOfQMarkInURL', 'NoOfAmpersandInURL', 'NoOfOtherSpecialCharsInURL', 
        'SpacialCharRatioInURL', 'IsHTTPS'
    ]
    engineered_cols = ['ObfuscationURLLengthInteraction', 'SubdomainPerDomainLength', 'SpecialCharPerLetter']
    final_numeric_cols = lexical_numeric_cols + engineered_cols
    
    categorical_cols = []
    
    # Restrict X_train and X_test to only contain the whitelisted lexical columns
    X_train = X_train[lexical_numeric_cols]
    X_test = X_test[lexical_numeric_cols]

    # 2.5 Data Preprocessing & Pipeline Architecture
    print("Structuring sklearn preprocessors...")
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, final_numeric_cols)
        ]
    )

    # --------------------------------------------------------------------------
    # 3. Establish Baseline and Candidate Models
    # --------------------------------------------------------------------------
    print("\n--- Phase 3: Establishing Baselines & Candidates ---")
    
    # 3.1 Logistic Regression Baseline
    baseline_pipeline = Pipeline(steps=[
        ('extractor', PhishingFeatureExtractor()),
        ('preprocessor', preprocessor),
        ('variance', VarianceThreshold(threshold=0.01)),
        ('collinear', CollinearityFilter(threshold=0.90)),
        ('classifier', LogisticRegression(max_iter=1000, random_state=42))
    ])
    
    print("Fitting baseline Logistic Regression...")
    start_time = time.time()
    baseline_pipeline.fit(X_train, y_train)
    baseline_acc = baseline_pipeline.score(X_test, y_test)
    print(f"Baseline Test Accuracy: {baseline_acc * 100:.2f}% (Time: {time.time() - start_time:.2f}s)")

    # 3.2 Define Advanced Candidate Model Dictionary
    candidates = {
        'RandomForest': RandomForestClassifier(random_state=42),
        'GradientBoosting': GradientBoostingClassifier(random_state=42)
    }

    best_candidate_name = None
    best_candidate_acc = 0.0
    best_candidate_clf = None

    for name, clf in candidates.items():
        pipeline = Pipeline(steps=[
            ('extractor', PhishingFeatureExtractor()),
            ('preprocessor', preprocessor),
            ('variance', VarianceThreshold(threshold=0.01)),
            ('collinear', CollinearityFilter(threshold=0.90)),
            ('classifier', clf)
        ])
        
        print(f"Training advanced model: {name}...")
        start_time = time.time()
        pipeline.fit(X_train, y_train)
        acc = pipeline.score(X_test, y_test)
        print(f"{name} Test Accuracy: {acc * 100:.2f}% (Time: {time.time() - start_time:.2f}s)")
        
        if acc > best_candidate_acc:
            best_candidate_acc = acc
            best_candidate_name = name
            best_candidate_clf = clf

    print(f"\nWinner Candidate Model: {best_candidate_name} with {best_candidate_acc * 100:.2f}% accuracy")

    # --------------------------------------------------------------------------
    # 4. Hyperparameter Optimization & Tuning
    # --------------------------------------------------------------------------
    print("\n--- Phase 4: Hyperparameter Optimization & Tuning ---")
    
    # Define a parameter search space based on the winning classifier
    tuning_pipeline = Pipeline(steps=[
        ('extractor', PhishingFeatureExtractor()),
        ('preprocessor', preprocessor),
        ('variance', VarianceThreshold(threshold=0.01)),
        ('collinear', CollinearityFilter(threshold=0.90)),
        ('classifier', best_candidate_clf)
    ])

    if best_candidate_name == 'RandomForest':
        param_dist = {
            'classifier__n_estimators': [50, 100, 150],
            'classifier__max_depth': [10, 15, 20, None],
            'classifier__min_samples_split': [2, 5, 10]
        }
    else:  # GradientBoosting
        param_dist = {
            'classifier__n_estimators': [50, 100, 150],
            'classifier__learning_rate': [0.01, 0.1, 0.2],
            'classifier__max_depth': [3, 5, 8]
        }

    print(f"Running Systematic Random Search with 3-Fold Stratified CV on {best_candidate_name}...")
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    search = RandomizedSearchCV(
        tuning_pipeline, 
        param_distributions=param_dist, 
        n_iter=6, 
        cv=cv, 
        scoring='f1', 
        random_state=42, 
        n_jobs=-1
    )
    
    start_time = time.time()
    search.fit(X_train, y_train)
    print(f"Hyperparameter tuning completed in {time.time() - start_time:.2f}s")
    print(f"Optimal Parameters: {search.best_params_}")
    print(f"Best Validation F1 Score: {search.best_score_ * 100:.2f}%")

    # Select final production pipeline
    production_pipeline = search.best_estimator_

    # --------------------------------------------------------------------------
    # 5. Rigorous Evaluation
    # --------------------------------------------------------------------------
    print("\n--- Phase 5: Rigorous Holdout Evaluation ---")
    
    y_pred = production_pipeline.predict(X_test)
    y_pred_proba = production_pipeline.predict_proba(X_test)[:, 1]

    # Evaluation metrics
    report = classification_report(y_test, y_pred, target_names=["Legitimate (0)", "Phishing (1)"])
    conf_matrix = confusion_matrix(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_pred_proba)

    print("Classification Report:")
    print(report)
    print("Confusion Matrix:")
    print(conf_matrix)
    print(f"ROC-AUC Score: {roc_auc:.4f}")

    # Save metrics block
    with open(METRICS_EXPORT_PATH, "w") as f:
        f.write("S.H.I.E.L.D. Pipeline Evaluation Report\n")
        f.write("======================================\n")
        f.write(f"Sample Trained: {sample_size} records\n")
        f.write(f"Winning Model Classifier: {best_candidate_name}\n")
        f.write(f"Optimal Hyperparameters: {search.best_params_}\n")
        f.write(f"ROC-AUC Score: {roc_auc:.4f}\n\n")
        f.write("Classification Details:\n")
        f.write(report)
        f.write("\nConfusion Matrix:\n")
        f.write(np.array2string(conf_matrix))

    print(f"Evaluation metrics written to {METRICS_EXPORT_PATH}")

    # --------------------------------------------------------------------------
    # 6. Pipeline & Artifact Export
    # --------------------------------------------------------------------------
    print("\n--- Phase 6: Production Pipeline Export ---")
    print(f"Serializing complete production pipeline to {MODEL_EXPORT_PATH}...")
    joblib.dump(production_pipeline, MODEL_EXPORT_PATH)
    print("Artifact successfully saved. Production ready.")
    print("==================================================================")


if __name__ == "__main__":
    # Run the pipeline with a representative sample size
    run_ml_pipeline(sample_size=30000)
