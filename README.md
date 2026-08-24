# S.H.I.E.L.D. — Smart Heuristic Intelligence for Evaluating Links & Domains

A real-time, end-to-end intelligent security system designed to protect users from malicious hyperlink attacks. S.H.I.E.L.D. combines a hyperparameter-optimized scikit-learn machine learning classifier, a multi-consensus reputation engine, and a dual-client system (a React web application featuring cinematic transition sequences and a Manifest V3 browser extension).

### LIVE PROJECT LINK:  https://s-h-i-e-l-d-psi.vercel.app/

---

## 1. System Architecture

S.H.I.E.L.D. leverages a distributed architecture connecting lightweight endpoints to a Python FastAPI classification engine.

```mermaid
graph TD
    subgraph Clients [Client Layer]
        Ext[Chrome Extension MV3 Popup & Badge]
        Dashboard[React Web Dashboard]
    end

    subgraph API [FastAPI Backend Service]
        Endpoint[/api/scan]
        AdvEndpoint[/api/adversarial-test]
        HistoryEndpoint[/api/history]
        
        direction_engine{Consensus Risk Engine}
        resolver[Redirect Resolver]
        extractor[Lexical Feature Extractor]
        model[Random Forest Pipeline Model]
        reputation[Reputation Check / PhishTank]
        db[(SQLite Database)]
    end

    Ext -->|POST /api/scan| Endpoint
    Dashboard -->|POST /api/scan| Endpoint
    Dashboard -->|POST /api/adversarial-test| AdvEndpoint
    Dashboard -->|GET /api/history| HistoryEndpoint

    Endpoint --> resolver
    resolver -->|Resolved Destination URL| extractor
    extractor -->|19 Lexical Variables| model
    Endpoint --> reputation
    
    model --> direction_engine
    reputation --> direction_engine
    direction_engine -->|Log Transaction| db
    direction_engine -->|Verdict & Explanations| Endpoint
```

---

## 2. Machine Learning Pipeline & Lifecycle

The ML workflow is designed defensively, guaranteeing **zero data leakage** during preprocessing and cross-validation by encapsulating the entire data transformation pipeline.

### A. Preprocessing & Leakage Controls
1. **Stratified Sampling**: Extracted a balanced representative sample of 30,000 records from the **PhiUSIIL Phishing URL Dataset** (235,795 total records) to maintain exactly **57.19% legitimate** and **42.81% phishing** class ratios.
2. **Strict Split-First Lifecycle**: Performed `train_test_split` (80% Train, 20% Holdout Test) **prior** to any preprocessing.
3. **Column Preprocessor (scikit-learn ColumnTransformer)**:
   - **Numeric Features**: Imputed missing values using the median value of the training split and scaled using `StandardScaler`.
   - **Categorical Features (TLD)**: Imputed using `most_frequent` and one-hot encoded using `OneHotEncoder(handle_unknown='ignore')` to absorb unseen categories gracefully in production.

### B. Feature Engineering & Selection
*   **Custom Interaction Extractor (`PhishingFeatureExtractor`)**:
    - `ObfuscationURLLengthInteraction` = `ObfuscationRatio` $\times$ `URLLength`
    - `SubdomainPerDomainLength` = `NoOfSubDomain` / (`DomainLength` + 1.0)
    - `SpecialCharPerLetter` = `SpacialCharRatioInURL` / (`LetterRatioInURL` + $10^{-5}$)
*   **Low Variance Filter**: Automatically drops near-constant features with variance $< 0.01$ using `VarianceThreshold`.
*   **Collinearity Filter (`CollinearityFilter`)**: Dynamically computes correlation matrices on numerical features and drops features exceeding a Pearson correlation of **0.90** within the pipeline training folds.

### C. Whitelisted Lexical Features (19 Columns)
To keep the scan offline and instant, we whitelist **only** features that can be extracted directly from the URL string:
*   `URLLength`, `DomainLength`, `TLDLength`, `NoOfSubDomain`
*   `IsDomainIP`, `IsHTTPS`, `HasObfuscation`
*   `NoOfObfuscatedChar`, `ObfuscationRatio`
*   `NoOfLettersInURL`, `LetterRatioInURL`, `NoOfDegitsInURL`, `DegitRatioInURL`
*   `NoOfEqualsInURL`, `NoOfQMarkInURL`, `NoOfAmpersandInURL`, `NoOfOtherSpecialCharsInURL`
*   `SpacialCharRatioInURL`, `TLD`

---

## 3. Model Performance & Evaluation

We trained baseline and candidate estimators, optimized hyperparameters via stratified randomized searches, and evaluated on the holdout validation set ($N = 6,000$).

### A. Model Performance Matrix
*   **Logistic Regression (Baseline)**: `99.57%` accuracy.
*   **Gradient Boosting Classifier**: `99.60%` accuracy.
*   **Random Forest Classifier (Winner)**: **`99.72%` accuracy** (Fitted with `n_estimators=150`, `max_depth=20`, `min_samples_split=10`).

### B. Validation Metrics
*   **F1-Score**: **`99.58%`** (Harmonic mean of precision and recall; ensures stable classification on skewed distributions).
*   **ROC-AUC Score**: **`0.9992` (99.92%)** (Reflects outstanding true-positive versus false-positive discrimination thresholds).

### C. Confusion Matrix (Holdout Validation)
```
                  Predicted Phishing (0)   Predicted Legitimate (1)
Actual Phishing            2,557                      12   (False Positives)
Actual Legitimate              4                      3,427   (False Negatives)
```

---

## 4. Key Architectural Trade-offs & Rationales

### Rationale 1: Lexical-Only vs. HTML Scraping
*   **Scraping Model (Dropped)**: Fetching page code in real-time gives access to HTML DOM features (number of iframes, script line length) but introduces high network latency, requires active connection bandwidth, fails on offline pages, and gets blocked by Cloudflare.
*   **Lexical Whitelist (Adopted)**: Extracts string features under **5 milliseconds**, runs entirely offline, is immune to web scraping blocks, and remains robust against attackers cloning target HTML structures perfectly.

### Rationale 2: Evaluation Metrics Selection
*   **F1-Score over Simple Accuracy**: In phishing, a False Negative (letting a phishing page load) is catastrophic for user security, while a False Positive (blocking a safe page) ruins the user experience. F1-Score balances these errors equally.
*   **ROC-AUC over Accuracy**: Verifies the classifier's boundary probability thresholds, guaranteeing confidence calibrations remain stable.

---

## 5. Security Safeguards & Cyberattack Coverage

S.H.I.E.L.D. guards against the following URL-related attack patterns:

| Attack Category | Threat Mechanism | S.H.I.E.L.D. Safeguard |
|---|---|---|
| **Spear Phishing** | Direct links targeting credentials or payments. | Flagged via high digits/special ratios and `ObfuscationURLLengthInteraction`. |
| **Typosquatting** | Lookalike domains mimicking trusted brands (e.g., `paypa1.com`). | Flagged via `TLDLength`, `DomainLength`, and local brand regex override signature checks. |
| **Path Obfuscation** | Hiding redirects behind long, nested paths. | Flagged via `NoOfOtherSpecialCharsInURL`, `NoOfEqualsInURL`, and `SpacialCharRatioInURL`. |
| **IP Substitutions** | Using raw IP addresses (e.g., `http://172.56.21.89/`) to bypass DNS filters. | Flagged instantly by the `IsDomainIP` detector. |
| **Consensus Override** | Evading machine learning classifiers via lookalikes. | Overridden by query hits against the **PhishTank** threat database and regex matches. |

---

## 6. Local Setup & Execution

### 1. Start the Backend API (FastAPI)
```bash
# Navigate to workspace root
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --port 8000
```
*   Backend API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Start the Web App Dashboard (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
*   Dashboard will be available at [http://localhost:5173/](http://localhost:5173/).

### 3. Load the Chrome Extension (Manifest V3)
1. Navigate Chrome to `chrome://extensions/`.
2. Toggle **Developer mode** to **ON** (top-right corner).
3. Click **Load unpacked** (top-left corner).
4. Select the `extension` folder inside this repository root.
