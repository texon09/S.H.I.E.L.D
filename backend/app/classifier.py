import os
import re
import sys
from urllib.parse import urlparse
import ipaddress
import tldextract
import numpy as np
import pandas as pd
import joblib

# Workaround to resolve unpickling of custom pipeline classes
try:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    import backend.scripts.train_production_pipeline as train_script
    sys.modules['__main__'].PhishingFeatureExtractor = train_script.PhishingFeatureExtractor
    sys.modules['__main__'].CollinearityFilter = train_script.CollinearityFilter
except Exception:
    pass

FEATURE_NAMES = [
    'URLLength', 'DomainLength', 'IsDomainIP', 'TLDLength', 'NoOfSubDomain', 
    'HasObfuscation', 'NoOfObfuscatedChar', 'ObfuscationRatio', 'NoOfLettersInURL', 
    'LetterRatioInURL', 'NoOfDegitsInURL', 'DegitRatioInURL', 'NoOfEqualsInURL', 
    'NoOfQMarkInURL', 'NoOfAmpersandInURL', 'NoOfOtherSpecialCharsInURL', 
    'SpacialCharRatioInURL', 'IsHTTPS', 'TLD'
]

FEATURE_EXPLANATIONS = {
    'URLLength': {
        'risky_template': "URL length is long ({value} characters)",
        'safe_template': "URL length is standard ({value} characters)",
        'risky_threshold': 80
    },
    'DomainLength': {
        'risky_template': "Domain length is long ({value} characters)",
        'safe_template': "Domain length is standard ({value} characters)",
        'risky_threshold': 24
    },
    'IsDomainIP': {
        'risky_template': "Domain uses raw IP address instead of name",
        'safe_template': "Domain uses a standard hostname",
        'risky_threshold': 0.5
    },
    'TLDLength': {
        'risky_template': "Unusual TLD suffix length ({value} characters)",
        'safe_template': "Standard TLD suffix length ({value} characters)",
        'risky_threshold': 4
    },
    'NoOfSubDomain': {
        'risky_template': "Uses multiple subdomains ({value}) to mimic brand names",
        'safe_template': "Standard subdomain count ({value})",
        'risky_threshold': 2
    },
    'HasObfuscation': {
        'risky_template': "URL contains @ or obfuscating keywords",
        'safe_template': "Clean URL without keyword obfuscations",
        'risky_threshold': 0.5
    },
    'NoOfObfuscatedChar': {
        'risky_template': "Contains high count of obfuscating characters ({value})",
        'safe_template': "Few or no obfuscating characters ({value})",
        'risky_threshold': 1
    },
    'ObfuscationRatio': {
        'risky_template': "Suspicious percentage of obfuscated characters ({value:.1%})",
        'safe_template': "Standard character ratio",
        'risky_threshold': 0.05
    },
    'LetterRatioInURL': {
        'risky_template': "Low letter density in URL ({value:.1%})",
        'safe_template': "Standard letter density ({value:.1%})",
        'risky_threshold': 0.40,
        'invert': True
    },
    'NoOfDegitsInURL': {
        'risky_template': "High count of digits in URL ({value})",
        'safe_template': "Standard digits count ({value})",
        'risky_threshold': 8
    },
    'DegitRatioInURL': {
        'risky_template': "High numeric digit ratio in URL ({value:.1%})",
        'safe_template': "Standard digit ratio ({value:.1%})",
        'risky_threshold': 0.15
    },
    'NoOfEqualsInURL': {
        'risky_template': "Multiple parameters found in URL query ({value} '=' signs)",
        'safe_template': "Few or no parameters in URL query ({value})",
        'risky_threshold': 2
    },
    'NoOfQMarkInURL': {
        'risky_template': "Contains multiple query parameters ({value} '?')",
        'safe_template': "Clean query string ({value})",
        'risky_threshold': 1
    },
    'NoOfAmpersandInURL': {
        'risky_template': "Multiple query parameters linked ({value} '&')",
        'safe_template': "Standard parameter counts ({value})",
        'risky_threshold': 2
    },
    'NoOfOtherSpecialCharsInURL': {
        'risky_template': "Excessive special characters like slashes, dots, and hyphens ({value})",
        'safe_template': "Standard special character counts ({value})",
        'risky_threshold': 8
    },
    'SpacialCharRatioInURL': {
        'risky_template': "High ratio of special characters in URL ({value:.1%})",
        'safe_template': "Standard special character ratio ({value:.1%})",
        'risky_threshold': 0.20
    },
    'IsHTTPS': {
        'risky_template': "Lacks secure HTTPS encryption (uses HTTP)",
        'safe_template': "Uses secure HTTPS encryption",
        'risky_threshold': 0.5,
        'invert': True
    }
}

def extract_features(url: str) -> dict:
    # Normalize URL representation for parsing
    parsed_url = url
    if not url.startswith(('http://', 'https://')):
        parsed_url = 'http://' + url
    
    try:
        parsed = urlparse(parsed_url)
        domain = parsed.netloc
    except Exception:
        domain = ""
        parsed = None

    url_len = len(url)
    domain_clean = domain.split(':')[0] if domain else ""
    domain_len = len(domain_clean)

    # IsDomainIP
    is_ip = 0
    if domain_clean:
        if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain_clean):
            is_ip = 1
        else:
            try:
                ipaddress.ip_address(domain_clean)
                is_ip = 1
            except ValueError:
                is_ip = 0

    # TLD extraction using tldextract
    tld = ""
    subdomain_count = 0
    if domain_clean:
        try:
            ext = tldextract.extract(parsed_url)
            tld = ext.suffix
            subdomain = ext.subdomain
            if subdomain:
                subdomain_count = len(subdomain.split('.'))
        except Exception:
            pass
    tld_len = len(tld)

    # Obfuscation characters (standard special chars used to hide keywords)
    obfuscated_chars = ['%', '@', ':', ';', '$']
    num_obfuscated_char = sum(url.count(c) for c in obfuscated_chars)
    has_obfuscation = 1 if num_obfuscated_char > 0 or '@' in url else 0
    obfuscation_ratio = num_obfuscated_char / url_len if url_len > 0 else 0.0

    # Alphabet and digits
    num_letters = sum(c.isalpha() for c in url)
    letter_ratio = num_letters / url_len if url_len > 0 else 0.0
    num_digits = sum(c.isdigit() for c in url)
    digit_ratio = num_digits / url_len if url_len > 0 else 0.0

    # Specific characters
    num_equals = url.count('=')
    num_qmark = url.count('?')
    num_ampersand = url.count('&')
    
    # Other special characters (hyphens, underscores, slashes, etc.)
    other_specials = ['-', '_', '/', '\\', '+', '.']
    num_other_specials = sum(url.count(c) for c in other_specials)
    special_ratio = num_other_specials / url_len if url_len > 0 else 0.0

    # IsHTTPS
    is_https = 1 if url.lower().startswith('https://') else 0

    return {
        'URLLength': url_len,
        'DomainLength': domain_len,
        'IsDomainIP': is_ip,
        'TLD': tld if tld else 'com',
        'TLDLength': tld_len,
        'NoOfSubDomain': subdomain_count,
        'HasObfuscation': has_obfuscation,
        'NoOfObfuscatedChar': num_obfuscated_char,
        'ObfuscationRatio': obfuscation_ratio,
        'NoOfLettersInURL': num_letters,
        'LetterRatioInURL': letter_ratio,
        'NoOfDegitsInURL': num_digits,
        'DegitRatioInURL': digit_ratio,
        'NoOfEqualsInURL': num_equals,
        'NoOfQMarkInURL': num_qmark,
        'NoOfAmpersandInURL': num_ampersand,
        'NoOfOtherSpecialCharsInURL': num_other_specials,
        'SpacialCharRatioInURL': special_ratio,
        'IsHTTPS': is_https
    }

class PhishingClassifier:
    def __init__(self, model_dir: str = None):
        if model_dir is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            model_dir = os.path.join(current_dir, '..', 'data')
        
        self.model_path = os.path.join(model_dir, 'phishing_pipeline.pkl')
        self.model = None
        self.feature_importances = {}
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                # Add Python sys.path mapping to load PhishingFeatureExtractor & CollinearityFilter
                sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
                import backend.scripts.train_production_pipeline as train_script
                sys.modules['__main__'].PhishingFeatureExtractor = train_script.PhishingFeatureExtractor
                sys.modules['__main__'].CollinearityFilter = train_script.CollinearityFilter
                
                self.model = joblib.load(self.model_path)
                
                # Fetch feature importances of the fitted Random Forest classifier
                rf_classifier = self.model.named_steps['classifier']
                collinear_filter = self.model.named_steps['collinear']
                preprocessor = self.model.named_steps['preprocessor']
                
                # Get the preprocessor feature names
                numeric_cols = [c for c in FEATURE_NAMES if c != 'TLD']
                engineered_cols = ['ObfuscationURLLengthInteraction', 'SubdomainPerDomainLength', 'SpecialCharPerLetter']
                all_numeric_cols = numeric_cols + engineered_cols
                
                onehot_cols = list(preprocessor.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(['TLD']))
                all_features = all_numeric_cols + onehot_cols
                
                # Filter by kept indices in collinearity filter
                kept_features = [all_features[i] for i in collinear_filter.keep_indices_]
                importances = rf_classifier.feature_importances_
                
                # Match them to input feature names
                self.feature_importances = {}
                for idx, feat_name in enumerate(kept_features):
                    base_name = feat_name
                    if feat_name.startswith('TLD_'):
                        base_name = 'TLD'
                    elif feat_name == 'ObfuscationURLLengthInteraction':
                        base_name = 'ObfuscationRatio'
                    elif feat_name == 'SubdomainPerDomainLength':
                        base_name = 'NoOfSubDomain'
                    elif feat_name == 'SpecialCharPerLetter':
                        base_name = 'SpacialCharRatioInURL'
                        
                    self.feature_importances[base_name] = self.feature_importances.get(base_name, 0.0) + importances[idx]
                    
            except Exception as e:
                print(f"Error loading pipeline: {e}")
                self.model = None
        else:
            print(f"Model path {self.model_path} does not exist. Please run training script first.")
            self.model = None

    def predict(self, url: str) -> tuple:
        features_dict = extract_features(url)
        
        # Format features as DataFrame matching FEATURE_NAMES order
        X = pd.DataFrame([features_dict], columns=FEATURE_NAMES)

        if self.model is None:
            # Heuristic model if pipeline not loaded
            risk_score = 0.0
            if features_dict['IsDomainIP'] == 1: risk_score += 0.4
            if features_dict['IsHTTPS'] == 0: risk_score += 0.3
            if features_dict['URLLength'] > 80: risk_score += 0.2
            
            confidence = min(max(risk_score, 0.0), 1.0)
            verdict = "phishing" if confidence >= 0.5 else "legitimate"
            importances = {name: 1.0/len(FEATURE_EXPLANATIONS) for name in FEATURE_EXPLANATIONS.keys()}
        else:
            # Predict using joblib pipeline
            prob = self.model.predict_proba(X)[0] # [prob_legit, prob_phish]
            confidence = float(prob[1]) # Phishing probability
            verdict = "phishing" if confidence >= 0.5 else "legitimate"
            importances = self.feature_importances

        # Calculate explanations based on active features and model importances
        explanations = []
        for name in FEATURE_EXPLANATIONS.keys():
            val = features_dict.get(name, 0)
            config = FEATURE_EXPLANATIONS[name]
            
            is_risky = False
            if config.get('invert', False):
                if val < config['risky_threshold']:
                    is_risky = True
            else:
                if val >= config['risky_threshold']:
                    is_risky = True

            weight = importances.get(name, 0.0)
            
            if is_risky:
                label = config['risky_template'].format(value=val)
                direction = "risky"
            else:
                label = config['safe_template'].format(value=val)
                direction = "safe"
                
            explanations.append({
                "label": label,
                "weight": round(weight, 4),
                "direction": direction
            })
            
        explanations = sorted(explanations, key=lambda x: (x['direction'] == 'risky', x['weight']), reverse=True)
        top_features = explanations[:6]

        return verdict, confidence, top_features
